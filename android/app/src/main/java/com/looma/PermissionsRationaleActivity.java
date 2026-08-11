package com.looma;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;

/** Opens LOOMA's public privacy policy from Health Connect's rationale link. */
public class PermissionsRationaleActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        startActivity(new Intent(
            Intent.ACTION_VIEW,
            Uri.parse("https://www.neurolooplabs.com/#/privacy")
        ));
        finish();
    }
}
