//
//  AudioAlertManager.swift
//  PostureAirAI
//
//  Síntese de voz com AVSpeechSynthesizer e alertas hápticos.
//

import Foundation
import AVFoundation
import UIKit

class AudioAlertManager: ObservableObject {
    private let synthesizer = AVSpeechSynthesizer()
    private let hapticImpact = UIImpactFeedbackGenerator(style: .medium)

    func speak(message: String, isFemaleVoice: Bool = true) {
        // Disparar feedback háptico suave
        hapticImpact.prepare()
        hapticImpact.impactOccurred()

        let utterance = AVSpeechUtterance(string: message)
        utterance.voice = AVSpeechSynthesisVoice(language: "pt-BR")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        utterance.pitchMultiplier = isFemaleVoice ? 1.15 : 0.85
        utterance.volume = 0.9

        synthesizer.stopSpeaking(at: .immediate)
        synthesizer.speak(utterance)
    }

    func playGentleChime() {
        hapticImpact.prepare()
        hapticImpact.impactOccurred()
        // AudioServicesPlaySystemSound(1057) - Som sutil do iOS
        AudioServicesPlaySystemSound(1057)
    }
}
