import DeviceActivity
import Foundation

private let loomaAppGroup = "group.com.neurolooplabs.looma.shared"

final class LoomaDeviceActivityMonitor: DeviceActivityMonitor {
    override func eventDidReachThreshold(
        _ event: DeviceActivityEvent.Name,
        activity: DeviceActivityName
    ) {
        super.eventDidReachThreshold(event, activity: activity)
        guard activity.rawValue == "looma.attention",
              let minutes = Int(event.rawValue.split(separator: ".").last ?? "") else {
            return
        }
        let defaults = UserDefaults(suiteName: loomaAppGroup)
        let day = Self.dayKey()
        if defaults?.string(forKey: "looma.attention.day") != day {
            defaults?.set(day, forKey: "looma.attention.day")
            defaults?.set(0, forKey: "looma.attention.minutes")
        }
        defaults?.set(
            max(minutes, defaults?.integer(forKey: "looma.attention.minutes") ?? 0),
            forKey: "looma.attention.minutes"
        )
        defaults?.set(Date().timeIntervalSince1970 * 1000, forKey: "looma.attention.lastAt")
    }

    private static func dayKey() -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: Date())
    }
}
