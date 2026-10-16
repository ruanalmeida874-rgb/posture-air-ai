//
//  CalibrationView.swift
//  PostureAirAI
//
//  Calibração individual de postura (10 segundos).
//

import SwiftUI

struct CalibrationView: View {
    @EnvironmentObject var motionManager: MotionManager
    @EnvironmentObject var postureEngine: PostureAIEngine
    @EnvironmentObject var alertManager: AudioAlertManager
    @Environment(\.dismiss) var dismiss

    @State private var timeRemaining = 10
    @State private var isCounting = false
    @State private var isDone = false

    @State private var collectedPitches: [Double] = []
    @State private var collectedRolls: [Double] = []
    @State private var collectedYaws: [Double] = []

    let timer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 24) {
                // Navigation
                HStack {
                    Button {
                        motionManager.stopTracking()
                        dismiss()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "chevron.left")
                            Text("Voltar")
                        }
                        .foregroundColor(.gray)
                        .font(.subheadline)
                    }
                    Spacer()
                }
                .padding(.horizontal, 20)

                Spacer()

                if !isDone {
                    // 10s Ring Counter
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.08), lineWidth: 14)
                            .frame(width: 220, height: 220)

                        Circle()
                            .trim(from: 0, to: Double(10 - timeRemaining) / 10.0)
                            .stroke(
                                LinearGradient(colors: [.mint, .purple], startPoint: .topLeading, endPoint: .bottomTrailing),
                                style: StrokeStyle(lineWidth: 14, lineCap: .round)
                            )
                            .frame(width: 220, height: 220)
                            .rotationEffect(.degrees(-90))
                            .animation(.linear(duration: 1.0), value: timeRemaining)

                        VStack(spacing: 6) {
                            Text("\(timeRemaining)")
                                .font(.system(size: 64, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("SEGUNDOS")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .tracking(2)
                                .foregroundColor(.gray)
                        }
                    }

                    VStack(spacing: 8) {
                        Text(isCounting ? "Capturando baseline da cabeça..." : "Fique em postura alinhada")
                            .font(.title3)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Sente-se em uma posição confortável e relaxe os ombros. Seus AirPods estão medindo sua referência natural.")
                            .font(.footnote)
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)
                    }

                    if !isCounting {
                        Button {
                            startCalibration()
                        } label: {
                            Text("Iniciar Calibração (10s)")
                                .font(.headline)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .frame(height: 54)
                                .background(RoundedRectangle(cornerRadius: 18).fill(Color.mint))
                        }
                        .padding(.horizontal, 20)
                    }
                } else {
                    // Success Screen
                    VStack(spacing: 20) {
                        ZStack {
                            Circle()
                                .fill(Color.mint.opacity(0.2))
                                .frame(width: 90, height: 90)
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundColor(.mint)
                                .font(.system(size: 56))
                        }

                        Text("Calibração Concluída")
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.white)

                        Text("Sua postura base personalizada foi salva. Os alertas nos AirPods agora usarão essa referência.")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 30)

                        Button {
                            dismiss()
                        } label: {
                            Text("Concluir")
                                .font(.headline)
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .frame(height: 54)
                                .background(RoundedRectangle(cornerRadius: 18).fill(Color.mint))
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 20)
                    }
                }

                Spacer()
            }
        }
        .onReceive(timer) { _ in
            guard isCounting && timeRemaining > 0 else { return }
            timeRemaining -= 1

            // Amostrar postura atual
            collectedPitches.append(motionManager.pitchDegrees)
            collectedRolls.append(motionManager.rollDegrees)
            collectedYaws.append(motionManager.yawDegrees)

            if timeRemaining == 0 {
                finishCalibration()
            }
        }
    }

    private func startCalibration() {
        timeRemaining = 10
        isCounting = true
        collectedPitches.removeAll()
        collectedRolls.removeAll()
        collectedYaws.removeAll()

        alertManager.playGentleChime()

        motionManager.startHeadTracking { _, _, _ in }
    }

    private func finishCalibration() {
        isCounting = false
        isDone = true

        let avgPitch = collectedPitches.isEmpty ? 0.0 : collectedPitches.reduce(0, +) / Double(collectedPitches.count)
        let avgRoll = collectedRolls.isEmpty ? 0.0 : collectedRolls.reduce(0, +) / Double(collectedRolls.count)
        let avgYaw = collectedYaws.isEmpty ? 0.0 : collectedYaws.reduce(0, +) / Double(collectedYaws.count)

        postureEngine.saveBaseline(pitch: avgPitch, roll: avgRoll, yaw: avgYaw)
        alertManager.speak(message: "Calibração concluída com sucesso.")
    }
}
