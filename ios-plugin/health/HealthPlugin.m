/**
 * HealthPlugin Objective-C Bridge
 * Required for Capacitor plugin registration
 */

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HealthPlugin, "HealthPlugin",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(checkPermissions, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestPermissions, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(readSleep, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(readHRV, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(readRestingHR, CAPPluginReturnPromise);
)
