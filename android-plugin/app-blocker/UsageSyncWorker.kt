package com.neurolooplabs.looma.plugins

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Uploads today's six-number phone-use aggregate every 15 minutes, even when
 * LOOMA is closed. Authenticates with a revocable device token (only its hash
 * is stored server-side), never with the user's login session.
 */
class UsageSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val prefs = applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString(KEY_TOKEN, null) ?: return@withContext Result.success()
        val endpoint = prefs.getString(KEY_ENDPOINT, null) ?: return@withContext Result.success()
        val apiKey = prefs.getString(KEY_API_KEY, null) ?: return@withContext Result.success()
        val aggregate = UsageAggregator.compute(applicationContext) ?: return@withContext Result.success()

        val body = JSONObject().apply {
            put("action", "ingest")
            put("snapshotDate", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date()))
            put("attentionUsageMin", aggregate.attentionUsageMin)
            put("activeAppCount", aggregate.activeAppCount)
            put("lastAttentionUseAt", aggregate.lastAttentionUseAt ?: JSONObject.NULL)
            put("attentionSessionCount", aggregate.attentionSessionCount ?: JSONObject.NULL)
            put("attentionSwitchCount", aggregate.attentionSwitchCount ?: JSONObject.NULL)
            put("briefSessionCount", aggregate.briefSessionCount ?: JSONObject.NULL)
        }

        try {
            val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 15_000
                readTimeout = 15_000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("apikey", apiKey)
                setRequestProperty("Authorization", "Bearer $apiKey")
                setRequestProperty("x-device-token", token)
            }
            conn.outputStream.use { it.write(body.toString().toByteArray()) }
            val code = conn.responseCode
            conn.disconnect()
            when {
                code in 200..299 -> Result.success()
                code == 401 -> {
                    // Token revoked (sign-out or new device): stop syncing.
                    prefs.edit().clear().apply()
                    WorkManager.getInstance(applicationContext).cancelUniqueWork(WORK_NAME)
                    Result.success()
                }
                else -> Result.retry()
            }
        } catch (_: Exception) {
            Result.retry()
        }
    }

    companion object {
        const val WORK_NAME = "looma-usage-sync"
        const val PREFS = "looma_usage_sync"
        const val KEY_TOKEN = "token"
        const val KEY_ENDPOINT = "endpoint"
        const val KEY_API_KEY = "api_key"

        fun schedule(context: Context) {
            val request = PeriodicWorkRequestBuilder<UsageSyncWorker>(15, TimeUnit.MINUTES)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(context)
                .enqueueUniquePeriodicWork(WORK_NAME, ExistingPeriodicWorkPolicy.UPDATE, request)
        }

        fun cancel(context: Context) {
            context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply()
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }
    }
}
