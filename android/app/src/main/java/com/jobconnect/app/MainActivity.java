package com.jobconnect.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Configure web view settings
        getBridge().getWebView().getSettings().setJavaScriptEnabled(true);
        getBridge().getWebView().getSettings().setDomStorageEnabled(true);
        getBridge().getWebView().getSettings().setAllowFileAccess(false);
        getBridge().getWebView().getSettings().setAllowContentAccess(false);
    }
}
