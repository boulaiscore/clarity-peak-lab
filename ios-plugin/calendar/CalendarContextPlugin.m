#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(CalendarContextPlugin, "CalendarContext",
    CAP_PLUGIN_METHOD(getPermissionStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getDailyAggregates, CAPPluginReturnPromise);
)
