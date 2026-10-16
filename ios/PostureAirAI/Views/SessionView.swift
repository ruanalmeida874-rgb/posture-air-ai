//
//  SessionView.swift
//  PostureAirAI
//
//  Monitoramento em tempo real com AirPods Head Tracking.
//

import SwiftUI

struct SessionView: View {
    @EnvironmentObject var motionManager: MotionManager
    @EnvironmentObject var postureEngine: PostureAIEngine
    @EnvironmentObject var alertManager: AudioAlertManager
    @Environment(\.dismiss) var dismiss

    @State private var elapsedSeconds: Int = 0
    @State private var isPaused: Bool = false
    @State private var activeAlertMessage: String? = nil
    @State private var showingSummary: Bool = false

    let sessionTimer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 20) {
                // Top Bar
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("SESSÃO AO VIVO")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .tracking(2)
                            .foregroundColor(.gray)

                        Text(formattedTime(elapsedSeconds))
                            .font(.system(size: 26, weight: .bold, design: .monospaced))
                            .foregroundColor(.white)
                    }

                    Spacer()

                    // Status Pill
                    Text(postureEngine.currentState.label)
                        .font(.caption)
                        .fontWeight(.bold)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(
                            Capsule().fill(
                                postureEngine.currentState == .good ? Color.mint.opacity(0.15) :
                                (postureEngine.currentState == .warn ? Color.yellow.opacity(0.15) : Color.red.opacity(0.15))
                            )
                        )
                        .foregroundColor(
                            postureEngine.currentState == .good ? .mint :
                            (postureEngine.currentState == .warn ? .yellow : .red)
                        )
                }
                .padding(.horizontal, 20)
                .padding(.top, 10)

                // Activity Ring Score
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.08), lineWidth: 16)
                        .frame(width: 220, height: 220)

                    Circle()
                        .trim(from: 0, to: Double(postureEngine.currentScore) / 100.0)
                        .stroke(
                            AngularGradient(
                                colors: postureEngine.currentState == .bad ? [.red, .orange, .red] : [.mint, .purple, .mint],
                                center: .center
                            ),
                            style: StrokeStyle(lineWidth: 16, lineCap: .round)
                        )
                        .frame(width: 220, height: 220)
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: postureEngine.currentScore)

                    VStack(spacing: 4) {
                        Text("\(postureEngine.currentScore)")
                            .font(.system(size: 60, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        Text("SCORE ATUAL")
                            .font(.caption2)
                            .fontWeight(.bold)
                            .tracking(1.5)
                            .foregroundColor(.gray)
                    }
                }
                .padding(.vertical, 10)

                // Active Alert Banner
                if let alert = activeAlertMessage {
                    HStack(spacing: 12) {
                        Image(systemName: "speaker.wave.3.fill")
                            .foregroundColor(.yellow)
                            .font(.title3)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("ALERTA NOS AIRPODS")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.yellow)
                            Text(alert)
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.white)
                        }
                        Spacer()
                    }
                    .padding(14)
                    .background(RoundedRectangle(cornerRadius: 18).fill(Color.yellow.opacity(0.12)).overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.yellow.opacity(0.3), lineWidth: 1)))
                    .padding(.horizontal, 20)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }

                // Telemetry Badges
                HStack(spacing: 10) {
                    TelemetryBox(title: "TILT FRONTAL", value: String(format: "%+.0f°", postureEngine.deltaPitch), sub: "frente/trás")
                    TelemetryBox(title: "TILT LATERAL", value: String(format: "%+.0f°", postureEngine.deltaRoll), sub: "esq/dir")
                    TelemetryBox(title: "CORREÇÕES", value: "\(postureEngine.correctionsCount)", sub: "nesta sessão")
                }
                .padding(.horizontal, 20)

                Spacer()

                // Session Controls
                HStack(spacing: 12) {
                    Button {
                        isPaused.toggle()
                    } label: {
                        Image(systemName: isPaused ? "play.fill" : "pause.fill")
                            .font(.title2)
                            .foregroundColor(.white)
                            .frame(width: 60, height: 60)
                            .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.1)))
                    }

                    Button {
                        finishSession()
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "stop.fill")
                            Text("Finalizar Sessão")
                        }
                        .font(.headline)
                        .foregroundColor(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 60)
                        .background(RoundedRectangle(cornerRadius: 20).fill(Color.mint))
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 20)
            }
        }
        .onAppear {
            postureEngine.resetSession()
            motionManager.startHeadTracking { pitch, roll, yaw in
                guard !isPaused else { return }
                if let alert = postureEngine.processTelemetry(pitch: pitch, roll: roll, yaw: yaw) {
                    activeAlertMessage = alert
                    alertManager.speak(message: alert)
                    DispatchQueue.main.asyncAfter(deadline: .now() + 4.0) {
                        activeAlertMessage = nil
                    }
                }
            }
        }
        .onDisappear {
            motionManager.stopTracking()
        }
        .onReceive(sessionTimer) { _ in
            guard !isPaused else { return }
            elapsedSeconds += 1
        }
        .navigationDestination(isPresented: $showingSummary) {
            SummaryView(durationSec: elapsedSeconds, score: postureEngine.currentScore, corrections: postureEngine.correctionsCount)
        }
    }

    private func finishSession() {
        motionManager.stopTracking()
        alertManager.playGentleChime()
        showingSummary = true
    }

    private func formattedTime(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%02d:%02d", m, s)
    }
}

struct TelemetryBox: View {
    let title: String
    let value: String
    let sub: String

    var body: some View {
        VStack(spacing: 4) {
            Text(title)
                .font(.system(size: 9, weight: .bold))
                .tracking(1)
                .foregroundColor(.gray)

            Text(value)
                .font(.title3)
                .fontWeight(.bold)
                .foregroundColor(.white)

            Text(sub)
                .font(.system(size: 9))
                .foregroundColor(.gray)
        }
        .padding(.vertical, 12)
        .frame(maxWidth: .infinity)
        .background(RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.06)))
    }
}
