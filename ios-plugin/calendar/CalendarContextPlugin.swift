import Foundation
import Capacitor
import EventKit

@objc(CalendarContextPlugin)
public class CalendarContextPlugin: CAPPlugin {
    private let eventStore = EKEventStore()
    private let workStartMinute = 8 * 60
    private let workEndMinute = 20 * 60

    @objc func getPermissionStatus(_ call: CAPPluginCall) {
        call.resolve(["state": permissionState()])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        let complete: (Bool, Error?) -> Void = { granted, error in
            if let error = error {
                call.reject("Calendar permission failed: \(error.localizedDescription)")
                return
            }
            call.resolve(["state": granted ? "granted" : "denied"])
        }

        if #available(iOS 17.0, *) {
            eventStore.requestFullAccessToEvents(completion: complete)
        } else {
            eventStore.requestAccess(to: .event, completion: complete)
        }
    }

    @objc func getDailyAggregates(_ call: CAPPluginCall) {
        guard permissionState() == "granted" else {
            call.resolve(["state": permissionState(), "days": []])
            return
        }
        guard let startText = call.getString("startDate"),
              let endText = call.getString("endDate"),
              let start = dateFromDay(startText),
              let endDay = dateFromDay(endText),
              let exclusiveEnd = Calendar.current.date(byAdding: .day, value: 1, to: endDay),
              start <= endDay else {
            call.reject("startDate and endDate must use yyyy-MM-dd")
            return
        }

        let predicate = eventStore.predicateForEvents(withStart: start, end: exclusiveEnd, calendars: nil)
        let events = eventStore.events(matching: predicate).filter { !$0.isAllDay }
        var days: [[String: Any]] = []
        var cursor = start

        while cursor < exclusiveEnd {
            guard let next = Calendar.current.date(byAdding: .day, value: 1, to: cursor) else { break }
            let intervals = events.compactMap { event -> (Date, Date)? in
                let clippedStart = max(event.startDate, cursor)
                let clippedEnd = min(event.endDate, next)
                return clippedEnd > clippedStart ? (clippedStart, clippedEnd) : nil
            }
            days.append(aggregateDay(dayStart: cursor, intervals: intervals))
            cursor = next
        }

        call.resolve(["state": "granted", "days": days])
    }

    private func permissionState() -> String {
        let status = EKEventStore.authorizationStatus(for: .event)
        if #available(iOS 17.0, *) {
            switch status {
            case .fullAccess, .authorized: return "granted"
            case .writeOnly, .restricted, .denied: return "denied"
            case .notDetermined: return "not_determined"
            @unknown default: return "unavailable"
            }
        }
        switch status {
        case .authorized: return "granted"
        case .restricted, .denied: return "denied"
        case .notDetermined: return "not_determined"
        default: return "unavailable"
        }
    }

    private func dateFromDay(_ value: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: value)
    }

    private func minuteOfDay(_ date: Date, dayStart: Date) -> Int {
        max(0, min(1440, Int(date.timeIntervalSince(dayStart) / 60)))
    }

    private func aggregateDay(dayStart: Date, intervals: [(Date, Date)]) -> [String: Any] {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone.current
        formatter.dateFormat = "yyyy-MM-dd"

        let minuteIntervals = intervals.map {
            (minuteOfDay($0.0, dayStart: dayStart), minuteOfDay($0.1, dayStart: dayStart))
        }.filter { $0.1 > $0.0 }.sorted { $0.0 < $1.0 }

        var merged: [(Int, Int)] = []
        for interval in minuteIntervals {
            if let last = merged.last, interval.0 <= last.1 {
                merged[merged.count - 1] = (last.0, max(last.1, interval.1))
            } else {
                merged.append(interval)
            }
        }

        let busyMinutes = merged.reduce(0) { $0 + ($1.1 - $1.0) }
        let longestMeeting = minuteIntervals.map { $0.1 - $0.0 }.max() ?? 0
        let currentMinute = Calendar.current.isDate(dayStart, inSameDayAs: Date())
            ? minuteOfDay(Date(), dayStart: dayStart)
            : workStartMinute
        let effectiveWorkStart = min(workEndMinute, max(workStartMinute, currentMinute))
        let workBusy = merged.compactMap { interval -> (Int, Int)? in
            let start = max(effectiveWorkStart, interval.0)
            let end = min(workEndMinute, interval.1)
            return end > start ? (start, end) : nil
        }
        var openCursor = effectiveWorkStart
        var longestOpenStart: Int? = effectiveWorkStart < workEndMinute ? effectiveWorkStart : nil
        var longestOpenMinutes = 0
        for interval in workBusy {
            if interval.0 > openCursor && interval.0 - openCursor > longestOpenMinutes {
                longestOpenStart = openCursor
                longestOpenMinutes = interval.0 - openCursor
            }
            openCursor = max(openCursor, interval.1)
        }
        if workEndMinute - openCursor > longestOpenMinutes {
            longestOpenStart = openCursor
            longestOpenMinutes = workEndMinute - openCursor
        }

        return [
            "date": formatter.string(from: dayStart),
            "busyMinutes": busyMinutes,
            "meetingCount": minuteIntervals.count,
            "longestMeetingMinutes": longestMeeting,
            "firstEventMinute": minuteIntervals.first?.0 ?? NSNull(),
            "lastEventMinute": minuteIntervals.last?.1 ?? NSNull(),
            "longestOpenStartMinute": longestOpenStart ?? NSNull(),
            "longestOpenMinutes": longestOpenMinutes,
        ]
    }
}
