package com.neurolooplabs.looma;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.neurolooplabs.looma.plugins.AppBlockerPlugin;
import com.neurolooplabs.looma.plugins.CalendarContextPlugin;
import com.neurolooplabs.looma.plugins.HealthPlugin;

public class MainActivity extends BridgeActivity {
    private static final int LOOMA_BACKGROUND = Color.rgb(10, 11, 15);

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HealthPlugin.class);
        registerPlugin(CalendarContextPlugin.class);
        registerPlugin(AppBlockerPlugin.class);

        // Configure the window before BridgeActivity creates the WebView.
        // Applying edge-to-edge after super.onCreate is too late on some
        // Samsung builds and leaves opaque system-bar bands around the app.
        applyLoomaSystemBars();
        super.onCreate(savedInstanceState);

        // BridgeActivity can update the decor while creating the WebView, so
        // re-assert the final appearance and give the WebView a dark backdrop.
        applyLoomaSystemBars();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(LOOMA_BACKGROUND);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        applyLoomaSystemBars();
    }

    private void applyLoomaSystemBars() {
        Window window = getWindow();
        window.getDecorView().setBackgroundColor(LOOMA_BACKGROUND);
        window.setNavigationBarDividerColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
            // Capacitor 8 supplies CSS safe-area variables on Android 15+.
            WindowCompat.setDecorFitsSystemWindows(window, false);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
        } else {
            // Older WebViews do not reliably expose status/navigation insets
            // to CSS. Matching both bars to LOOMA keeps the surface seamless
            // without allowing content to sit beneath system controls.
            WindowCompat.setDecorFitsSystemWindows(window, true);
            window.setStatusBarColor(LOOMA_BACKGROUND);
            window.setNavigationBarColor(LOOMA_BACKGROUND);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
            window.setStatusBarContrastEnforced(false);
        }
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);
    }
}
