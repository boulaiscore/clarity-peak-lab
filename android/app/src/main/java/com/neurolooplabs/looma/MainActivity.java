package com.neurolooplabs.looma;

import android.os.Bundle;
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
    }
}
