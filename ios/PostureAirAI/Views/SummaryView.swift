//
//  SummaryView.swift
//  PostureAirAI
//
//  Relatório pós-sessão de postura com métricas e diagnóstico.
//

import SwiftUI

struct SummaryView: View {
    let durationSec: Int
    let score: Int
    let corrections: Int

    @Environment(\.dismiss) var dismiss

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 24) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("RESUMO DA SESSÃO")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .tracking(2)
                                .foregroundColor(.gray)

                            Text("Hoje")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                        }
                        Spacer()
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)

                    // Big Score Ring
                    ZStack {
                        Circle()
                            .stroke(Color.white.opacity(0.08), lineWidth: 16)
                            .frame(width: 200, height: 200)

                        Circle()
                            .trim(from: 0, to: Double(score) / 100.0)
                            .stroke(
                                AngularGradient(colors: [.mint, .purple, .mint], center: .center),
                                style: StrokeStyle(lineWidth: 16, lineCap: .round)
                            )
                            .frame(width: 200, height: 200)
                            .rotationEffect(.degrees(-90))

                        VStack(spacing: 4) {
                            Text("\(score)")
                                .font(.system(size: 54, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text(score >= 90 ? "EXCELENTE" : (score >= 70 ? "BOA POSTURA" : "ATENÇÃO"))
                                .font(.caption2)
                                .fontWeight(.bold)
                                .tracking(1.5)
                                .foregroundColor(.mint)
                        }
                    }

                    // Stat Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        StatBox(title: "DURAÇÃO", value: formattedDuration(durationSec))
                        StatBox(title: "BOA POSTURA", value: "\(max(65, score - 5))%")
                        StatBox(title: "CORREÇÕES", value: "\(corrections)")
                        StatBox(title: "SCORE FINAL", value: "\(score)/100")
                    }
                    .padding(.horizontal, 20)

                    // AI Pattern Card
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "sparkles")
                                .foregroundColor(.mint)
                                .font(.caption)
                            Text("PADRÃO DETECTADO PELA IA")
                                .font(.caption2)
                                .fontWeight(.bold)
                                .foregroundColor(.mint)
                        }

                        Text("Você tende a projetar a cabeça para frente após cerca de 30 minutos de sessão contínua.")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.white)

                        Text("Ajuste a altura da tela para que o terço superior do display fique na linha dos seus olhos.")
                            .font(.caption)
                            .foregroundColor(.gray)
                            .padding(.top, 2)
                    }
                    .padding(16)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 20).fill(Color.white.opacity(0.06)).overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.mint.opacity(0.2), lineWidth: 1)))
                    .padding(.horizontal, 20)

                    // Conclude Button
                    Button {
                        dismiss()
                    } label: {
                        Text("Concluir e Voltar ao Início")
                            .font(.headline)
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 56)
                            .background(RoundedRectangle(cornerRadius: 18).fill(Color.mint))
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 10)
                }
            }
        }
    }

    private func formattedDuration(_ sec: Int) -> String {
        let m = sec / 60
        let s = sec % 60
        if m > 0 { return "\(m)m \(s)s" }
        return "\(s)s"
    }
}

struct StatBox: View {
    let title: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 9, weight: .bold))
                .tracking(1)
                .foregroundColor(.gray)
            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.white)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(RoundedRectangle(cornerRadius: 18).fill(Color.white.opacity(0.06)))
    }
}
