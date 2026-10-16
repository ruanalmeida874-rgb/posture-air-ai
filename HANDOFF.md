# Posture Air AI — Handoff & Documentação do Sistema

Assistente inteligente de monitoramento e correção de postura em tempo real — o "personal trainer de postura invisível".

## 🚀 Arquitetura e Solução Completa

O projeto agora é **100% funcional** e conta com duas camadas completas:
1. **Aplicação Web / PWA com IA de Visão Computacional**:
   - Monitoramento em tempo real via **câmera frontal do celular/computador** com **MediaPipe Tasks Vision** (`PoseLandmarker` on-device com aceleração WebGL/WASM).
   - Modo Minimalista Discreto estilo Apple Health / Fitness+ (câmera roda silenciosa em segundo plano sem poluir a interface).
   - Drawer de enquadramento com sobreposição de guias biomecânicas (linhas entre orelhas, ombros e eixo central).
   - Calibração anatômica real de 10 segundos com cálculo de baseline (`roll`, `pitch`, `shoulderSlope`).
   - Alertas por voz nativa em português (`pt-BR`) via Web Speech API e acordes harmônicos discretos sintetizados via Web Audio API (frequências de 528Hz).
   - Relatório pós-sessão alimentado pela série temporal real gravada e diagnóstico semântico inteligente de padrões posturais.
2. **Módulo Nativo iOS em SwiftUI (`ios/PostureAirAI/`)**:
   - Projeto nativo pronto para compilação no Xcode e envio ao **TestFlight**.
   - Rastreamento real de cabeça direto dos **AirPods Pro / Max / Beats** via `CMHeadphoneMotionManager`.
   - Síntese de voz com `AVSpeechSynthesizer` em background com categoria `.playback` (`mixWithOthers`).

---

## 💻 Como Rodar o Web App

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Compilar para produção
npm run build
```

---

## 📱 Estrutura do Projeto Web

| Caminho | Descrição |
|---|---|
| `src/routes/index.tsx` | Dashboard principal (score do dia, anel Apple Fitness, status da câmera/AirPods) |
| `src/routes/calibrate.tsx` | Calibração biométrica com câmera frontal (10 segundos para medir baseline) |
| `src/routes/session.tsx` | Sessão ao vivo: visão computacional em background, RingScore dinâmico, drawer de enquadramento e alertas |
| `src/routes/summary.tsx` | Resumo detalhado com timeline real, % de postura alinhada, diagnóstico e compartilhamento |
| `src/routes/history.tsx` | Evolução semanal, streak e lista de sessões gravadas |
| `src/routes/profile.tsx` | Ajustes de sensibilidade, tempo de tolerância, tipo de voz e botão de teste de áudio |
| `src/lib/posture-engine.ts` | Engine de Visão MediaPipe, extração de métricas (Roll, Pitch, Ombros) e diagnóstico |
| `src/lib/audio-alerts.ts` | Sintetizador de acordes suaves (Web Audio API), fala em português e vibração tátil |
| `src/lib/posture-store.ts` | Armazenamento de perfil, calibração baseline, sessões e cálculo de streak |
| `src/components/PhoneFrame.tsx` | Layout responsivo (visual nativo edge-to-edge no celular, moldura iPhone 16 Pro no desktop) |

---

## 🍏 Estrutura do App Nativo iOS (`ios/`)

| Caminho | Descrição |
|---|---|
| `ios/PostureAirAI/PostureAirAIApp.swift` | Ponto de entrada do app com configuração de áudio em background |
| `ios/PostureAirAI/Motion/MotionManager.swift` | Rastreamento de cabeça via `CMHeadphoneMotionManager` dos AirPods |
| `ios/PostureAirAI/Engine/PostureAIEngine.swift` | Engine de análise biomecânica, desvios e cálculo de score dinâmico |
| `ios/PostureAirAI/Audio/AudioAlertManager.swift` | Síntese de voz nativa (`AVSpeechSynthesizer`) e feedback háptico |
| `ios/PostureAirAI/Views/` | Telas SwiftUI: `HomeView`, `CalibrationView`, `SessionView`, `SummaryView` |
| `ios/PostureAirAI/Info.plist` | Configurações de permissões de Motion, Bluetooth e Background Modes |
| `ios/README.md` | Guia passo a passo para rodar no Xcode e enviar ao TestFlight |
