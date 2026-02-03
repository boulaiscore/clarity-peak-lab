/**
 * NeuroLoop Pro - HealthKit Plugin for iOS
 * 
 * Reads health data from Apple HealthKit:
 * - Sleep Analysis (stages if available)
 * - HRV SDNN (Heart Rate Variability)
 * - Resting Heart Rate
 * 
 * Data Types:
 * - HKCategoryTypeIdentifier.sleepAnalysis
 * - HKQuantityTypeIdentifier.heartRateVariabilitySDNN
 * - HKQuantityTypeIdentifier.restingHeartRate
 */

import Foundation
import Capacitor
import HealthKit

@objc(HealthPlugin)
public class HealthPlugin: CAPPlugin {
    
    private let healthStore = HKHealthStore()
    
    // Data types we want to read
    private var readTypes: Set<HKObjectType> {
        var types = Set<HKObjectType>()
        
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            types.insert(sleepType)
        }
        if let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            types.insert(hrvType)
        }
        if let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) {
            types.insert(rhrType)
        }
        
        return types
    }
    
    // MARK: - Plugin Methods
    
    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = HKHealthStore.isHealthDataAvailable()
        call.resolve(["available": available])
    }
    
    @objc func checkPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.resolve([
                "permissions": [
                    "sleep": "denied",
                    "hrv": "denied",
                    "restingHr": "denied"
                ]
            ])
            return
        }
        
        var permissions: [String: String] = [:]
        
        // Check sleep permission
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            permissions["sleep"] = statusToString(healthStore.authorizationStatus(for: sleepType))
        } else {
            permissions["sleep"] = "denied"
        }
        
        // Check HRV permission
        if let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
            permissions["hrv"] = statusToString(healthStore.authorizationStatus(for: hrvType))
        } else {
            permissions["hrv"] = "denied"
        }
        
        // Check RHR permission
        if let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) {
            permissions["restingHr"] = statusToString(healthStore.authorizationStatus(for: rhrType))
        } else {
            permissions["restingHr"] = "denied"
        }
        
        call.resolve(["permissions": permissions])
    }
    
    @objc func requestPermissions(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }
        
        healthStore.requestAuthorization(toShare: nil, read: readTypes) { success, error in
            if let error = error {
                call.reject("Failed to request permissions: \(error.localizedDescription)")
                return
            }
            
            // Re-check permissions after request
            var permissions: [String: String] = [:]
            
            if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
                permissions["sleep"] = self.statusToString(self.healthStore.authorizationStatus(for: sleepType))
            }
            if let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) {
                permissions["hrv"] = self.statusToString(self.healthStore.authorizationStatus(for: hrvType))
            }
            if let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) {
                permissions["restingHr"] = self.statusToString(self.healthStore.authorizationStatus(for: rhrType))
            }
            
            let granted = permissions.values.contains("granted")
            call.resolve([
                "granted": granted,
                "permissions": permissions
            ])
        }
    }
    
    @objc func readSleep(_ call: CAPPluginCall) {
        guard let startDateStr = call.getString("startDate"),
              let endDateStr = call.getString("endDate") else {
            call.reject("startDate and endDate are required")
            return
        }
        
        guard let startDate = ISO8601DateFormatter().date(from: startDateStr),
              let endDate = ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("Invalid date format. Use ISO8601.")
            return
        }
        
        guard let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) else {
            call.resolve(["records": []])
            return
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: sleepType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { _, samples, error in
            if let error = error {
                call.reject("Failed to read sleep data: \(error.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKCategorySample] else {
                call.resolve(["records": []])
                return
            }
            
            let records = self.aggregateSleepSamples(samples)
            call.resolve(["records": records])
        }
        
        healthStore.execute(query)
    }
    
    @objc func readHRV(_ call: CAPPluginCall) {
        guard let startDateStr = call.getString("startDate"),
              let endDateStr = call.getString("endDate") else {
            call.reject("startDate and endDate are required")
            return
        }
        
        guard let startDate = ISO8601DateFormatter().date(from: startDateStr),
              let endDate = ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("Invalid date format. Use ISO8601.")
            return
        }
        
        guard let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            call.resolve(["records": []])
            return
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: hrvType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { _, samples, error in
            if let error = error {
                call.reject("Failed to read HRV data: \(error.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKQuantitySample] else {
                call.resolve(["records": []])
                return
            }
            
            let formatter = ISO8601DateFormatter()
            let records = samples.map { sample -> [String: Any] in
                return [
                    "timestamp": formatter.string(from: sample.startDate),
                    "value": sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli)),
                    "metric": "sdnn"
                ]
            }
            
            call.resolve(["records": records])
        }
        
        healthStore.execute(query)
    }
    
    @objc func readRestingHR(_ call: CAPPluginCall) {
        guard let startDateStr = call.getString("startDate"),
              let endDateStr = call.getString("endDate") else {
            call.reject("startDate and endDate are required")
            return
        }
        
        guard let startDate = ISO8601DateFormatter().date(from: startDateStr),
              let endDate = ISO8601DateFormatter().date(from: endDateStr) else {
            call.reject("Invalid date format. Use ISO8601.")
            return
        }
        
        guard let rhrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) else {
            call.resolve(["records": []])
            return
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: rhrType, predicate: predicate, limit: HKObjectQueryNoLimit, sortDescriptors: [sortDescriptor]) { _, samples, error in
            if let error = error {
                call.reject("Failed to read resting HR data: \(error.localizedDescription)")
                return
            }
            
            guard let samples = samples as? [HKQuantitySample] else {
                call.resolve(["records": []])
                return
            }
            
            let formatter = ISO8601DateFormatter()
            let records = samples.map { sample -> [String: Any] in
                return [
                    "timestamp": formatter.string(from: sample.startDate),
                    "bpm": Int(sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute())))
                ]
            }
            
            call.resolve(["records": records])
        }
        
        healthStore.execute(query)
    }
    
    // MARK: - Helper Methods
    
    private func statusToString(_ status: HKAuthorizationStatus) -> String {
        switch status {
        case .notDetermined:
            return "not_determined"
        case .sharingDenied:
            return "denied"
        case .sharingAuthorized:
            return "granted"
        @unknown default:
            return "not_determined"
        }
    }
    
    private func aggregateSleepSamples(_ samples: [HKCategorySample]) -> [[String: Any]] {
        // Group samples by sleep session (samples within 30 min of each other are same session)
        var sessions: [[HKCategorySample]] = []
        var currentSession: [HKCategorySample] = []
        var lastEndDate: Date?
        
        // Sort by start date
        let sortedSamples = samples.sorted { $0.startDate < $1.startDate }
        
        for sample in sortedSamples {
            if let lastEnd = lastEndDate {
                // If gap is more than 30 minutes, start new session
                if sample.startDate.timeIntervalSince(lastEnd) > 1800 {
                    if !currentSession.isEmpty {
                        sessions.append(currentSession)
                    }
                    currentSession = [sample]
                } else {
                    currentSession.append(sample)
                }
            } else {
                currentSession.append(sample)
            }
            lastEndDate = sample.endDate
        }
        
        if !currentSession.isEmpty {
            sessions.append(currentSession)
        }
        
        // Convert sessions to records
        let formatter = ISO8601DateFormatter()
        return sessions.map { session -> [String: Any] in
            let startDate = session.first?.startDate ?? Date()
            let endDate = session.last?.endDate ?? Date()
            let durationMin = endDate.timeIntervalSince(startDate) / 60
            
            // Calculate stages
            var stages: [String: Int] = ["rem": 0, "deep": 0, "core": 0, "awake": 0]
            
            for sample in session {
                let duration = Int(sample.endDate.timeIntervalSince(sample.startDate) / 60)
                
                if #available(iOS 16.0, *) {
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleepREM.rawValue:
                        stages["rem"]! += duration
                    case HKCategoryValueSleepAnalysis.asleepDeep.rawValue:
                        stages["deep"]! += duration
                    case HKCategoryValueSleepAnalysis.asleepCore.rawValue:
                        stages["core"]! += duration
                    case HKCategoryValueSleepAnalysis.awake.rawValue:
                        stages["awake"]! += duration
                    case HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue:
                        // Distribute unspecified to core (light sleep)
                        stages["core"]! += duration
                    default:
                        break
                    }
                } else {
                    // iOS 15 and earlier - no stages available
                    switch sample.value {
                    case HKCategoryValueSleepAnalysis.asleep.rawValue:
                        stages["core"]! += duration
                    case HKCategoryValueSleepAnalysis.awake.rawValue:
                        stages["awake"]! += duration
                    default:
                        break
                    }
                }
            }
            
            let totalSleep = stages["rem"]! + stages["deep"]! + stages["core"]!
            let totalTime = totalSleep + stages["awake"]!
            let efficiency = totalTime > 0 ? Double(totalSleep) / Double(totalTime) : 0.85
            
            return [
                "startDate": formatter.string(from: startDate),
                "endDate": formatter.string(from: endDate),
                "durationMin": Int(durationMin),
                "efficiency": efficiency,
                "stages": stages
            ]
        }
    }
}
