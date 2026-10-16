//
//  PostureAIEngine.swift
//  PostureAirAI
//
//  Camada inteligente de análise biomecânica e telemetria postural em tempo real.
//

import Foundation
import Combine

enum PostureState: String, Codable {
    case good = "good"
    case warn = "warn"
    case bad = "bad"

    var label: String {
        switch self {
        case .good: return "Postura alinhada"
        case .warn: return "Atenção"
        case .bad: return "Corrija agora"
        }
    }
}

struct BaselineCalibration: Codable {
    var pitch: Double
    var roll: Double
    var yaw: Double
    var date: Date
}

class PostureAIEngine: ObservableObject {
    @Published var currentScore: Int = 96
    @Published var currentState: PostureState = .good
    @Published var deltaPitch: Double = 0.0
    @Published var deltaRoll: Double = 0.0
    @Published var correctionsCount: Int = 0
    @Published var isCalibrated: Bool = false

    private var baseline: BaselineCalibration?
    private var badStreakSeconds: Int = 0
    private var lastScoreFloat: Double = 96.0

    private let userDefaultsKey = "PostureAirAI_Baseline"

    init() {
        loadSavedBaseline()
    }

    func loadSavedBaseline() {
        if let data = UserDefaults.standard.data(forKey: userDefaultsKey),
           let saved = try? JSONDecoder().decode(BaselineCalibration.self, from: data) {
            self.baseline = saved
            self.isCalibrated = true
        }
    }

    func saveBaseline(pitch: Double, roll: Double, yaw: Double) {
        let newBaseline = BaselineCalibration(pitch: pitch, roll: roll, yaw: yaw, date: Date())
        self.baseline = newBaseline
        self.isCalibrated = true

        if let encoded = try? JSONEncoder().encode(newBaseline) {
            UserDefaults.standard.set(encoded, forKey: userDefaultsKey)
        }
    }

    func processTelemetry(pitch: Double, roll: Double, yaw: Double, alertDelaySec: Int = 30) -> String? {
        let refPitch = baseline?.pitch ?? 0.0
        let refRoll = baseline?.roll ?? 0.0

        let dPitch = pitch - refPitch
        let dRoll = abs(roll - refRoll)

        self.deltaPitch = dPitch
        self.deltaRoll = dRoll

        var state: PostureState = .good
        if dPitch > 18.0 || dRoll > 15.0 {
            state = .bad
        } else if dPitch > 11.0 || dRoll > 8.0 {
            state = .warn
        }
        self.currentState = state

        // Dynamic Score algorithm
        let targetScore: Double = (state == .good) ? 98.0 : ((state == .warn) ? 75.0 : 45.0)
        lastScoreFloat += (targetScore - lastScoreFloat) * 0.12
        self.currentScore = Int(max(0, min(100, lastScoreFloat.rounded())))

        // Streak & Alert evaluation
        if state == .bad || state == .warn {
            badStreakSeconds += 1
            if badStreakSeconds == alertDelaySec {
                correctionsCount += 1
                if dPitch > 14.0 {
                    return "Você está inclinando a cabeça para frente há \(alertDelaySec) segundos"
                } else if dRoll > 10.0 {
                    return "Alinhe sua cabeça e relaxe os ombros"
                } else {
                    return "Corrija sua postura"
                }
            }
        } else {
            badStreakSeconds = max(0, badStreakSeconds - 1)
        }

        return nil
    }

    func resetSession() {
        correctionsCount = 0
        badStreakSeconds = 0
        lastScoreFloat = 96.0
        currentScore = 96
        currentState = .good
    }
}
