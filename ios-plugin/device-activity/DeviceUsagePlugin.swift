import Foundation
import Capacitor
import DeviceActivity
import FamilyControls
import SwiftUI

private let loomaAppGroup = "group.com.neurolooplabs.looma.shared"
private let selectionKey = "looma.attention.selection"

@available(iOS 16.0, *)
private struct AttentionPicker: View {
    @State var selection: FamilyActivitySelection
    let complete: (FamilyActivitySelection?) -> Void

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Attention apps")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") { complete(nil) }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Done") { complete(selection) }
                    }
                }
        }
    }
}

@objc(DeviceUsagePlugin)
public class DeviceUsagePlugin: CAPPlugin {
    @objc func isAvailable(_ call: CAPPluginCall) {
        if #available(iOS 16.0, *) {
            call.resolve(["available": true])
        } else {
            call.resolve(["available": false])
        }
    }

    @objc func getPermissionStatus(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.resolve(["state": "unavailable", "selectionReady": false])
            return
        }
        call.resolve([
            "state": permissionState(),
            "selectionReady": readSelection() != nil,
        ])
    }

    @objc func requestPermission(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *) else {
            call.resolve(["state": "unavailable"])
            return
        }
        Task {
            do {
                try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
                await MainActor.run { call.resolve(["state": self.permissionState()]) }
            } catch {
                await MainActor.run {
                    call.reject("Screen Time authorization failed: \(error.localizedDescription)")
                }
            }
        }
    }

    @objc func selectAttentionApps(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *), permissionState() == "granted" else {
            call.reject("Screen Time authorization is required")
            return
        }
        let initial = readSelection() ?? FamilyActivitySelection()
        var controller: UIViewController?
        let picker = AttentionPicker(selection: initial) { [weak self] selection in
            controller?.dismiss(animated: true)
            guard let self = self, let selection = selection else {
                call.resolve(["selectedCount": 0])
                return
            }
            do {
                let data = try PropertyListEncoder().encode(selection)
                UserDefaults(suiteName: loomaAppGroup)?.set(data, forKey: selectionKey)
                try self.startMonitoring(selection)
                let selectedCount = selection.applicationTokens.count + selection.categoryTokens.count
                call.resolve(["selectedCount": selectedCount])
            } catch {
                call.reject("Could not save protected activity selection: \(error.localizedDescription)")
            }
        }
        controller = UIHostingController(rootView: picker)
        bridge?.viewController?.present(controller!, animated: true)
    }

    @objc func getUsageAggregate(_ call: CAPPluginCall) {
        guard #available(iOS 16.0, *), permissionState() == "granted" else {
            call.resolve(emptyAggregate())
            return
        }
        let defaults = UserDefaults(suiteName: loomaAppGroup)
        let dayKey = Self.dayKey()
        let storedDay = defaults?.string(forKey: "looma.attention.day")
        let minutes = storedDay == dayKey ? defaults?.integer(forKey: "looma.attention.minutes") ?? 0 : 0
        let timestamp = storedDay == dayKey ? defaults?.object(forKey: "looma.attention.lastAt") as? Double : nil
        let selection = readSelection()
        let selectedCount = (selection?.applicationTokens.count ?? 0) +
            (selection?.categoryTokens.count ?? 0)
        call.resolve([
            "attentionUsageMin": minutes,
            "activeAppCount": selectedCount,
            "lastAttentionUseAt": timestamp.map { Int($0) } ?? NSNull(),
            "confidence": minutes > 0 ? 0.7 : 0.55,
        ])
    }

    @available(iOS 16.0, *)
    private func permissionState() -> String {
        switch AuthorizationCenter.shared.authorizationStatus {
        case .approved: return "granted"
        case .denied: return "denied"
        case .notDetermined: return "not_determined"
        @unknown default: return "unavailable"
        }
    }

    @available(iOS 16.0, *)
    private func readSelection() -> FamilyActivitySelection? {
        guard let data = UserDefaults(suiteName: loomaAppGroup)?.data(forKey: selectionKey) else {
            return nil
        }
        return try? PropertyListDecoder().decode(FamilyActivitySelection.self, from: data)
    }

    @available(iOS 16.0, *)
    private func startMonitoring(_ selection: FamilyActivitySelection) throws {
        let center = DeviceActivityCenter()
        let schedule = DeviceActivitySchedule(
            intervalStart: DateComponents(hour: 0, minute: 0),
            intervalEnd: DateComponents(hour: 23, minute: 59),
            repeats: true
        )
        var events: [DeviceActivityEvent.Name: DeviceActivityEvent] = [:]
        for minutes in stride(from: 15, through: 720, by: 15) {
            let name = DeviceActivityEvent.Name("looma.attention.\(minutes)")
            events[name] = DeviceActivityEvent(
                applications: selection.applicationTokens,
                categories: selection.categoryTokens,
                webDomains: selection.webDomainTokens,
                threshold: DateComponents(hour: minutes / 60, minute: minutes % 60)
            )
        }
        try center.startMonitoring(
            DeviceActivityName("looma.attention"),
            during: schedule,
            events: events
        )
    }

    private func emptyAggregate() -> [String: Any] {
        [
            "attentionUsageMin": 0,
            "activeAppCount": 0,
            "lastAttentionUseAt": NSNull(),
            "confidence": 0,
        ]
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
