//
//  PostureAirAIApp.swift
//  PostureAirAI
//
//  Personal trainer de postura invisível com rastreamento de cabeça via AirPods.
//

import SwiftUI
import AVFoundation

@main
struct PostureAirAIApp: App {
    @StateObject private var motionManager = MotionManager()
    @StateObject private var postureEngine = PostureAIEngine()
    @StateObject private var alertManager = AudioAlertManager()

    init() {
        configureAudioSession()
    }

    var body: some Scene {
        WindowGroup {
            HomeView()
                .environmentObject(motionManager)
                .environmentObject(postureEngine)
                .environmentObject(alertManager)
                .preferredColorScheme(.dark)
        }
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers, .duckOthers])
            try session.setActive(true)
        } catch {
            print("Falha ao configurar AVAudioSession para alertas em background: \(error)")
        }
    }
}
