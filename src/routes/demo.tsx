import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Play,
  Pause,
  Download,
  Video,
  Sparkles,
  Headphones,
  CheckCircle2,
  Volume2,
  Eye,
  Camera,
  RefreshCw,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { playGentleChime, speakCoachMessage } from "@/lib/audio-alerts";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Simulador de Vídeo para LinkedIn — Posture Air AI" },
      { name: "description", content: "Simulador com animações automatizadas e gravador de vídeo para divulgação." },
      { property: "og:title", content: "Simulador de Demonstração" },
    ],
  }),
  component: DemoSimulatorPage,
});

type Scene = "home" | "calibrate" | "session_good" | "session_bad" | "framing" | "summary";

function DemoSimulatorPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentScene, setCurrentScene] = useState<Scene>("home");
  const [progress, setProgress] = useState(0); // 0..100
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Simulated metrics
  const [simScore, setSimScore] = useState(96);
  const [simTilt, setSimTilt] = useState(2);
  const [simRoll, setSimRoll] = useState(0);
  const [simAlert, setSimAlert] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animTimerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phoneContainerRef = useRef<HTMLDivElement | null>(null);

  // Choreographed 22-second timeline for LinkedIn
  useEffect(() => {
    if (!isPlaying) {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
      return;
    }

    const totalDurationMs = 22000;
    const intervalMs = 100;
    let elapsed = (progress / 100) * totalDurationMs;

    animTimerRef.current = setInterval(() => {
      elapsed += intervalMs;
      const pct = Math.min(100, (elapsed / totalDurationMs) * 100);
      setProgress(pct);

      // Scene timeline management
      if (pct < 18) {
        // Scene 1: Home Dashboard
        setCurrentScene("home");
        setSimScore(94);
      } else if (pct < 40) {
        // Scene 2: 10s Biometric Calibration
        setCurrentScene("calibrate");
      } else if (pct < 55) {
        // Scene 3: Live Session - Good Posture
        setCurrentScene("session_good");
        setSimScore(98);
        setSimTilt(3);
        setSimRoll(1);
        setSimAlert(null);
      } else if (pct < 75) {
        // Scene 4: Live Session - Bad Posture (Slumping) & Alert
        setCurrentScene("session_bad");
        setSimScore(62);
        setSimTilt(24);
        setSimRoll(12);
        setSimAlert("Você está inclinando a cabeça para frente há 30 segundos");
      } else if (pct < 88) {
        // Scene 5: Framing Camera Sheet with Skeleton
        setCurrentScene("framing");
        setSimScore(92);
        setSimTilt(4);
      } else {
        // Scene 6: Session Summary
        setCurrentScene("summary");
      }

      if (pct >= 100) {
        setIsPlaying(false);
        stopRecording();
        clearInterval(animTimerRef.current);
      }
    }, intervalMs);

    return () => {
      if (animTimerRef.current) clearInterval(animTimerRef.current);
    };
  }, [isPlaying, progress]);

  // Audio effects triggered at key transitions
  useEffect(() => {
    if (currentScene === "session_bad" && isPlaying) {
      playGentleChime("warning");
      setTimeout(() => {
        speakCoachMessage("Você está inclinando a cabeça para frente há 30 segundos", "female");
      }, 250);
    } else if (currentScene === "calibrate" && isPlaying) {
      playGentleChime("gentle");
    } else if (currentScene === "summary" && isPlaying) {
      playGentleChime("success");
    }
  }, [currentScene]);

  // Canvas recording loop to produce downloadable video file
  const startRecording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    recordedChunksRef.current = [];
    setDownloadUrl(null);
    setProgress(0);
    setCurrentScene("home");
    setIsRecording(true);
    setIsPlaying(true);

    try {
      const stream = canvas.captureStream(30); // 30 FPS
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsRecording(false);
      };

      recorder.start();
      recorderRef.current = recorder;
    } catch (err) {
      console.warn("MediaRecorder error:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  };

  // Render high-def canvas frame for recorder
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let anim: number;
    const render = () => {
      ctx.fillStyle = "#0c0d12";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background glow
      const grad = ctx.createRadialGradient(270, 480, 50, 270, 480, 400);
      grad.addColorStop(0, "rgba(52, 211, 153, 0.12)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 26px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Posture Air AI", 270, 75);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "14px -apple-system, sans-serif";
      ctx.fillText("Personal Trainer de Postura Invisível", 270, 102);

      // Dynamic Scene Card
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.beginPath();
      ctx.roundRect(40, 130, 460, 720, 28);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (currentScene === "home") {
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 13px -apple-system, sans-serif";
        ctx.fillText("AIRPODS PRO CONECTADOS", 270, 190);

        // Score Ring
        ctx.beginPath();
        ctx.arc(270, 360, 110, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 18;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(270, 360, 110, -Math.PI / 2, Math.PI * 0.9);
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px -apple-system, sans-serif";
        ctx.fillText("94", 270, 375);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 12px -apple-system, sans-serif";
        ctx.fillText("POSTURA HOJE", 270, 410);

        // CTA
        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.roundRect(70, 520, 400, 58, 20);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.font = "bold 18px -apple-system, sans-serif";
        ctx.fillText("Começar Sessão", 270, 556);
      } else if (currentScene === "calibrate") {
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 14px -apple-system, sans-serif";
        ctx.fillText("CALIBRAÇÃO BIOMÉTRICA (10s)", 270, 200);

        ctx.beginPath();
        ctx.arc(270, 380, 110, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 16;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(270, 380, 110, -Math.PI / 2, Math.PI * 0.6);
        ctx.strokeStyle = "#818cf8";
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 72px -apple-system, sans-serif";
        ctx.fillText("6", 270, 395);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px -apple-system, sans-serif";
        ctx.fillText("Capturando marcos anatômicos...", 270, 540);
      } else if (currentScene === "session_good" || currentScene === "session_bad") {
        const isBad = currentScene === "session_bad";

        // Status badge
        ctx.fillStyle = isBad ? "rgba(244, 63, 94, 0.2)" : "rgba(52, 211, 153, 0.2)";
        ctx.beginPath();
        ctx.roundRect(170, 170, 200, 36, 18);
        ctx.fill();

        ctx.fillStyle = isBad ? "#f43f5e" : "#34d399";
        ctx.font = "bold 13px -apple-system, sans-serif";
        ctx.fillText(isBad ? "CORRIJA SUA POSTURA" : "POSTURA ALINHADA", 270, 193);

        // Ring
        ctx.beginPath();
        ctx.arc(270, 350, 110, 0, 2 * Math.PI);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 18;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(270, 350, 110, -Math.PI / 2, isBad ? -Math.PI * 0.1 : Math.PI * 1.1);
        ctx.strokeStyle = isBad ? "#f43f5e" : "#34d399";
        ctx.lineWidth = 18;
        ctx.lineCap = "round";
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px -apple-system, sans-serif";
        ctx.fillText(String(simScore), 270, 365);

        // Alert box if bad
        if (isBad) {
          ctx.fillStyle = "rgba(250, 204, 21, 0.15)";
          ctx.beginPath();
          ctx.roundRect(65, 480, 410, 68, 16);
          ctx.fill();
          ctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
          ctx.stroke();

          ctx.fillStyle = "#facc15";
          ctx.font = "bold 11px -apple-system, sans-serif";
          ctx.fillText("ALERTA POR VOZ NOS AIRPODS", 270, 504);

          ctx.fillStyle = "#ffffff";
          ctx.font = "14px -apple-system, sans-serif";
          ctx.fillText("Inclinando para frente há 30s", 270, 528);
        }

        // Telemetry cards
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px -apple-system, sans-serif";
        ctx.fillText(`+${simTilt}°`, 140, 610);
        ctx.fillText(`${simRoll}°`, 270, 610);
        ctx.fillText("3", 400, 610);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px -apple-system, sans-serif";
        ctx.fillText("TILT FRONTAL", 140, 630);
        ctx.fillText("TILT LATERAL", 270, 630);
        ctx.fillText("CORREÇÕES", 400, 630);
      } else if (currentScene === "framing") {
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 14px -apple-system, sans-serif";
        ctx.fillText("ENQUADRAMENTO BIOMÉTRICO (IA)", 270, 185);

        // Draw camera frame
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.roundRect(70, 220, 400, 480, 20);
        ctx.fill();

        // Biometric skeleton guides
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(190, 380);
        ctx.lineTo(350, 380); // Ear line
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(140, 520);
        ctx.lineTo(400, 520); // Shoulder line
        ctx.stroke();

        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(270, 360);
        ctx.lineTo(270, 520); // Spine axis
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.arc(270, 360, 8, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "13px -apple-system, sans-serif";
        ctx.fillText("Eixo Cervical Perfeitamente Alinhado", 270, 660);
      } else {
        // Summary
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 14px -apple-system, sans-serif";
        ctx.fillText("RESUMO DA SESSÃO CONCLUÍDA", 270, 190);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px -apple-system, sans-serif";
        ctx.fillText("92/100", 270, 280);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "14px -apple-system, sans-serif";
        ctx.fillText("88% em Postura Excelente", 270, 320);

        // Diagnostic box
        ctx.fillStyle = "rgba(52, 211, 153, 0.12)";
        ctx.beginPath();
        ctx.roundRect(70, 380, 400, 120, 20);
        ctx.fill();

        ctx.fillStyle = "#34d399";
        ctx.font = "bold 12px -apple-system, sans-serif";
        ctx.fillText("DIAGNÓSTICO ERGONÔMICO DA IA", 270, 415);

        ctx.fillStyle = "#ffffff";
        ctx.font = "13px -apple-system, sans-serif";
        ctx.fillText("Você tende a projetar o pescoço após 35 min.", 270, 445);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px -apple-system, sans-serif";
        ctx.fillText("Mantenha o terço superior da tela na linha dos olhos.", 270, 470);
      }

      // Watermark
      ctx.fillStyle = "#64748b";
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText("Criado com Posture Air AI · Pronto para TestFlight & Web", 270, 885);

      anim = requestAnimationFrame(render);
    };

    anim = requestAnimationFrame(render);
    return () => cancelAnimationFrame(anim);
  }, [currentScene, simScore, simTilt, simRoll]);

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-8 min-h-full flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link to="/profile" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Ajustes
          </Link>
          <span className="text-xs uppercase tracking-widest text-primary font-bold">Simulador LinkedIn</span>
        </div>

        <div className="mt-4">
          <h1 className="text-xl font-bold">Gerador de Vídeo Demo</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gera uma demonstração completa do app para você gravar e publicar no LinkedIn.
          </p>
        </div>

        {/* Hidden high-res canvas (540x960 HD mobile format) used for MediaRecorder */}
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          className="hidden"
        />

        {/* Live Interactive Simulation View */}
        <div ref={phoneContainerRef} className="mt-4 glass rounded-3xl p-5 border border-white/10 relative overflow-hidden">
          {/* Progress Timeline bar */}
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-mint to-violet transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Current Simulation Stage Indicator */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
              {currentScene === "home" && "1. Tela Inicial & AirPods"}
              {currentScene === "calibrate" && "2. Calibração Biométrica (10s)"}
              {currentScene === "session_good" && "3. Sessão Ativa (Postura Correta)"}
              {currentScene === "session_bad" && "4. Desvio Detectado & Alerta"}
              {currentScene === "framing" && "5. Enquadramento Biomecânico IA"}
              {currentScene === "summary" && "6. Resumo & Diagnóstico"}
            </span>

            {isRecording && (
              <span className="flex items-center gap-1.5 text-danger text-[11px] font-bold animate-pulse">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                GRAVANDO
              </span>
            )}
          </div>

          {/* Animated Mock Content */}
          <div className="py-6 flex flex-col items-center justify-center text-center">
            {currentScene === "home" && (
              <div className="space-y-4 animate-in fade-in">
                <div className="h-16 w-16 mx-auto rounded-full bg-primary/20 grid place-items-center">
                  <Headphones size={32} className="text-primary" />
                </div>
                <div>
                  <div className="text-3xl font-bold">94/100</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Postura de Hoje</div>
                </div>
                <div className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md">
                  Começar Sessão
                </div>
              </div>
            )}

            {currentScene === "calibrate" && (
              <div className="space-y-4 animate-in zoom-in-95">
                <div className="h-20 w-20 mx-auto rounded-full border-4 border-accent border-t-primary animate-spin" />
                <div className="text-2xl font-bold">Calibrando 10s...</div>
                <div className="text-xs text-muted-foreground max-w-[220px]">
                  Rastreando inclinação, rotação e nivelamento de ombros
                </div>
              </div>
            )}

            {(currentScene === "session_good" || currentScene === "session_bad") && (
              <div className="space-y-3 animate-in fade-in">
                <div
                  className={`text-5xl font-bold tabular-nums ${
                    currentScene === "session_bad" ? "text-danger" : "text-primary"
                  }`}
                >
                  {simScore}
                </div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Score em Tempo Real
                </div>

                {simAlert && (
                  <div className="p-3 rounded-2xl bg-warn/15 border border-warn/30 text-warn text-xs flex items-center gap-2">
                    <Volume2 size={16} className="shrink-0 animate-bounce" />
                    <span>{simAlert}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 w-full max-w-[260px] pt-2">
                  <div className="glass rounded-xl p-2.5">
                    <div className="text-xs font-bold">+{simTilt}°</div>
                    <div className="text-[10px] text-muted-foreground">Tilt Frontal</div>
                  </div>
                  <div className="glass rounded-xl p-2.5">
                    <div className="text-xs font-bold">{simRoll}°</div>
                    <div className="text-[10px] text-muted-foreground">Tilt Lateral</div>
                  </div>
                </div>
              </div>
            )}

            {currentScene === "framing" && (
              <div className="space-y-3 animate-in fade-in">
                <div className="h-28 w-44 mx-auto rounded-2xl bg-black/80 border border-primary/40 flex flex-col items-center justify-center relative">
                  <div className="h-0.5 w-24 bg-primary" />
                  <div className="h-10 w-0.5 bg-primary/70 border-dashed my-1" />
                  <div className="h-0.5 w-32 bg-primary" />
                  <span className="absolute bottom-2 text-[9px] text-primary font-mono">Linhas Anatômicas</span>
                </div>
                <div className="text-sm font-semibold">Enquadramento Assistido</div>
                <div className="text-xs text-muted-foreground">Ombros e coluna alinhados</div>
              </div>
            )}

            {currentScene === "summary" && (
              <div className="space-y-3 animate-in zoom-in-95">
                <div className="h-14 w-14 mx-auto rounded-full bg-primary/20 grid place-items-center text-primary font-bold text-xl">
                  ✓
                </div>
                <div className="text-3xl font-bold">92/100</div>
                <div className="text-xs text-muted-foreground">
                  Sessão concluída · 88% de boa postura
                </div>
                <div className="p-3 rounded-xl glass text-[11px] text-foreground text-left">
                  <span className="text-primary font-bold">Diagnóstico IA:</span> Você tende a inclinar o pescoço após 35 min.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex-1 py-3.5 rounded-2xl glass font-semibold text-xs flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? "Pausar Simulação" : "Reproduzir Simulação"}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setProgress(0);
                setCurrentScene("home");
              }}
              className="h-12 w-12 rounded-2xl glass grid place-items-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
              title="Reiniciar"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Record and Download Video Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-full py-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 ${
              isRecording
                ? "bg-danger text-white animate-pulse"
                : "bg-primary text-primary-foreground shadow-primary/25"
            }`}
          >
            {isRecording ? (
              <>
                <span className="h-3 w-3 rounded-full bg-white" />
                <span>Parar e Finalizar Gravação</span>
              </>
            ) : (
              <>
                <Video size={16} />
                <span>Gravar Vídeo para o LinkedIn (Download Automático)</span>
              </>
            )}
          </button>

          {/* Download link ready */}
          {downloadUrl && (
            <div className="p-4 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-between animate-in fade-in">
              <div>
                <div className="text-xs font-bold text-primary">Vídeo gerado com sucesso!</div>
                <div className="text-[11px] text-muted-foreground">Pronto para postar no LinkedIn</div>
              </div>
              <a
                href={downloadUrl}
                download="posture-air-ai-demo.webm"
                className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Download size={13} /> Baixar
              </a>
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
