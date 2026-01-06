package app.lovable.f84e62a560cb4db59ded2b07c99a786f.plugins

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.TextView
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager

/**
 * Background service that monitors app usage and shows a blocking overlay
 * when the user tries to open a blocked app during a detox session.
 * 
 * When a violation is detected, it broadcasts an event that resets the timer.
 */
class AppBlockerService : Service() {

    companion object {
        const val ACTION_VIOLATION_DETECTED = "app.lovable.DETOX_VIOLATION"
        const val EXTRA_BLOCKED_PACKAGE = "blocked_package"
        const val EXTRA_BLOCKED_APP_NAME = "blocked_app_name"
        const val EXTRA_VIOLATION_COUNT = "violation_count"
    }

    private val handler = Handler(Looper.getMainLooper())
    private var isRunning = false
    private var blockedPackages = setOf<String>()
    private var blockEndTime = 0L
    private var blockMessage = ""
    private var violationCount = 0
    
    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var currentlyBlockedApp: String? = null

    private val NOTIFICATION_CHANNEL_ID = "app_blocker_channel"
    private val NOTIFICATION_ID = 1001
    private val CHECK_INTERVAL = 500L // Check every 500ms

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        loadBlockingPreferences()
        
        if (blockedPackages.isEmpty() || blockEndTime <= System.currentTimeMillis()) {
            stopSelf()
            return START_NOT_STICKY
        }

        startForeground(NOTIFICATION_ID, createNotification())
        startMonitoring()
        
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacksAndMessages(null)
        hideOverlay()
        super.onDestroy()
    }

    private fun loadBlockingPreferences() {
        val prefs = getSharedPreferences("app_blocker", Context.MODE_PRIVATE)
        blockedPackages = prefs.getStringSet("blocked_packages", emptySet()) ?: emptySet()
        blockEndTime = prefs.getLong("block_end_time", 0)
        blockMessage = prefs.getString("block_message", "Stay focused!") ?: "Stay focused!"
        violationCount = prefs.getInt("violation_count", 0)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "App Blocker",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors and blocks distracting apps during detox sessions"
                setShowBadge(false)
            }
            
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val remainingMinutes = ((blockEndTime - System.currentTimeMillis()) / 1000 / 60).toInt()
        val violationText = if (violationCount > 0) " • $violationCount violations" else ""
        
        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle("Detox Mode Active")
            .setContentText("${blockedPackages.size} apps blocked • ${remainingMinutes}m remaining$violationText")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .build()
    }

    private fun startMonitoring() {
        isRunning = true
        handler.post(object : Runnable {
            override fun run() {
                if (!isRunning) return
                
                // Check if blocking period has ended
                if (System.currentTimeMillis() >= blockEndTime) {
                    stopSelf()
                    return
                }

                checkForegroundApp()
                handler.postDelayed(this, CHECK_INTERVAL)
            }
        })
    }

    private fun checkForegroundApp() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val endTime = System.currentTimeMillis()
        val startTime = endTime - 1000 // Last second

        val usageEvents = usageStatsManager.queryEvents(startTime, endTime)
        var foregroundApp: String? = null

        while (usageEvents.hasNextEvent()) {
            val event = UsageEvents.Event()
            usageEvents.getNextEvent(event)
            
            if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
                foregroundApp = event.packageName
            }
        }

        foregroundApp?.let { packageName ->
            if (blockedPackages.contains(packageName)) {
                if (currentlyBlockedApp != packageName) {
                    currentlyBlockedApp = packageName
                    
                    // Increment violation count and save
                    violationCount++
                    saveViolationCount()
                    
                    // Broadcast violation event to reset timer
                    broadcastViolation(packageName)
                    
                    // Show overlay and go home
                    showOverlay(packageName)
                    
                    // Update notification with new violation count
                    updateNotification()
                }
            } else {
                if (currentlyBlockedApp != null) {
                    currentlyBlockedApp = null
                    hideOverlay()
                }
            }
        }
    }

    private fun saveViolationCount() {
        val prefs = getSharedPreferences("app_blocker", Context.MODE_PRIVATE)
        prefs.edit().putInt("violation_count", violationCount).apply()
    }

    private fun broadcastViolation(blockedPackage: String) {
        val appName = try {
            val appInfo = packageManager.getApplicationInfo(blockedPackage, 0)
            packageManager.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            blockedPackage
        }

        // Send local broadcast
        val intent = Intent(ACTION_VIOLATION_DETECTED).apply {
            putExtra(EXTRA_BLOCKED_PACKAGE, blockedPackage)
            putExtra(EXTRA_BLOCKED_APP_NAME, appName)
            putExtra(EXTRA_VIOLATION_COUNT, violationCount)
        }
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
        
        // Also send a global broadcast for the plugin to catch
        val globalIntent = Intent(ACTION_VIOLATION_DETECTED).apply {
            putExtra(EXTRA_BLOCKED_PACKAGE, blockedPackage)
            putExtra(EXTRA_BLOCKED_APP_NAME, appName)
            putExtra(EXTRA_VIOLATION_COUNT, violationCount)
            setPackage(packageName)
        }
        sendBroadcast(globalIntent)
    }

    private fun updateNotification() {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification())
    }

    private fun showOverlay(blockedPackage: String) {
        if (overlayView != null) return

        try {
            val appName = try {
                val appInfo = packageManager.getApplicationInfo(blockedPackage, 0)
                packageManager.getApplicationLabel(appInfo).toString()
            } catch (e: Exception) {
                blockedPackage
            }

            // Create overlay view programmatically
            overlayView = createBlockingView(appName)

            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                },
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT
            )
            params.gravity = Gravity.CENTER

            windowManager?.addView(overlayView, params)

            // Go back to home after a short delay
            handler.postDelayed({
                goToHome()
            }, 100)

        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun createBlockingView(appName: String): View {
        // Create a simple blocking view programmatically
        val context = this
        val view = android.widget.LinearLayout(context).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(0xF0121212.toInt()) // Dark semi-transparent background
            setPadding(48, 48, 48, 48)
        }

        // Icon
        val iconView = android.widget.ImageView(context).apply {
            setImageResource(android.R.drawable.ic_lock_lock)
            setColorFilter(0xFFFF6B6B.toInt()) // Red tint
        }
        view.addView(iconView, android.widget.LinearLayout.LayoutParams(96, 96).apply {
            bottomMargin = 32
        })

        // Title
        val titleView = TextView(context).apply {
            text = "$appName is blocked"
            textSize = 24f
            setTextColor(0xFFFFFFFF.toInt())
            gravity = Gravity.CENTER
        }
        view.addView(titleView, android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = 16
        })

        // Violation warning message
        val warningView = TextView(context).apply {
            text = "⚠️ Timer reset! Violation #$violationCount"
            textSize = 18f
            setTextColor(0xFFFFAA00.toInt()) // Orange/amber color
            gravity = Gravity.CENTER
        }
        view.addView(warningView, android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = 16
        })

        // Message
        val messageView = TextView(context).apply {
            text = blockMessage
            textSize = 16f
            setTextColor(0xAAFFFFFF.toInt())
            gravity = Gravity.CENTER
        }
        view.addView(messageView, android.widget.LinearLayout.LayoutParams(
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT,
            android.widget.LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            bottomMargin = 24
        })

        // Info text about timer reset
        val infoView = TextView(context).apply {
            text = "Your detox timer has been reset to 0"
            textSize = 14f
            setTextColor(0x88FFFFFF.toInt())
            gravity = Gravity.CENTER
        }
        view.addView(infoView)

        return view
    }

    private fun hideOverlay() {
        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            overlayView = null
        }
    }

    private fun goToHome() {
        val intent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(intent)
    }
}
