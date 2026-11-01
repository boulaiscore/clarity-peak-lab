package com.neurolooplabs.looma.plugins

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.os.Build
import android.os.Process
import java.util.Calendar

/**
 * Privacy-safe daily phone-use aggregate shared by the plugin and the
 * background worker. Package names are only compared on-device; the result
 * holds six counts and never any app identity.
 */
data class UsageAggregate(
    val attentionUsageMin: Int,
    val activeAppCount: Int,
    val lastAttentionUseAt: Long?,
    val attentionSessionCount: Int?,
    val attentionSwitchCount: Int?,
    val briefSessionCount: Int?,
)

object UsageAggregator {
    val attentionPackages = listOf(
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
        "com.google.android.youtube"
    )

    fun hasUsageAccess(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
        }
        return mode == AppOpsManager.MODE_ALLOWED
    }

    fun compute(context: Context): UsageAggregate? {
        if (!hasUsageAccess(context)) return null
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val calendar = Calendar.getInstance()
        val endTime = calendar.timeInMillis
        calendar.set(Calendar.HOUR_OF_DAY, 0)
        calendar.set(Calendar.MINUTE, 0)
        calendar.set(Calendar.SECOND, 0)
        calendar.set(Calendar.MILLISECOND, 0)
        val startTime = calendar.timeInMillis

        var attentionUsageMin = 0
        var activeAppCount = 0
        var lastAttentionUseAt: Long? = null
        for (stats in usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, startTime, endTime)) {
            if (!attentionPackages.contains(stats.packageName)) continue
            val minutes = (stats.totalTimeInForeground / 1000 / 60).toInt()
            if (minutes <= 0) continue
            attentionUsageMin += minutes
            activeAppCount += 1
            if (lastAttentionUseAt == null || stats.lastTimeUsed > lastAttentionUseAt) {
                lastAttentionUseAt = stats.lastTimeUsed
            }
        }

        val events = usm.queryEvents(startTime, endTime)
        val event = UsageEvents.Event()
        val activeStarts = mutableMapOf<String, Long>()
        var foregroundPackage: String? = null
        var lastForegroundPackage: String? = null
        var hasSeenAttentionSession = false
        var sessions = 0
        var switches = 0
        var brief = 0
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue
            val isForeground = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                event.eventType == UsageEvents.Event.ACTIVITY_RESUMED
            } else {
                @Suppress("DEPRECATION")
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
            }
            val isBackground = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                event.eventType == UsageEvents.Event.ACTIVITY_PAUSED
            } else {
                @Suppress("DEPRECATION")
                event.eventType == UsageEvents.Event.MOVE_TO_BACKGROUND
            }
            if (isForeground) {
                if (attentionPackages.contains(pkg) && foregroundPackage != pkg) {
                    sessions += 1
                    if (hasSeenAttentionSession && lastForegroundPackage != null && lastForegroundPackage != pkg) {
                        switches += 1
                    }
                    hasSeenAttentionSession = true
                    activeStarts[pkg] = event.timeStamp
                }
                foregroundPackage = pkg
                lastForegroundPackage = pkg
            } else if (isBackground && attentionPackages.contains(pkg)) {
                val startedAt = activeStarts.remove(pkg)
                if (startedAt != null && (event.timeStamp - startedAt) in 1..120_000) brief += 1
                if (foregroundPackage == pkg) foregroundPackage = null
            }
        }

        return UsageAggregate(attentionUsageMin, activeAppCount, lastAttentionUseAt, sessions, switches, brief)
    }
}
