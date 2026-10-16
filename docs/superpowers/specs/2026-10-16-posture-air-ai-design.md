# Especificação de Design — Posture Air AI

**Data:** 16 de Outubro de 2026  
**Status:** Aprovado para Implementação  
**Versão:** 1.0 (MVP Comercializável e Funcional)

---

## 1. Visão Geral do Produto

O **Posture Air AI** é um assistente inteligente de correção e monitoramento de postura em tempo real, concebido para atuar como um "personal trainer de postura invisível" durante sessões de trabalho, estudo, leitura ou uso de telas.

O projeto atende a dois pilares complementares:
1. **Aplicação Web / PWA Totalmente Funcional**: Monitoramento ativo por inteligência visual através da **câmera frontal do celular/computador** via visão computacional on-device (MediaPipe), com interface minimalista discreta no estilo Apple Health / Fitness+, calibração biométrica individual de 10 segundos, alertas inteligentes por voz nativa em português e áudio espacial suave.
2. **Módulo Nativo iOS em SwiftUI**: Arquitetura nativa completa para iPhone com `CMHeadphoneMotionManager` para rastrear dados de movimento da cabeça diretamente de **AirPods Pro / Max**, `AVSpeechSynthesizer` e persistência local, pronta para compilação no Xcode e publicação no TestFlight.

---

## 2. Arquitetura do Sistema

### 2.1 Visão Geral dos Módulos
```
+------------------------------------------------------------------------------------+
|                                 POSTURE AIR AI                                     |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  [ Interface do Usuário - Estilo Apple Health / Fitness+ ]                         |
|  - Início (Score diário, anel Apple Fitness, status de conexão, métricas rápidas) |
|  - Calibração Biométrica (10s com captura do baseline anatômico do usuário)       |
|  - Sessão ao Vivo (Anel de atividade, badges de desvio, pílula de enquadramento)   |
|  - Resumo Pós-Sessão (Score, % boa postura, timeline real de dados, padrão de IA)  |
|  - Progresso / Histórico (Média diária, sequência de ofensiva/streak, sessões)     |
|  - Perfil e Ajustes (Sensibilidade, tempo de tolerância, teste de voz/áudio)       |
|                                                                                    |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  [ Posture AI Engine ]                                                             |
|  +-------------------------------------+  +-------------------------------------+  |
|  | Motor Câmera (Visão Computacional)  |  | Motor Sensores / AirPods (Nativo)   |  |
|  | - MediaPipe Tasks Vision            |  | - Core Motion                       |  |
|  | - Rastreamento 3D de cabeça/ombros  |  | - CMHeadphoneMotionManager          |  |
|  | - Tilt frontal (Pitch), Roll e Yaw  |  | - Giroscópio / Acelerômetro         |  |
|  | - Distância de orelhas e acrômio    |  | - DeviceOrientation Web API         |  |
|  +-------------------------------------+  +-------------------------------------+  |
|                                                                                    |
|  [ Sistema de Alertas Inteligentes ]                                               |
|  - Filtro Temporal Anti-Falso-Positivo (janela de tolerância configurável)        |
|  - Síntese de Voz Nativa em Português (Web Speech API / AVSpeechSynthesizer)       |
|  - Sons Espaciais Suaves Harmônicos (Web Audio API / AVAudioPlayer)                 |
|  - Feedback Tátil Háptico (Navigator.vibrate / UIImpactFeedbackGenerator)          |
|                                                                                    |
|  [ Armazenamento e Persistência Local ]                                            |
|  - Perfil do Usuário e Calibração Individual                                       |
|  - Histórico Completo de Sessões e Séries Temporais                                |
|  - 100% Offline e com Privacidade Total (nenhum dado ou vídeo sai do aparelho)     |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

---

## 3. Especificação Detalhada da Engine de Visão Computacional

### 3.1 Captura de Vídeo e Pipeline On-Device
- **Acesso**: Solicitação via `navigator.mediaDevices.getUserMedia` com `facingMode: "user"`.
- **Privacidade**: Processamento 100% no cliente via WebGL/WASM. Nenhum frame de vídeo é enviado para a rede ou armazenado em disco.
- **Modo Minimalista Discreto**: O elemento de vídeo roda oculto no DOM durante a sessão para manter o foco total do usuário. Uma pílula translúcida com indicador de status (*"Câmera IA Ativa"*) permite abrir rapidamente um drawer de enquadramento se o usuário quiser checar seu posicionamento.

### 3.2 Extração de Métricas Posturais
1. **Inclinação Lateral da Cabeça (Roll)**:
   - Medido pelo ângulo formado entre os marcos das orelhas (`left_ear` e `right_ear`):
     $$\text{Roll} = \arctan\left(\frac{y_{\text{right}} - y_{\text{left}}}{x_{\text{right}} - x_{\text{left}}}\right) \times \frac{180}{\pi}$$
2. **Projeção para Frente (Pitch / Forward Head Posture - FHP)**:
   - Medido pela distância vertical relativa e coordenada Z entre os pontos da orelha (tragus) e os ombros (acrômio). Quando a cabeça avança em relação à coluna, a distância vertical diminui e o Z relativo do nariz se desloca para frente.
3. **Rotação Lateral da Cabeça (Yaw)**:
   - Medido pela assimetria das distâncias do nariz para a orelha esquerda vs orelha direita.
4. **Alinhamento dos Ombros (Shoulder Slope)**:
   - Medido pelo ângulo entre o ombro esquerdo e direito. Detecta quando o usuário está apoiado de forma torta na mesa ou com um ombro excessivamente levantado.

### 3.3 Calibração Biométrica (10 Segundos)
- A tela `/calibrate` inicia a câmera e orienta o usuário a sentar na postura neutra e confortável.
- Durante a contagem regressiva de 10 segundos, o app acumula amostras contínuas de Roll, Pitch e Alinhamento de Ombros.
- Ao final, é calculada a mediana das métricas, salvando o objeto de calibração:
  ```ts
  export type CalibrationBaseline = {
    baselineRoll: number;
    baselinePitchRatio: number;
    baselineShoulderSlope: number;
    calibratedAt: string;
    sampleCount: number;
    stabilityPct: number;
  };
  ```
- Todas as avaliações da sessão ao vivo avaliam a diferença $\Delta = \text{valor} - \text{baseline}$.

---

## 4. Experiência da Sessão em Tempo Real (`/session`)

### 4.1 Interface e Estados Visuais
- **Anel de Atividade (`RingScore`)**: Score atualizado a cada segundo, com gradientes Apple Fitness+ (Verde Menta, Âmbar, Coral/Vermelho).
- **Métricas Visuais em Badges**:
  - `Tilt Frontal`: Indicador de graus (ex: `+2.4°`).
  - `Tilt Lateral`: Indicador de graus (ex: `-0.8°`).
  - `Status`: Pílula dinâmica indicando *Postura alinhada*, *Atenção*, ou *Corrija agora*.
- **Enquadramento Assistido**: Botão sutil que abre um modal com a câmera e guias de alinhamento anatômico para ajuste inicial.
- **Modo Alternativo**: Seletor para alternar entre *Câmera IA* e *AirPods / Sensores de Movimento*.

### 4.2 Sistema Inteligente de Alertas
- **Debounce e Streak**:
  - Desvios breves (< tempo de tolerância configurado) são desconsiderados para permitir movimentos naturais (beber água, respirar fundo).
  - Quando o desvio ultrapassa o limite do perfil (`alertAfterSec`, padrão 30s):
    - Alerta por voz natural via Web Speech API (`pt-BR`):
      - Se inclinação frontal: *"Você está inclinando a cabeça para frente há 30 segundos"* ou *"Corrija sua postura"*.
      - Se inclinação lateral / ombros: *"Alinhe sua cabeça e relaxe os ombros"*.
    - Alerta sonoro suave sintetizado via Web Audio API (acordes de 432Hz/528Hz que não agridem os ouvidos).
    - Vibração tátil no celular via `navigator.vibrate([100, 50, 100])`.

### 4.3 Cálculo Dinâmico de Pontuação
- A sessão inicia com score 100.
- A cada segundo:
  - Se em postura alinhada: mantém ou recupera score (+0.5 por segundo em boa postura até 100).
  - Se em aviso: dedução moderada (-0.4/s).
  - Se em postura incorreta continuada: dedução acentuada (-1.2/s).
- Armazenamento em tempo real de uma amostra a cada 5 segundos para gerar o gráfico histórico fiel da sessão.

---

## 5. Resumo da Sessão e Histórico (`/summary` e `/history`)

### 5.1 Resumo Pós-Sessão
- Relatório fiel com duração total, score consolidado, percentual de boa postura e número de correções acionadas.
- **Diagnóstico da IA**: Análise semântica dos registros temporais para determinar o principal padrão (ex: *"Você tende a projetar a cabeça para frente após 45 minutos"*).
- **Linha do Tempo Visual**: Gráfico de barras verticais coloridas mapeando a sessão inteira minuto a minuto.
- **Compartilhamento**: Integração com Web Share API para compartilhamento do cartão de resultado.

### 5.2 Histórico e Perfil
- Histórico com evolução semanal, média diária e sequência (*streak*) de dias consecutivos mantendo score $\ge 70$.
- Tela de Perfil (`/profile`):
  - Ajuste de sensibilidade: Baixa, Média, Alta.
  - Ajuste do tempo para alerta: 10s, 20s, 30s, 45s, 60s.
  - Seleção do tipo de voz: Feminina, Masculina, Apenas Tom, Vibração.
  - **Botão de Teste de Áudio**: Permite escutar previamente o tom e a voz do assistente.

---

## 6. Módulo Nativo iOS em SwiftUI (`ios/PostureAirAI/`)

Para garantir a entrega do MVP comercializável pronto para compilação no Xcode e envio ao TestFlight com suporte aos **AirPods Pro/Max**:

1. **`PostureAirAIApp.swift`**: Ciclo de vida da aplicação iOS com configuração de áudio em background.
2. **`MotionManager.swift`**:
   - `CMHeadphoneMotionManager`: Inicia e monitora `startDeviceMotionUpdates(to:withHandler:)` dos AirPods conectados.
   - Extrai ângulos de Euler em tempo real: `pitch`, `roll`, `yaw`.
   - Gerencia estados de conexão (`isDeviceMotionAvailable`, `isDeviceMotionActive`).
3. **`PostureAIEngine.swift`**:
   - Máquina de estados em Swift responsável pelo cálculo do desvio postural em relação à calibração, acúmulo de tempo de infração e cálculo de score.
4. **`AudioAlertManager.swift`**:
   - `AVSpeechSynthesizer` com voz `pt-BR` e `AVAudioPlayer` com áudio espacial suave.
5. **`Views/`**:
   - `HomeView.swift`, `CalibrationView.swift`, `SessionView.swift`, `SummaryView.swift`, `HistoryView.swift`, `ProfileView.swift`.
6. **`Info.plist` & Documentação**:
   - Permissões de Bluetooth (`NSBluetoothAlwaysUsageDescription`), Motion (`NSMotionUsageDescription`) e Background Audio Modes.
   - Guia passo a passo de como abrir no Xcode, configurar a conta de desenvolvedor Apple e gerar build para o TestFlight.

---

## 7. Estratégia de Teste e Validação

1. **Testes do Motor de Visão**:
   - Verificação de permissões da câmera e fallback gracioso caso o usuário negue a permissão.
   - Verificação da estabilidade do FPS do loop de landmarks.
2. **Testes de Áudio e Voz**:
   - Validação da síntese de voz em navegadores mobile (iOS Safari e Android Chrome) e desktop.
   - Teste do oscilador Web Audio API para tons harmônicos sem clique sonoro.
3. **Testes de Calibração e Persistência**:
   - Validação do cálculo de baseline e verificação de que valores são corretamente recuperados e aplicados no comparador de desvios.
4. **Build e Validação de Tipos**:
   - `npm run build` do projeto TanStack Start / Vite para garantir zero erros de tipagem TypeScript e zero quebras de SSR.
