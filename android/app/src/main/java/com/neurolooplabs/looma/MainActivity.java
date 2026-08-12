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
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HealthPlugin.class);
        registerPlugin(CalendarContextPlugin.class);
        registerPlugin(AppBlockerPlugin.class);
        super.onCreate(savedInstanceState);

        // LOOMA is an edge-to-edge mobile surface. Keep system controls
        // available, but render the app background beneath both bars.
        Window window = getWindow();
        WindowCompat.setDecorFitsSystemWindows(window, false);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);
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
