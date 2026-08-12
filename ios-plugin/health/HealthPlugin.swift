import Foundation
import Capacitor
import HealthKit
import UIKit

/**
 * Privacy-minimal HealthKit bridge for LOOMA.
 *
 * HealthKit deliberately does not reveal whether read access was denied. The
 * permission state exposed here therefore means that the system authorization
 * flow has been completed; empty queries remain a valid, privacy-preserving
 * outcome and are handled by the web layer as missing data.
 */
@objc(HealthPlugin)
public class HealthPlugin: CAPPlugin {
    private let healthStore = HKHealthStore()

    private var sleepType: HKCategoryType? {
        HKObjectType.categoryType(forIdentifier: .sleepAnalysis)
    }

    private var hrvType: HKQuantityType? {
        HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)
    }

    private var restingHeartRateType: HKQuantityType? {
        HKObjectType.quantityType(forIdentifier: .restingHeartRate)
    }

    private var stepType: HKQuantityType? {
        HKObjectType.quantityType(forIdentifier: .stepCount)
    }

    private var exerciseTimeType: HKQuantityType? {
        HKObjectType.quantityType(forIdentifier: .appleExerciseTime)
    }

    private var readTypes: Set<HKObjectType> {
        Set([sleepType, hrvType, restingHeartRateType, stepType, exerciseTimeType].compactMap { $0 })
    }

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    @objc public override func checkPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve(["permissions": permissionPayload(state: "denied")])
            return
        }

        healthStore.getRequestStatusForAuthorization(
            toShare: Set<HKSampleType>(),
            read: readTypes
        ) { status, error in
            if let error = error {
                call.reject("Could not inspect HealthKit authorization: \(error.localizedDescription)")
                return
            }

            // Apple intentionally makes denied and granted read access
            // indistinguishable. `unnecessary` means the prompt was handled.
            let state = status == .shouldRequest ? "not_determined" : "granted"
            call.resolve(["permissions": self.permissionPayload(state: state)])
        }
    }

    @objc public override func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }

        healthStore.requestAuthorization(
            toShare: Set<HKSampleType>(),
            read: readTypes
        ) { success, error in
            if let error = error {
                call.reject("Failed to request HealthKit access: \(error.localizedDescription)")
                return
            }

            let state = success ? "granted" : "denied"
            call.resolve([
                "granted": success,
                "permissions": self.permissionPayload(state: state),
            ])
        }
    }

    @objc func readSleep(_ call: CAPPluginCall) {
        guard let range = dateRange(from: call) else { return }
        guard let type = sleepType else {
            call.resolve(["records": []])
            return
        }

        querySamples(type: type, range: range, call: call) { samples in
            let sleepSamples = (samples as? [HKCategorySample]) ?? []
            call.resolve(["records": self.aggregateSleepSamples(sleepSamples)])
        }
    }

    @objc func readHRV(_ call: CAPPluginCall) {
        guard let range = dateRange(from: call) else { return }
        guard let type = hrvType else {
            call.resolve(["records": []])
            return
        }

        querySamples(type: type, range: range, call: call) { samples in
            let formatter = self.isoFormatter()
            let records = ((samples as? [HKQuantitySample]) ?? []).map { sample in
                [
                    "timestamp": formatter.string(from: sample.startDate),
                    "value": sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli)),
                    "metric": "sdnn",
                ] as [String: Any]
            }
            call.resolve(["records": records])
        }
    }

    @objc func readRestingHR(_ call: CAPPluginCall) {
        guard let range = dateRange(from: call) else { return }
        guard let type = restingHeartRateType else {
            call.resolve(["records": []])
            return
        }

        querySamples(type: type, range: range, call: call) { samples in
            let formatter = self.isoFormatter()
            let bpmUnit = HKUnit.count().unitDivided(by: .minute())
            let records = ((samples as? [HKQuantitySample]) ?? []).map { sample in
                [
                    "timestamp": formatter.string(from: sample.startDate),
                    "bpm": sample.quantity.doubleValue(for: bpmUnit),
                ] as [String: Any]
            }
            call.resolve(["records": records])
        }
    }

    @objc func readSteps(_ call: CAPPluginCall) {
        guard let range = dateRange(from: call) else { return }
        guard let type = stepType else {
            call.resolve(["records": []])
            return
        }

        cumulativeSum(type: type, unit: .count(), range: range, call: call) { value in
            let day = self.dayFormatter().string(from: range.end)
            call.resolve(["records": [["date": day, "steps": Int(value.rounded())]]])
        }
    }

    @objc func readActiveMinutes(_ call: CAPPluginCall) {
        guard let range = dateRange(from: call) else { return }
        guard let type = exerciseTimeType else {
            call.resolve(["records": []])
            return
        }

        cumulativeSum(type: type, unit: .minute(), range: range, call: call) { value in
            let day = self.dayFormatter().string(from: range.end)
            call.resolve(["records": [["date": day, "minutes": Int(value.rounded())]]])
        }
    }

    @objc func readBedtimeHistory(_ call: CAPPluginCall) {
        let days = max(2, min(call.getInt("days") ?? 7, 30))
        guard let type = sleepType else {
            call.resolve(["records": []])
            return
        }

        let end = Date()
        guard let start = Calendar.current.date(byAdding: .day, value: -(days + 1), to: end) else {
            call.resolve(["records": []])
            return
        }

        let range = (start: start, end: end)
        querySamples(type: type, range: range, call: call) { samples in
            let sessions = self.groupSleepSamples((samples as? [HKCategorySample]) ?? [])
                .filter { !$0.isEmpty }
                .suffix(days + 1)
            let bedtimes = sessions.compactMap { session -> Int? in
                guard let bedtime = session
                    .filter({ self.isAsleepSample($0) })
                    .map(\.startDate)
                    .min() else { return nil }
                let components = Calendar.current.dateComponents([.hour, .minute], from: bedtime)
                guard let hour = components.hour, let minute = components.minute else { return nil }
                let minuteOfDay = hour * 60 + minute
                return minuteOfDay < 12 * 60 ? minuteOfDay + 24 * 60 : minuteOfDay
            }

            guard bedtimes.count >= 2, let latest = bedtimes.last else {
                call.resolve(["records": []])
                return
            }
            let historical = Array(bedtimes.dropLast()).sorted()
            let median = historical[historical.count / 2]
            call.resolve(["records": [["deviationMin": abs(latest - median)]]])
        }
    }

    @objc func openHealthSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let url = URL(string: UIApplication.openSettingsURLString) else {
                call.reject("Settings are unavailable")
                return
            }
            UIApplication.shared.open(url) { opened in
                opened ? call.resolve() : call.reject("Could not open Settings")
            }
        }
    }

    private func permissionPayload(state: String) -> [String: String] {
        [
            "sleep": state,
            "hrv": state,
            "restingHr": state,
            "steps": state,
            "activeMinutes": state,
        ]
    }

    private func dateRange(from call: CAPPluginCall) -> (start: Date, end: Date)? {
        guard let startText = call.getString("startDate"),
              let endText = call.getString("endDate"),
              let start = parseISODate(startText),
              let end = parseISODate(endText),
              start < end else {
            call.reject("startDate and endDate must be valid ISO-8601 values")
            return nil
        }
        return (start, end)
    }

    private func parseISODate(_ value: String) -> Date? {
        let fractional = ISO8601DateFormatter()
        fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = fractional.date(from: value) { return date }
        return ISO8601DateFormatter().date(from: value)
    }

    private func isoFormatter() -> ISO8601DateFormatter {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }

    private func dayFormatter() -> DateFormatter {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = .current
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }

    private func querySamples(
        type: HKSampleType,
        range: (start: Date, end: Date),
        call: CAPPluginCall,
        completion: @escaping ([HKSample]) -> Void
    ) {
        let predicate = HKQuery.predicateForSamples(
            withStart: range.start,
            end: range.end,
            options: .strictStartDate
        )
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: true)
        let query = HKSampleQuery(
            sampleType: type,
            predicate: predicate,
            limit: HKObjectQueryNoLimit,
            sortDescriptors: [sort]
        ) { _, samples, error in
            if let error = error {
                call.reject("HealthKit query failed: \(error.localizedDescription)")
                return
            }
            completion(samples ?? [])
        }
        healthStore.execute(query)
    }

    private func cumulativeSum(
        type: HKQuantityType,
        unit: HKUnit,
        range: (start: Date, end: Date),
        call: CAPPluginCall,
        completion: @escaping (Double) -> Void
    ) {
        let predicate = HKQuery.predicateForSamples(
            withStart: range.start,
            end: range.end,
            options: .strictStartDate
        )
        let query = HKStatisticsQuery(
            quantityType: type,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { _, statistics, error in
            if let error = error {
                call.reject("HealthKit aggregate failed: \(error.localizedDescription)")
                return
            }
            completion(statistics?.sumQuantity()?.doubleValue(for: unit) ?? 0)
        }
        healthStore.execute(query)
    }

    private func isInBedSample(_ sample: HKCategorySample) -> Bool {
        sample.value == HKCategoryValueSleepAnalysis.inBed.rawValue
    }

    private func isAsleepSample(_ sample: HKCategorySample) -> Bool {
        if #available(iOS 16.0, *) {
            return [
                HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue,
                HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                HKCategoryValueSleepAnalysis.asleepDeep.rawValue,
                HKCategoryValueSleepAnalysis.asleepREM.rawValue,
            ].contains(sample.value)
        }
        return sample.value == HKCategoryValueSleepAnalysis.asleep.rawValue
    }

    private func groupSleepSamples(_ samples: [HKCategorySample]) -> [[HKCategorySample]] {
        let filtered = samples.filter { !isInBedSample($0) }.sorted { $0.startDate < $1.startDate }
        var sessions: [[HKCategorySample]] = []
        var current: [HKCategorySample] = []
        var latestEnd: Date?

        for sample in filtered {
            if let latestEnd, sample.startDate.timeIntervalSince(latestEnd) > 90 * 60 {
                if !current.isEmpty { sessions.append(current) }
                current = []
            }
            current.append(sample)
            latestEnd = max(latestEnd ?? sample.endDate, sample.endDate)
        }
        if !current.isEmpty { sessions.append(current) }
        return sessions
    }

    private func aggregateSleepSamples(_ samples: [HKCategorySample]) -> [[String: Any]] {
        let formatter = isoFormatter()
        return groupSleepSamples(samples).compactMap { session in
            guard let start = session.map(\.startDate).min(),
                  let end = session.map(\.endDate).max() else { return nil }

            var stages = ["rem": 0, "deep": 0, "core": 0, "awake": 0]
            for sample in session {
                let minutes = max(0, Int(sample.endDate.timeIntervalSince(sample.startDate) / 60))
                if #available(iOS 16.0, *) {
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleepREM.rawValue: stages["rem", default: 0] += minutes
                    case HKCategoryValueSleepAnalysis.asleepDeep.rawValue: stages["deep", default: 0] += minutes
                    case HKCategoryValueSleepAnalysis.asleepCore.rawValue,
                         HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                        stages["core", default: 0] += minutes
                    case HKCategoryValueSleepAnalysis.awake.rawValue: stages["awake", default: 0] += minutes
                    default: break
                    }
                } else {
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleep.rawValue: stages["core", default: 0] += minutes
                    case HKCategoryValueSleepAnalysis.awake.rawValue: stages["awake", default: 0] += minutes
                    default: break
                    }
                }
            }

            let wallMinutes = max(0, Int(end.timeIntervalSince(start) / 60))
            let stagedSleep = stages["rem", default: 0] + stages["deep", default: 0] + stages["core", default: 0]
            let duration = min(wallMinutes, stagedSleep > 0 ? stagedSleep : wallMinutes)
            let awake = stages["awake", default: 0]
            let efficiency = duration + awake > 0
                ? min(1, Double(duration) / Double(duration + awake))
                : 0

            return [
                "startDate": formatter.string(from: start),
                "endDate": formatter.string(from: end),
                "durationMin": duration,
                "efficiency": efficiency,
                "stages": stages,
            ] as [String: Any]
        }
    }
}
