package com.looma.plugins

import android.Manifest
import android.content.pm.PackageManager
import android.provider.CalendarContract
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.PermissionState
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

@CapacitorPlugin(
    name = "CalendarContext",
    permissions = [Permission(strings = [Manifest.permission.READ_CALENDAR], alias = "calendar")]
)
class CalendarContextPlugin : Plugin() {
    private val workStartMinute = 8 * 60
    private val workEndMinute = 20 * 60

    @PluginMethod
    fun getPermissionStatus(call: PluginCall) {
        call.resolve(JSObject().put("state", permissionState()))
    }

    @PluginMethod
    fun requestPermission(call: PluginCall) {
        if (getPermissionState("calendar") == PermissionState.GRANTED) {
            call.resolve(JSObject().put("state", "granted"))
            return
        }
        requestPermissionForAlias("calendar", call, "calendarPermissionCallback")
    }

    @PermissionCallback
    private fun calendarPermissionCallback(call: PluginCall) {
        call.resolve(JSObject().put("state", permissionState()))
    }

    @PluginMethod
    fun getDailyAggregates(call: PluginCall) {
        if (permissionState() != "granted") {
            call.resolve(JSObject().put("state", permissionState()).put("days", JSArray()))
            return
        }
        val startDate = call.getString("startDate")
            ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            ?: run {
                call.reject("startDate and endDate must use yyyy-MM-dd")
                return
            }
        val endDate = call.getString("endDate")
            ?.let { runCatching { LocalDate.parse(it) }.getOrNull() }
            ?: run {
                call.reject("startDate and endDate must use yyyy-MM-dd")
                return
            }
        if (startDate.isAfter(endDate)) {
            call.reject("startDate and endDate must use yyyy-MM-dd")
            return
        }

        val zone = ZoneId.systemDefault()
        val rangeStart = startDate.atStartOfDay(zone).toInstant().toEpochMilli()
        val rangeEnd = endDate.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val uri = CalendarContract.Instances.CONTENT_URI.buildUpon()
            .appendPath(rangeStart.toString())
            .appendPath(rangeEnd.toString())
            .build()
        val projection = arrayOf(
            CalendarContract.Instances.BEGIN,
            CalendarContract.Instances.END,
            CalendarContract.Instances.ALL_DAY,
        )
        val byDay = mutableMapOf<LocalDate, MutableList<Pair<Long, Long>>>()

        context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
            val beginIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.BEGIN)
            val endIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.END)
            val allDayIndex = cursor.getColumnIndexOrThrow(CalendarContract.Instances.ALL_DAY)
            while (cursor.moveToNext()) {
                if (cursor.getInt(allDayIndex) == 1) continue
                val begin = cursor.getLong(beginIndex)
                val end = cursor.getLong(endIndex)
                if (end <= begin) continue
                var day = Instant.ofEpochMilli(begin).atZone(zone).toLocalDate()
                val finalDay = Instant.ofEpochMilli(end - 1).atZone(zone).toLocalDate()
                while (!day.isAfter(finalDay)) {
                    byDay.getOrPut(day) { mutableListOf() }.add(Pair(begin, end))
                    day = day.plusDays(1)
                }
            }
        }

        val days = JSArray()
        var day = startDate
        while (!day.isAfter(endDate)) {
            days.put(aggregateDay(day, byDay[day] ?: emptyList(), zone))
            day = day.plusDays(1)
        }
        call.resolve(JSObject().put("state", "granted").put("days", days))
    }

    private fun permissionState(): String = when {
        ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALENDAR) ==
            PackageManager.PERMISSION_GRANTED -> "granted"
        getPermissionState("calendar") == PermissionState.PROMPT -> "not_determined"
        else -> "denied"
    }

    private fun aggregateDay(
        date: LocalDate,
        rawIntervals: List<Pair<Long, Long>>,
        zone: ZoneId,
    ): JSObject {
        val dayStart = date.atStartOfDay(zone).toInstant().toEpochMilli()
        val dayEnd = date.plusDays(1).atStartOfDay(zone).toInstant().toEpochMilli()
        val intervals = rawIntervals.mapNotNull { raw ->
            val start = maxOf(dayStart, raw.first)
            val end = minOf(dayEnd, raw.second)
            if (end <= start) null else Pair(
                ((start - dayStart) / 60_000).toInt(),
                ((end - dayStart) / 60_000).toInt(),
            )
        }.sortedBy { it.first }

        val merged = mutableListOf<Pair<Int, Int>>()
        intervals.forEach { interval ->
            val last = merged.lastOrNull()
            if (last != null && interval.first <= last.second) {
                merged[merged.lastIndex] = Pair(last.first, maxOf(last.second, interval.second))
            } else {
                merged.add(interval)
            }
        }
        val busyMinutes = merged.sumOf { it.second - it.first }
        val longestMeeting = intervals.maxOfOrNull { it.second - it.first } ?: 0
        val currentMinute = if (date == LocalDate.now(zone)) {
            val now = java.time.ZonedDateTime.now(zone)
            now.hour * 60 + now.minute
        } else {
            workStartMinute
        }
        val effectiveWorkStart = minOf(workEndMinute, maxOf(workStartMinute, currentMinute))
        val workBusy = merged.mapNotNull {
            val start = maxOf(effectiveWorkStart, it.first)
            val end = minOf(workEndMinute, it.second)
            if (end > start) Pair(start, end) else null
        }
        var cursor = effectiveWorkStart
        var longestOpenStart: Int? = if (effectiveWorkStart < workEndMinute) effectiveWorkStart else null
        var longestOpenMinutes = 0
        workBusy.forEach { interval ->
            if (interval.first - cursor > longestOpenMinutes) {
                longestOpenStart = cursor
                longestOpenMinutes = interval.first - cursor
            }
            cursor = maxOf(cursor, interval.second)
        }
        if (workEndMinute - cursor > longestOpenMinutes) {
            longestOpenStart = cursor
            longestOpenMinutes = workEndMinute - cursor
        }

        return JSObject()
            .put("date", date.toString())
            .put("busyMinutes", busyMinutes)
            .put("meetingCount", intervals.size)
            .put("longestMeetingMinutes", longestMeeting)
            .put("firstEventMinute", intervals.firstOrNull()?.first)
            .put("lastEventMinute", intervals.lastOrNull()?.second)
            .put("longestOpenStartMinute", longestOpenStart)
            .put("longestOpenMinutes", longestOpenMinutes)
    }
}
