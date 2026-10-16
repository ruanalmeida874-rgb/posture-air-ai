# Posture Air AI — Personal Trainer de Postura Invisível

O **Posture Air AI** é uma aplicação concebida para monitorar a posição da cabeça, pescoço e ombros de usuários durante sessões prolongadas de trabalho, estudo ou leitura, alertando de forma sutil quando desvios ergonômicos persistentes são detectados.

---

## 🎯 Problema que o Projeto Resolve

O uso prolongado de computadores e smartphones frequentemente resulta na chamada "postura de cabeça projetada" (*forward head posture* ou "tech neck"), onde a cada 15° de inclinação cervical o peso exercido sobre a coluna cervical aumenta consideravelmente. O Posture Air AI busca atuar como um treinador invisível, oferecendo alertas não intrusivos antes que maus hábitos posturais causem desconforto ou lesões.

---

## ✨ Estado das Funcionalidades

### ✅ Funcionalidades Implementadas e Funcionais
* **Engine de Visão Computacional On-Device:** Rastreamento em tempo real via câmera frontal usando MediaPipe Tasks Vision (`PoseLandmarker`), processado 100% no navegador (WebGL/WASM) com privacidade total (nenhum frame é enviado à rede).
* **Calibração Biométrica (10s):** Procedimento individual para capturar o *baseline* neutro do usuário (inclinação lateral, projeção do pescoço e nivelamento de ombros), permitindo que os alertas comparem apenas desvios em relação à referência pessoal.
* **Interface Minimalista Discreta (Estilo Apple):** A câmera roda em segundo plano sem poluir a interface, mantendo foco no anel de score diário (0–100) e badges de inclinação em graus.
* **Gaveta de Enquadramento Assistido:** Visualização opcional com guias biomecânicas (linhas entre orelhas, ombros e eixo espinhal) desenhadas em `<canvas>` sobre o espelho do usuário.
* **Alertas Sonoros e por Voz:** Síntese de voz em português (`pt-BR`) via Web Speech API e acordes harmônicos suaves sintetizados via Web Audio API (frequência 528Hz), além de vibração (`navigator.vibrate`) em celulares compatíveis.
* **Filtro Anti-Falso-Positivo:** Janela de tolerância configurável (15s, 30s, 45s) para ignorar movimentos naturais e transitórios (como beber água ou coçar o rosto).
* **Sistema de Autenticação e Contas:** Criação de cadastro e login com isolamento de histórico por ID de usuário (`pa_sessions_usr_...`). Novos cadastros iniciam com histórico e scores 100% zerados.
* **Simulador de Vídeo para Divulgação (`/demo`):** Demonstração coreografada com gravador embutido via `MediaRecorder` para exportar vídeos demonstrativos diretamente pelo navegador.
* **Histórico e Gamificação:** Cálculo de evolução semanal, pontuação média e dias consecutivos de ofensiva (*streak*).

### 🧪 Funcionalidades Experimentais / Em Andamento
* **Rastreamento via AirPods no Navegador:** Navegadores web padrão não expõem diretamente a API de *Head Tracking* dos AirPods da Apple (`CMHeadphoneMotionManager`). No web app, o modo de sensores utiliza o giroscópio do dispositivo móvel (`DeviceOrientationEvent`) ou telemetria auxiliar quando a câmera não está em uso.
* **Persistência em Nuvem:** A persistência atual é baseada em `localStorage` seguro no navegador do cliente (100% offline). Sincronização multi-dispositivos via banco de dados remoto é um próximo passo planejado.

---

## 🛠️ Tecnologias Utilizadas

### Web / PWA
* **Linguagem:** TypeScript
* **Framework:** React 19 com Vite 8 e TanStack Start (`@tanstack/react-start`, `@tanstack/react-router`)
* **Estilização:** Tailwind CSS v4, Radix UI Primitives, Lucide Icons
* **Inteligência Visual:** `@mediapipe/tasks-vision` (Google MediaPipe PoseLandmarker)
* **Áudio:** Web Audio API & Web Speech Synthesis API

### Módulo Nativo iOS (`ios/`)
* **Linguagem & Framework:** Swift 5.10+ / SwiftUI
* **Sensores:** CoreMotion (`CMHeadphoneMotionManager` para AirPods Pro/Max)
* **Áudio em Background:** AVFoundation (`AVSpeechSynthesizer`, `AVAudioSession`)

---

## 📂 Estrutura do Projeto

```text
posture-air-ai/
├── src/
│   ├── routes/              # Rotas baseadas em arquivo (TanStack Router)
│   │   ├── __root.tsx       # Layout raiz e contexto da aplicação
│   │   ├── index.tsx        # Dashboard principal (estilo Apple Fitness)
│   │   ├── auth.tsx         # Cadastro e login de usuários
│   │   ├── calibrate.tsx    # Calibração biométrica com câmera (10s)
│   │   ├── session.tsx      # Sessão de monitoramento ao vivo com IA
│   │   ├── summary.tsx      # Resumo pós-sessão com linha do tempo real
│   │   ├── history.tsx      # Histórico semanal e ofensiva (streak)
│   │   ├── profile.tsx      # Ajustes de sensibilidade, voz e conta
│   │   └── demo.tsx         # Simulador e gravador de vídeo para divulgação
│   ├── components/          # Componentes visuais (PhoneFrame, RingScore, TabBar)
│   ├── lib/
│   │   ├── posture-engine.ts # Pipeline do MediaPipe e cálculo biomecânico
│   │   ├── audio-alerts.ts   # Síntese de áudio espacial e voz em pt-BR
│   │   └── posture-store.ts  # Gerenciador de contas, sessões e baseline
│   ├── styles.css           # Tokens de design e animações
│   └── server.ts            # Entrypoint SSR para Nitro
├── ios/
│   ├── PostureAirAI/        # Código-fonte nativo em SwiftUI
│   │   ├── PostureAirAIApp.swift
│   │   ├── Motion/MotionManager.swift   # CMHeadphoneMotionManager para AirPods
│   │   ├── Engine/PostureAIEngine.swift # Motor de postura nativo em Swift
│   │   ├── Audio/AudioAlertManager.swift
│   │   ├── Views/                       # Telas nativas em SwiftUI
│   │   └── Info.plist
│   └── README.md            # Guia passo a passo para compilar no Xcode
├── docs/                    # Especificações de design e arquitetura
├── .gitignore               # Regras de exclusão para versionamento
├── package.json             # Dependências e scripts
├── vite.config.ts           # Configuração de build Vite/Nitro
└── tsconfig.json            # Configuração TypeScript
```

---

## 🚀 Como Instalar e Executar

### Pré-requisitos
* **Node.js:** versão 18.x ou superior (testado com Node v24).
* **NPM:** versão 9.x ou superior.
* Navegador moderno com suporte a WebAssembly e WebGL (Chrome, Edge, Safari ou Firefox).

### 1. Clonar e Instalar Dependências
```bash
git clone <url-do-seu-repositorio>
cd posture-air-ai
npm install
```

### 2. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:8080` no computador ou pelo IP da sua rede local no celular (ex: `http://192.168.x.x:8080`).

### 3. Compilar para Produção
```bash
npm run build
```
O build compila o pacote estático para `.output/public/` e o servidor SSR em `.output/server/`.

### 4. Visualizar o Build de Produção
```bash
npm run preview
```

---

## 📱 Estado do Módulo Nativo iOS (`ios/`)

O projeto inclui o código nativo completo em SwiftUI na pasta `ios/PostureAirAI/`, preparado para uso direto dos sensores de movimento dos fones **AirPods Pro / AirPods Max / Beats Fit Pro**.

* **Pré-requisitos:** Computador com macOS e Xcode 15+, conta de desenvolvedor Apple e dispositivo físico (iPhone real emparelhado com AirPods, pois o Simulador do Xcode não emula sensores de fones).
* **Instruções:** Consulte o guia detalhado em [`ios/README.md`](ios/README.md).

---

## 👤 Conta de Demonstração

Para facilitar testes rápidos sem preencher o formulário de cadastro, a aplicação possui um atalho na tela de login que preenche as credenciais locais de demonstração:
* **E-mail:** `alex@apple.com`
* **Senha:** `123456`

*Nota:* Esta conta é puramente local e opera dentro do `localStorage` do navegador do usuário, sem comunicação com servidores externos.

---

## ⚠️ Limitações Conhecidas & Próximos Passos

1. **Iluminação da Câmera:** Como o motor de visão utiliza a câmera frontal para mapear marcos anatômicos, ambientes excessivamente escuros podem reduzir a confiança da detecção.
2. **PWA Offline:** O app já é compatível com uso offline local; a adição de um Service Worker para instalação como PWA na tela inicial do iOS/Android é planejada para as próximas versões.
3. **Deploy Gratuito na Vercel:** O projeto utiliza TanStack Start / Nitro. Ao conectar o repositório na Vercel, o framework preset detectado pode ser configurado com o comando de build `npm run build` e diretório de saída `.output/public`.
