//
//  HomeView.swift
//  PostureAirAI
//
//  Dashboard principal estilo Apple Health / Apple Fitness+.
//

import SwiftUI

struct HomeView: View {
    @EnvironmentObject var motionManager: MotionManager
    @EnvironmentObject var postureEngine: PostureAIEngine

    @State private var showingCalibration = false
    @State private var showingSession = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Header
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("BOM DIA")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .tracking(2)
                                    .foregroundColor(.gray)

                                Text("Você")
                                    .font(.system(size: 32, weight: .bold))
                                    .foregroundColor(.white)
                            }
                            Spacer()
                            Circle()
                                .fill(LinearGradient(colors: [Color.mint, Color.purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                                .frame(width: 44, height: 44)
                                .overlay(Text("V").bold().foregroundColor(.white))
                        }
                        .padding(.top, 10)

                        // AirPods Status Card
                        HStack(spacing: 14) {
                            ZStack {
                                Circle()
                                    .fill(motionManager.isAirPodsConnected ? Color.mint.opacity(0.2) : Color.gray.opacity(0.2))
                                    .frame(width: 42, height: 42)
                                Image(systemName: "airpodspro")
                                    .foregroundColor(motionManager.isAirPodsConnected ? .mint : .gray)
                                    .font(.system(size: 20))
                            }

                            VStack(alignment: .leading, spacing: 2) {
                                Text("AirPods Pro")
                                    .font(.subheadline)
                                    .fontWeight(.semibold)
                                    .foregroundColor(.white)
                                Text(motionManager.isAirPodsConnected ? "Conectado · Head Tracking Ativo" : "Conecte seus AirPods")
                                    .font(.caption)
                                    .foregroundColor(motionManager.isAirPodsConnected ? .mint : .gray)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                                .font(.caption)
                        }
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.06)))

                        // Central Activity Ring
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .stroke(Color.white.opacity(0.08), lineWidth: 16)
                                    .frame(width: 210, height: 210)

                                Circle()
                                    .trim(from: 0, to: Double(postureEngine.currentScore) / 100.0)
                                    .stroke(
                                        AngularGradient(colors: [.mint, .purple, .mint], center: .center),
                                        style: StrokeStyle(lineWidth: 16, lineCap: .round)
                                    )
                                    .frame(width: 210, height: 210)
                                    .rotationEffect(.degrees(-90))
                                    .shadow(color: .mint.opacity(0.3), radius: 10)

                                VStack(spacing: 4) {
                                    Text("\(postureEngine.currentScore)")
                                        .font(.system(size: 54, weight: .bold, design: .rounded))
                                        .foregroundColor(.white)
                                    Text("POSTURA HOJE")
                                        .font(.caption2)
                                        .fontWeight(.bold)
                                        .tracking(1.5)
                                        .foregroundColor(.gray)
                                }
                            }
                            .padding(.vertical, 10)

                            Text(postureEngine.currentScore >= 90 ? "Postura excelente. Mantenha os ombros relaxados." : "Inicie uma sessão para proteger sua coluna.")
                                .font(.footnote)
                                .foregroundColor(.gray)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 20)
                        }
                        .frame(maxWidth: .infinity)

                        // Main Action Button
                        Button {
                            if postureEngine.isCalibrated {
                                showingSession = true
                            } else {
                                showingCalibration = true
                            }
                        } label: {
                            HStack(spacing: 8) {
                                Image(systemName: "sparkles")
                                Text(postureEngine.isCalibrated ? "Começar sessão" : "Calibrar e começar")
                            }
                            .font(.headline)
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(
                                RoundedRectangle(cornerRadius: 18)
                                    .fill(Color.mint)
                                    .shadow(color: .mint.opacity(0.4), radius: 14, y: 6)
                            )
                        }
                        .padding(.top, 6)

                        // Quick Stat Cards
                        HStack(spacing: 12) {
                            StatCardView(title: "TEMPO MONITORADO", value: "1h 45m", icon: "waveform.path.ecg", color: .mint)
                            StatCardView(title: "SESSÕES HOJE", value: "2", icon: "clock", color: .purple)
                        }

                        Spacer(minLength: 40)
                    }
                    .padding(.horizontal, 20)
                }
            }
            .navigationDestination(isPresented: $showingCalibration) {
                CalibrationView()
            }
            .navigationDestination(isPresented: $showingSession) {
                SessionView()
            }
        }
    }
}

struct StatCardView: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: icon)
                    .foregroundColor(color)
                    .font(.caption)
                Text(title)
                    .font(.caption2)
                    .fontWeight(.bold)
                    .foregroundColor(.gray)
            }
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.06)))
    }
}
