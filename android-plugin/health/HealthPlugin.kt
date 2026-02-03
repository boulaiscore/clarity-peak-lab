/**
 * NeuroLoop Pro - Health Connect Plugin for Android
 * 
 * Reads health data from Android Health Connect:
 * - Sleep Sessions (with stages if available)
 * - HRV RMSSD (Heart Rate Variability)
 * - Resting Heart Rate
 * 
 * Data Types:
 * - SleepSessionRecord
 * - HeartRateVariabilityRmssdRecord
 * - RestingHeartRateRecord
 */

package app.lovable.f84e62a560cb4db59ded2b07c99a786f.plugins

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.ZoneOffset
import java.time.format.DateTimeFormatter

@CapacitorPlugin(name = "HealthPlugin")
class HealthPlugin : Plugin() {

    private var healthConnectClient: HealthConnectClient? = null
    private val scope = CoroutineScope(Dispatchers.Main)

    private val PERMISSIONS = setOf(
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class)
    )

    override fun load() {
        super.load()
        initHealthConnect()
    }

    private fun initHealthConnect() {
        val context = context ?: return
        
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            healthConnectClient = HealthConnectClient.getOrCreate(context)
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val context = context
        if (context == null) {
            call.resolve(JSObject().put("available", false))
            return
        }

        val status = HealthConnectClient.getSdkStatus(context)
        val available = status == HealthConnectClient.SDK_AVAILABLE
        
        call.resolve(JSObject().put("available", available))
    }

    @PluginMethod
    fun checkPermissions(call: PluginCall) {
        val client = healthConnectClient
        if (client == null) {
            call.resolve(JSObject().put("permissions", createDeniedPermissions()))
            return
        }

        scope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                
                val permissions = JSObject()
                permissions.put("sleep", 
                    if (granted.contains(HealthPermission.getReadPermission(SleepSessionRecord::class))) 
                        "granted" else "not_determined"
                )
                permissions.put("hrv", 
                    if (granted.contains(HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class))) 
                        "granted" else "not_determined"
                )
                permissions.put("restingHr", 
                    if (granted.contains(HealthPermission.getReadPermission(RestingHeartRateRecord::class))) 
                        "granted" else "not_determined"
                )
                
                call.resolve(JSObject().put("permissions", permissions))
            } catch (e: Exception) {
                call.resolve(JSObject().put("permissions", createDeniedPermissions()))
            }
        }
    }

    @PluginMethod
    fun requestPermissions(call: PluginCall) {
        val context = this.context
        if (context == null) {
            call.reject("Context not available")
            return
        }

        // Check if Health Connect is installed
        val status = HealthConnectClient.getSdkStatus(context)
        if (status == HealthConnectClient.SDK_UNAVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        
        if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            // Open Play Store to install/update Health Connect
            openHealthConnectPlayStore(context)
            call.reject("Health Connect app not installed. Opening Play Store.")
            return
        }

        val client = healthConnectClient
        if (client == null) {
            initHealthConnect()
            if (healthConnectClient == null) {
                call.reject("Failed to initialize Health Connect")
                return
            }
        }

        // Create permission request contract
        val permissionContract = PermissionController.createRequestPermissionResultContract()
        
        scope.launch {
            try {
                // Check which permissions are already granted
                val grantedPermissions = healthConnectClient!!.permissionController.getGrantedPermissions()
                val permissionsToRequest = PERMISSIONS - grantedPermissions
                
                if (permissionsToRequest.isEmpty()) {
                    // All permissions already granted
                    call.resolve(JSObject()
                        .put("granted", true)
                        .put("permissions", createGrantedPermissions())
                    )
                    return@launch
                }
                
                // Launch the permission request using Activity
                val activity = activity
                if (activity != null) {
                    val intent = PermissionController.createRequestPermissionResultContract()
                        .createIntent(context, permissionsToRequest)
                    
                    // For simplicity, we'll open the Health Connect permissions screen
                    // In production, you'd want to use ActivityResultLauncher
                    activity.startActivity(intent)
                    
                    // Return pending - user needs to grant permissions
                    call.resolve(JSObject()
                        .put("granted", false)
                        .put("permissions", createNotDeterminedPermissions())
                    )
                } else {
                    call.reject("Activity not available")
                }
            } catch (e: Exception) {
                call.reject("Failed to request permissions: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun readSleep(call: PluginCall) {
        val startDateStr = call.getString("startDate")
        val endDateStr = call.getString("endDate")
        
        if (startDateStr == null || endDateStr == null) {
            call.reject("startDate and endDate are required")
            return
        }

        val client = healthConnectClient
        if (client == null) {
            call.resolve(JSObject().put("records", JSArray()))
            return
        }

        scope.launch {
            try {
                val startTime = Instant.parse(startDateStr)
                val endTime = Instant.parse(endDateStr)
                
                val request = ReadRecordsRequest(
                    recordType = SleepSessionRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
                
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(request)
                }
                
                val records = JSArray()
                val formatter = DateTimeFormatter.ISO_INSTANT
                
                for (session in response.records) {
                    val record = JSObject()
                    record.put("startDate", formatter.format(session.startTime))
                    record.put("endDate", formatter.format(session.endTime))
                    
                    val durationMin = java.time.Duration.between(session.startTime, session.endTime).toMinutes()
                    record.put("durationMin", durationMin.toInt())
                    
                    // Parse stages if available
                    val stages = JSObject()
                    var remMin = 0
                    var deepMin = 0
                    var lightMin = 0
                    var awakeMin = 0
                    
                    for (stage in session.stages) {
                        val stageMin = java.time.Duration.between(stage.startTime, stage.endTime).toMinutes().toInt()
                        when (stage.stage) {
                            SleepSessionRecord.STAGE_TYPE_REM -> remMin += stageMin
                            SleepSessionRecord.STAGE_TYPE_DEEP -> deepMin += stageMin
                            SleepSessionRecord.STAGE_TYPE_LIGHT -> lightMin += stageMin
                            SleepSessionRecord.STAGE_TYPE_AWAKE -> awakeMin += stageMin
                            SleepSessionRecord.STAGE_TYPE_SLEEPING -> lightMin += stageMin // Unknown goes to light
                        }
                    }
                    
                    stages.put("rem", remMin)
                    stages.put("deep", deepMin)
                    stages.put("core", lightMin)
                    stages.put("awake", awakeMin)
                    record.put("stages", stages)
                    
                    // Calculate efficiency
                    val totalSleep = remMin + deepMin + lightMin
                    val totalTime = totalSleep + awakeMin
                    val efficiency = if (totalTime > 0) totalSleep.toDouble() / totalTime else 0.85
                    record.put("efficiency", efficiency)
                    
                    records.put(record)
                }
                
                call.resolve(JSObject().put("records", records))
            } catch (e: Exception) {
                call.reject("Failed to read sleep data: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun readHRV(call: PluginCall) {
        val startDateStr = call.getString("startDate")
        val endDateStr = call.getString("endDate")
        
        if (startDateStr == null || endDateStr == null) {
            call.reject("startDate and endDate are required")
            return
        }

        val client = healthConnectClient
        if (client == null) {
            call.resolve(JSObject().put("records", JSArray()))
            return
        }

        scope.launch {
            try {
                val startTime = Instant.parse(startDateStr)
                val endTime = Instant.parse(endDateStr)
                
                val request = ReadRecordsRequest(
                    recordType = HeartRateVariabilityRmssdRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
                
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(request)
                }
                
                val records = JSArray()
                val formatter = DateTimeFormatter.ISO_INSTANT
                
                for (sample in response.records) {
                    val record = JSObject()
                    record.put("timestamp", formatter.format(sample.time))
                    record.put("value", sample.heartRateVariabilityMillis)
                    record.put("metric", "rmssd") // Android uses RMSSD
                    records.put(record)
                }
                
                call.resolve(JSObject().put("records", records))
            } catch (e: Exception) {
                call.reject("Failed to read HRV data: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun readRestingHR(call: PluginCall) {
        val startDateStr = call.getString("startDate")
        val endDateStr = call.getString("endDate")
        
        if (startDateStr == null || endDateStr == null) {
            call.reject("startDate and endDate are required")
            return
        }

        val client = healthConnectClient
        if (client == null) {
            call.resolve(JSObject().put("records", JSArray()))
            return
        }

        scope.launch {
            try {
                val startTime = Instant.parse(startDateStr)
                val endTime = Instant.parse(endDateStr)
                
                val request = ReadRecordsRequest(
                    recordType = RestingHeartRateRecord::class,
                    timeRangeFilter = TimeRangeFilter.between(startTime, endTime)
                )
                
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(request)
                }
                
                val records = JSArray()
                val formatter = DateTimeFormatter.ISO_INSTANT
                
                for (sample in response.records) {
                    val record = JSObject()
                    record.put("timestamp", formatter.format(sample.time))
                    record.put("bpm", sample.beatsPerMinute)
                    records.put(record)
                }
                
                call.resolve(JSObject().put("records", records))
            } catch (e: Exception) {
                call.reject("Failed to read resting HR data: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun openHealthConnectSettings(call: PluginCall) {
        val context = this.context ?: run {
            call.reject("Context not available")
            return
        }
        
        try {
            val intent = Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            // If Health Connect settings not available, open the app
            openHealthConnectPlayStore(context)
            call.resolve()
        }
    }

    // Helper methods
    
    private fun openHealthConnectPlayStore(context: Context) {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("market://details?id=com.google.android.apps.healthdata")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            // If Play Store not available, open web
            val intent = Intent(Intent.ACTION_VIEW).apply {
                data = Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(intent)
        }
    }

    private fun createDeniedPermissions(): JSObject {
        return JSObject().apply {
            put("sleep", "denied")
            put("hrv", "denied")
            put("restingHr", "denied")
        }
    }

    private fun createGrantedPermissions(): JSObject {
        return JSObject().apply {
            put("sleep", "granted")
            put("hrv", "granted")
            put("restingHr", "granted")
        }
    }

    private fun createNotDeterminedPermissions(): JSObject {
        return JSObject().apply {
            put("sleep", "not_determined")
            put("hrv", "not_determined")
            put("restingHr", "not_determined")
        }
    }
}
