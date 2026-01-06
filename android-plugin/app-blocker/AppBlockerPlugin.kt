package app.lovable.f84e62a560cb4db59ded2b07c99a786f.plugins

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.Calendar

@CapacitorPlugin(name = "AppBlocker")
class AppBlockerPlugin : Plugin() {

    // List of social media package names to track
    private val socialAppPackages = listOf(
        "com.instagram.android",
        "com.facebook.katana",
        "com.facebook.orca",
        "com.twitter.android",
        "com.zhiliaoapp.musically",
        "com.snapchat.android",
        "com.whatsapp",
        "org.telegram.messenger",
        "com.linkedin.android",
        "com.pinterest",
        "com.reddit.frontpage",
        "com.discord",
        "com.youtube"
    )

    @PluginMethod
    fun hasUsageAccessPermission(call: PluginCall) {
        val granted = checkUsageAccessPermission()
        val result = JSObject()
        result.put("granted", granted)
        call.resolve(result)
    }

    @PluginMethod
    fun requestUsageAccessPermission(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to open usage access settings", e)
        }
    }

    @PluginMethod
    fun hasOverlayPermission(call: PluginCall) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
        val result = JSObject()
        result.put("granted", granted)
        call.resolve(result)
    }

    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                )
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
            }
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to open overlay settings", e)
        }
    }

    @PluginMethod
    fun getSocialApps(call: PluginCall) {
        val pm = context.packageManager
        val apps = JSArray()

        for (packageName in socialAppPackages) {
            try {
                val appInfo = pm.getApplicationInfo(packageName, 0)
                val appName = pm.getApplicationLabel(appInfo).toString()
                
                val app = JSObject()
                app.put("packageName", packageName)
                app.put("appName", appName)
                apps.put(app)
            } catch (e: PackageManager.NameNotFoundException) {
                // App not installed, skip
            }
        }

        val result = JSObject()
        result.put("apps", apps)
        call.resolve(result)
    }

    @PluginMethod
    fun getUsageStats(call: PluginCall) {
        if (!checkUsageAccessPermission()) {
            val result = JSObject()
            result.put("stats", JSArray())
            call.resolve(result)
            return
        }

        val usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val pm = context.packageManager

        // Get stats for today
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startTime = calendar.timeInMillis

        val usageStatsList = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            startTime,
            endTime
        )

        val stats = JSArray()

        // Filter and process only social apps
        for (usageStats in usageStatsList) {
            if (socialAppPackages.contains(usageStats.packageName)) {
                val usageMinutes = (usageStats.totalTimeInForeground / 1000 / 60).toInt()
                
                if (usageMinutes > 0) {
                    val appName = try {
                        val appInfo = pm.getApplicationInfo(usageStats.packageName, 0)
                        pm.getApplicationLabel(appInfo).toString()
                    } catch (e: PackageManager.NameNotFoundException) {
                        usageStats.packageName
                    }

                    val stat = JSObject()
                    stat.put("packageName", usageStats.packageName)
                    stat.put("appName", appName)
                    stat.put("usageMinutes", usageMinutes)
                    stat.put("lastUsed", usageStats.lastTimeUsed)
                    stats.put(stat)
                }
            }
        }

        val result = JSObject()
        result.put("stats", stats)
        call.resolve(result)
    }

    @PluginMethod
    fun startBlocking(call: PluginCall) {
        // Store blocking preferences
        val packageNames = call.getArray("packageNames")
        val durationMinutes = call.getInt("durationMinutes", 30) ?: 30
        val message = call.getString("message", "Stay focused! This app is blocked during your detox session.")

        val prefs = context.getSharedPreferences("app_blocker", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putStringSet("blocked_packages", packageNames?.toList<String>()?.toSet() ?: emptySet())
            putLong("block_end_time", System.currentTimeMillis() + (durationMinutes * 60 * 1000))
            putString("block_message", message)
            putBoolean("blocking_active", true)
            apply()
        }

        // Start the blocking service
        val intent = Intent(context, AppBlockerService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }

        call.resolve()
    }

    @PluginMethod
    fun stopBlocking(call: PluginCall) {
        val prefs = context.getSharedPreferences("app_blocker", Context.MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("blocking_active", false)
            apply()
        }

        val intent = Intent(context, AppBlockerService::class.java)
        context.stopService(intent)

        call.resolve()
    }

    @PluginMethod
    fun isBlockingActive(call: PluginCall) {
        val prefs = context.getSharedPreferences("app_blocker", Context.MODE_PRIVATE)
        val isActive = prefs.getBoolean("blocking_active", false)
        val blockEndTime = prefs.getLong("block_end_time", 0)
        
        val remainingMinutes = if (isActive && blockEndTime > System.currentTimeMillis()) {
            ((blockEndTime - System.currentTimeMillis()) / 1000 / 60).toInt()
        } else {
            0
        }

        val result = JSObject()
        result.put("active", isActive && remainingMinutes > 0)
        result.put("remainingMinutes", remainingMinutes)
        call.resolve(result)
    }

    private fun checkUsageAccessPermission(): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }
}
