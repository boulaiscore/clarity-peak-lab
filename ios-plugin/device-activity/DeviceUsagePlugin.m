#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(DeviceUsagePlugin, "DeviceUsage",
    CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getPermissionStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(selectAttentionApps, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getUsageAggregate, CAPPluginReturnPromise);
)
