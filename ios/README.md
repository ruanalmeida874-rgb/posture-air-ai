# Posture Air AI — Projeto Nativo iOS (SwiftUI & Xcode)

Este diretório contém a implementação nativa completa do **Posture Air AI** para iOS, construído com **SwiftUI**, **Core Motion (`CMHeadphoneMotionManager`)** e **AVFoundation**.

---

## 📱 Visão Geral da Arquitetura Nativa

- **Linguagem & Framework**: Swift 5.10+ / SwiftUI
- **Padrão**: MVVM (Model-View-ViewModel) com Combine e StateObjects reativos
- **Rastreamento de Cabeça**: `CMHeadphoneMotionManager` (AirPods Pro / AirPods Max / Beats Fit Pro)
- **Áudio & Feedback**: `AVSpeechSynthesizer` (Síntese de voz nativa em português `pt-BR`) e `AVAudioSession` configurada com `mixWithOthers` e `duckOthers` (alertas discretos sem interromper a música ou estudo do usuário)
- **Persistência**: `UserDefaults` para baseline e histórico local offline

---

## 🛠️ Como Abrir e Rodar no Xcode

### 1. Criar o Projeto no Xcode
1. Abra o **Xcode** no seu Mac.
2. Selecione **File > New > Project...**
3. Escolha a plataforma **iOS** e o template **App**.
4. Configure os dados do projeto:
   - **Product Name**: `PostureAirAI`
   - **Organization Identifier**: `com.seuNomeOuEmpresa` (ex: `com.postureair.app`)
   - **Interface**: `SwiftUI`
   - **Language**: `Swift`
5. Salve o projeto no seu Mac.

### 2. Adicionar os Arquivos do Repositório
Copie os arquivos da pasta `ios/PostureAirAI/` para dentro do seu projeto no Xcode:
- `PostureAirAIApp.swift`
- `Motion/MotionManager.swift`
- `Engine/PostureAIEngine.swift`
- `Audio/AudioAlertManager.swift`
- `Views/HomeView.swift`
- `Views/CalibrationView.swift`
- `Views/SessionView.swift`
- `Views/SummaryView.swift`
- `Info.plist`

### 3. Configurar Capabilities no Xcode
No Xcode, clique no alvo do seu aplicativo (**Target > Signing & Capabilities**):
1. **Signing**: Selecione seu **Team** de desenvolvedor Apple.
2. Clique em **+ Capability** e adicione:
   - **Background Modes**: marque `Audio, AirPlay, and Picture in Picture`. Isso permite que os alertas de postura e a conexão com os AirPods continuem operando mesmo se a tela for bloqueada ou o usuário mudar de app.

### 4. Rodar no iPhone Real com AirPods
> **Importante**: O rastreamento de cabeça via `CMHeadphoneMotionManager` exige um **dispositivo físico** (iPhone) emparelhado com AirPods Pro (1ª ou 2ª geração), AirPods 3, AirPods Max ou Beats Fit Pro. O simulador do Xcode não possui acelerômetro de fone.

1. Conecte seu iPhone ao Mac via cabo USB ou Wi-Fi.
2. Coloque seus AirPods nos ouvidos.
3. No Xcode, selecione o seu iPhone como dispositivo de destino.
4. Pressione **Cmd + R** (Run) para compilar e iniciar.

---

## 🚀 Como Preparar para o TestFlight

1. No Xcode, selecione o dispositivo **Any iOS Device (arm64)** no seletor de topo.
2. Vá em **Product > Archive**.
3. Quando a janela **Organizer** abrir:
   - Clique em **Distribute App**.
   - Selecione **TestFlight & App Store**.
   - Siga o assistente de assinatura automática e upload para o **App Store Connect**.
4. No painel do [App Store Connect](https://appstoreconnect.apple.com), acesse o app em **TestFlight**, adicione os emails dos testadores internos/externos e envie para testes reais.
