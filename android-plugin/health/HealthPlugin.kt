package com.looma.plugins

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResult
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateVariabilityRmssdRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.SleepSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.time.Duration
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import kotlin.math.abs

/**
 * Read-only Health Connect bridge. It returns only the physiological fields
 * required by LOOMA and never writes health data back to the system store.
 */
@CapacitorPlugin(name = "HealthPlugin")
class HealthPlugin : Plugin() {
    private var healthConnectClient: HealthConnectClient? = null
    private val pluginScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private val permissions = setOf(
        HealthPermission.getReadPermission(SleepSessionRecord::class),
        HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class),
    )

    override fun load() {
        super.load()
        initializeClient()
    }

    override fun handleOnDestroy() {
        pluginScope.cancel()
        super.handleOnDestroy()
    }

    private fun initializeClient() {
        if (HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE) {
            healthConnectClient = HealthConnectClient.getOrCreate(context)
        }
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        call.resolve(
            JSObject().put(
                "available",
                HealthConnectClient.getSdkStatus(context) == HealthConnectClient.SDK_AVAILABLE,
            ),
        )
    }

    @PluginMethod
    override fun checkPermissions(call: PluginCall) {
        val client = healthConnectClient
        if (client == null) {
            call.resolve(JSObject().put("permissions", permissionPayload("denied")))
            return
        }

        pluginScope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val result = JSObject()
                    .put("sleep", stateFor(granted, HealthPermission.getReadPermission(SleepSessionRecord::class)))
                    .put("hrv", stateFor(granted, HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class)))
                    .put("restingHr", stateFor(granted, HealthPermission.getReadPermission(RestingHeartRateRecord::class)))
                call.resolve(JSObject().put("permissions", result))
            } catch (error: Exception) {
                call.reject("Could not inspect Health Connect permissions", error)
            }
        }
    }

    @PluginMethod
    override fun requestPermissions(call: PluginCall) {
        val status = HealthConnectClient.getSdkStatus(context)
        if (status == HealthConnectClient.SDK_UNAVAILABLE) {
            call.reject("Health Connect is not available on this device")
            return
        }
        if (status == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
            openHealthConnectPlayStore(context)
            call.reject("Health Connect is not installed or must be updated")
            return
        }

        if (healthConnectClient == null) initializeClient()
        val client = healthConnectClient ?: run {
            call.reject("Failed to initialize Health Connect")
            return
        }

        pluginScope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val missing = permissions - granted
                if (missing.isEmpty()) {
                    call.resolve(
                        JSObject()
                            .put("granted", true)
                            .put("permissions", permissionPayload("granted")),
                    )
                    return@launch
                }

                val intent = PermissionController
                    .createRequestPermissionResultContract()
                    .createIntent(context, missing)
                startActivityForResult(call, intent, "handleHealthPermissionsResult")
            } catch (error: Exception) {
                call.reject("Failed to request Health Connect permissions", error)
            }
        }
    }

    @ActivityCallback
    private fun handleHealthPermissionsResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        val client = healthConnectClient ?: run {
            call.reject("Health Connect is unavailable after authorization")
            return
        }

        pluginScope.launch {
            try {
                val granted = client.permissionController.getGrantedPermissions()
                val coreGranted = setOf(
                    HealthPermission.getReadPermission(SleepSessionRecord::class),
                    HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class),
                    HealthPermission.getReadPermission(RestingHeartRateRecord::class),
                ).any(granted::contains)
                val resultPayload = JSObject()
                    .put("sleep", stateFor(granted, HealthPermission.getReadPermission(SleepSessionRecord::class)))
                    .put("hrv", stateFor(granted, HealthPermission.getReadPermission(HeartRateVariabilityRmssdRecord::class)))
                    .put("restingHr", stateFor(granted, HealthPermission.getReadPermission(RestingHeartRateRecord::class)))
                call.resolve(
                    JSObject()
                        .put("granted", coreGranted)
                        .put("permissions", resultPayload),
                )
            } catch (error: Exception) {
                call.reject("Could not read Health Connect authorization result", error)
            }
        }
    }

    @PluginMethod
    fun readSleep(call: PluginCall) {
        val range = parseRange(call) ?: return
        val client = requireClient(call) ?: return
        pluginScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            SleepSessionRecord::class,
                            TimeRangeFilter.between(range.first, range.second),
                        ),
                    )
                }
                val records = JSArray()
                response.records.forEach { session ->
                    var rem = 0
                    var deep = 0
                    var core = 0
                    var awake = 0
                    session.stages.forEach { stage ->
                        val minutes = Duration.between(stage.startTime, stage.endTime).toMinutes().toInt()
                        when (stage.stage) {
                            SleepSessionRecord.STAGE_TYPE_REM -> rem += minutes
                            SleepSessionRecord.STAGE_TYPE_DEEP -> deep += minutes
                            SleepSessionRecord.STAGE_TYPE_LIGHT,
                            SleepSessionRecord.STAGE_TYPE_SLEEPING -> core += minutes
                            SleepSessionRecord.STAGE_TYPE_AWAKE,
                            SleepSessionRecord.STAGE_TYPE_AWAKE_IN_BED -> awake += minutes
                        }
                    }
                    val wallMinutes = Duration.between(session.startTime, session.endTime).toMinutes().toInt()
                    val stagedSleep = rem + deep + core
                    val durationMinutes = minOf(wallMinutes, if (stagedSleep > 0) stagedSleep else wallMinutes)
                    val efficiency = if (durationMinutes + awake > 0) {
                        durationMinutes.toDouble() / (durationMinutes + awake)
                    } else {
                        0.0
                    }
                    records.put(
                        JSObject()
                            .put("startDate", DateTimeFormatter.ISO_INSTANT.format(session.startTime))
                            .put("endDate", DateTimeFormatter.ISO_INSTANT.format(session.endTime))
                            .put("durationMin", durationMinutes)
                            .put("efficiency", efficiency)
                            .put(
                                "stages",
                                JSObject()
                                    .put("rem", rem)
                                    .put("deep", deep)
                                    .put("core", core)
                                    .put("awake", awake),
                            ),
                    )
                }
                call.resolve(JSObject().put("records", records))
            } catch (error: Exception) {
                call.reject("Failed to read sleep data", error)
            }
        }
    }

    @PluginMethod
    fun readHRV(call: PluginCall) {
        val range = parseRange(call) ?: return
        val client = requireClient(call) ?: return
        pluginScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            HeartRateVariabilityRmssdRecord::class,
                            TimeRangeFilter.between(range.first, range.second),
                        ),
                    )
                }
                val records = JSArray()
                response.records.forEach { sample ->
                    records.put(
                        JSObject()
                            .put("timestamp", DateTimeFormatter.ISO_INSTANT.format(sample.time))
                            .put("value", sample.heartRateVariabilityMillis)
                            .put("metric", "rmssd"),
                    )
                }
                call.resolve(JSObject().put("records", records))
            } catch (error: Exception) {
                call.reject("Failed to read HRV data", error)
            }
        }
    }

    @PluginMethod
    fun readRestingHR(call: PluginCall) {
        val range = parseRange(call) ?: return
        val client = requireClient(call) ?: return
        pluginScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            RestingHeartRateRecord::class,
                            TimeRangeFilter.between(range.first, range.second),
                        ),
                    )
                }
                val records = JSArray()
                response.records.forEach { sample ->
                    records.put(
                        JSObject()
                            .put("timestamp", DateTimeFormatter.ISO_INSTANT.format(sample.time))
                            .put("bpm", sample.beatsPerMinute),
                    )
                }
                call.resolve(JSObject().put("records", records))
            } catch (error: Exception) {
                call.reject("Failed to read resting heart rate", error)
            }
        }
    }

    @PluginMethod
    fun readSteps(call: PluginCall) {
        val range = parseRange(call) ?: return
        val client = requireClient(call) ?: return
        pluginScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            StepsRecord::class,
                            TimeRangeFilter.between(range.first, range.second),
                        ),
                    )
                }
                val total = response.records.sumOf { it.count }
                val date = range.second.atZone(ZoneId.systemDefault()).toLocalDate().toString()
                call.resolve(
                    JSObject().put(
                        "records",
                        JSArray().put(JSObject().put("date", date).put("steps", total)),
                    ),
                )
            } catch (error: Exception) {
                call.reject("Failed to read steps", error)
            }
        }
    }

    @PluginMethod
    fun readActiveMinutes(call: PluginCall) {
        val range = parseRange(call) ?: return
        val client = requireClient(call) ?: return
        pluginScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            ExerciseSessionRecord::class,
                            TimeRangeFilter.between(range.first, range.second),
                        ),
                    )
                }
                val minutes = response.records.sumOf {
                    Duration.between(
                        maxOf(it.startTime, range.first),
                        minOf(it.endTime, range.second),
                    ).toMinutes().coerceAtLeast(0)
                }
                val date = range.second.atZone(ZoneId.systemDefault()).toLocalDate().toString()
                call.resolve(
                    JSObject().put(
                        "records",
                        JSArray().put(JSObject().put("date", date).put("minutes", minutes)),
                    ),
                )
            } catch (error: Exception) {
                call.reject("Failed to read active minutes", error)
            }
        }
    }

    @PluginMethod
    fun readBedtimeHistory(call: PluginCall) {
        val days = (call.getInt("days") ?: 7).coerceIn(2, 30)
        val client = requireClient(call) ?: return
        val end = Instant.now()
        val start = end.minus(Duration.ofDays((days + 1).toLong()))
        pluginScope.launch {
            try {
                val response = withContext(Dispatchers.IO) {
                    client.readRecords(
                        ReadRecordsRequest(
                            SleepSessionRecord::class,
                            TimeRangeFilter.between(start, end),
                        ),
                    )
                }
                val zone = ZoneId.systemDefault()
                val bedtimes = response.records
                    .sortedBy { it.startTime }
                    .takeLast(days + 1)
                    .map { session ->
                        val local = session.startTime.atZone(zone)
                        val minute = local.hour * 60 + local.minute
                        if (minute < 12 * 60) minute + 24 * 60 else minute
                    }
                if (bedtimes.size < 2) {
                    call.resolve(JSObject().put("records", JSArray()))
                    return@launch
                }
                val latest = bedtimes.last()
                val history = bedtimes.dropLast(1).sorted()
                val median = history[history.size / 2]
                call.resolve(
                    JSObject().put(
                        "records",
                        JSArray().put(JSObject().put("deviationMin", abs(latest - median))),
                    ),
                )
            } catch (error: Exception) {
                call.reject("Failed to read bedtime history", error)
            }
        }
    }

    @PluginMethod
    fun openHealthConnectSettings(call: PluginCall) {
        try {
            context.startActivity(
                Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                },
            )
            call.resolve()
        } catch (_: Exception) {
            openHealthConnectPlayStore(context)
            call.resolve()
        }
    }

    private fun parseRange(call: PluginCall): Pair<Instant, Instant>? {
        val startText = call.getString("startDate")
        val endText = call.getString("endDate")
        return try {
            val start = Instant.parse(startText)
            val end = Instant.parse(endText)
            if (start >= end) throw IllegalArgumentException("startDate must precede endDate")
            Pair(start, end)
        } catch (error: Exception) {
            call.reject("startDate and endDate must be valid ISO-8601 values", error)
            null
        }
    }

    private fun requireClient(call: PluginCall): HealthConnectClient? {
        if (healthConnectClient == null) initializeClient()
        return healthConnectClient ?: run {
            call.reject("Health Connect is unavailable")
            null
        }
    }

    private fun stateFor(granted: Set<String>, permission: String): String {
        return if (granted.contains(permission)) {
            "granted"
        } else {
            "not_determined"
        }
    }

    private fun permissionPayload(state: String): JSObject {
        return JSObject()
            .put("sleep", state)
            .put("hrv", state)
            .put("restingHr", state)
    }

    private fun openHealthConnectPlayStore(pluginContext: Context) {
        val marketIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("market://details?id=com.google.android.apps.healthdata"),
        ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        val webIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"),
        ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        try {
            pluginContext.startActivity(marketIntent)
        } catch (_: Exception) {
            pluginContext.startActivity(webIntent)
        }
    }
}
