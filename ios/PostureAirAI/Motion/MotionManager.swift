//
//  MotionManager.swift
//  PostureAirAI
//
//  Rastreamento de cabeça em tempo real via AirPods (CMHeadphoneMotionManager).
//

import Foundation
import CoreMotion
import Combine

class MotionManager: ObservableObject {
    private let headphoneManager = CMHeadphoneMotionManager()
    private let deviceManager = CMMotionManager()

    @Published var isAirPodsConnected: Bool = false
    @Published var isTracking: Bool = false
    @Published var pitchDegrees: Double = 0.0 // Forward (+) / Backward (-)
    @Published var rollDegrees: Double = 0.0  // Lateral Left (-) / Right (+)
    @Published var yawDegrees: Double = 0.0   // Rotation

    init() {
        checkHeadphoneMotionAvailability()
    }

    func checkHeadphoneMotionAvailability() {
        isAirPodsConnected = headphoneManager.isDeviceMotionAvailable
    }

    func startHeadTracking(onUpdate: @escaping (Double, Double, Double) -> Void) {
        guard headphoneManager.isDeviceMotionAvailable else {
            print("AirPods com Head Tracking não disponíveis. Tentando sensores locais.")
            startDeviceMotionFallback(onUpdate: onUpdate)
            return
        }

        headphoneManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, error in
            guard let self = self, let motion = motion, error == nil else {
                if let err = error {
                    print("Erro no Head Tracking dos AirPods: \(err.localizedDescription)")
                }
                return
            }

            self.isAirPodsConnected = true
            self.isTracking = true

            // Converter ângulos de Euler (radianos) para graus
            let pitch = motion.attitude.pitch * (180.0 / .pi)
            let roll = motion.attitude.roll * (180.0 / .pi)
            let yaw = motion.attitude.yaw * (180.0 / .pi)

            DispatchQueue.main.async {
                self.pitchDegrees = pitch
                self.rollDegrees = roll
                self.yawDegrees = yaw
                onUpdate(pitch, roll, yaw)
            }
        }
    }

    private func startDeviceMotionFallback(onUpdate: @escaping (Double, Double, Double) -> Void) {
        guard deviceManager.isDeviceMotionAvailable else { return }
        deviceManager.deviceMotionUpdateInterval = 0.05
        deviceManager.startDeviceMotionUpdates(to: .main) { [weak self] motion, _ in
            guard let self = self, let motion = motion else { return }
            self.isTracking = true
            let pitch = motion.attitude.pitch * (180.0 / .pi)
            let roll = motion.attitude.roll * (180.0 / .pi)
            let yaw = motion.attitude.yaw * (180.0 / .pi)

            DispatchQueue.main.async {
                self.pitchDegrees = pitch
                self.rollDegrees = roll
                self.yawDegrees = yaw
                onUpdate(pitch, roll, yaw)
            }
        }
    }

    func stopTracking() {
        if headphoneManager.isDeviceMotionActive {
            headphoneManager.stopDeviceMotionUpdates()
        }
        if deviceManager.isDeviceMotionActive {
            deviceManager.stopDeviceMotionUpdates()
        }
        isTracking = false
    }
}
