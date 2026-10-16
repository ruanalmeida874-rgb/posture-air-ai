import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, Square, Volume2, Camera, Eye, X, Headphones, Sparkles, RefreshCw } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RingScore } from "@/components/RingScore";
import {
  formatDuration,
  saveSession,
  loadProfile,
  loadBaseline,
  type SessionTimelinePoint,
  type Profile,
  type CalibrationBaseline,
} from "@/lib/posture-store";
import {
  getPoseLandmarker,
  analyzeVideoFrame,
  drawPostureOverlay,
  generateSessionDiagnosis,
  resetEngineState,
  type PostureFrame,
} from "@/lib/posture-engine";
import { triggerPostureAlert, playGentleChime } from "@/lib/audio-alerts";

export const Route = createFileRoute("/session")({
  head: () => ({
    meta: [
      { title: "Sessão ao vivo — Posture Air AI" },
      { name: "description", content: "Monitoramento ergonômico em tempo real por IA e visão computacional." },
      { property: "og:title", content: "Sessão de Postura ao Vivo" },
      { property: "og:description", content: "IA em tempo real, alertas sonoros e score dinâmico." },
    ],
  }),
  component: Session,
});

type PostureState = "good" | "warn" | "bad";

function Session() {
  const navigate = useNavigate();
  const [running, setRunning] = useState(true);
  const [t, setT] = useState(0);
  const [score, setScore] = useState(96);
  const [tilt, setTilt] = useState(0);
  const [roll, setRoll] = useState(0);
  const [state, setState] = useState<PostureState>("good");
  const [alert, setAlert] = useState<string | null>(null);
  const [corrections, setCorrections] = useState(0);
  const [series, setSeries] = useState<number[]>(Array(40).fill(96));
  const [showFraming, setShowFraming] = useState(false);
  const [mode, setMode] = useState<"camera" | "sensor">("camera");
  const [cameraActive, setCameraActive] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  const goodTimeRef = useRef(0);
  const timelineRef = useRef<SessionTimelinePoint[]>([]);
  const badStreakRef = useRef(0);
  const profileRef = useRef<Profile>(loadProfile());
  const baselineRef = useRef<CalibrationBaseline>(loadBaseline());
  const lastAlertTimeRef = useRef(0);

  // Initialize camera and PoseLandmarker on mount
  useEffect(() => {
    resetEngineState();
    profileRef.current = loadProfile();
    baselineRef.current = loadBaseline();
    setMode(profileRef.current.trackingMode || "camera");

    let isSubscribed = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
          await previewVideoRef.current.play().catch(() => {});
        }

        setCameraActive(true);

        const lm = await getPoseLandmarker();
        if (isSubscribed) {
          landmarkerRef.current = lm;
        }
      } catch (err) {
        console.warn("Camera init note (falling back to sensor mode):", err);
        setMode("sensor");
      }
    }

    if (mode === "camera") {
      initCamera();
    }

    return () => {
      isSubscribed = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [mode]);

  // Sync stream to preview video element when framing modal is opened
  useEffect(() => {
    if (showFraming && streamRef.current && previewVideoRef.current) {
      previewVideoRef.current.srcObject = streamRef.current;
      previewVideoRef.current.play().catch(() => {});
    }
  }, [showFraming]);

  // Main real-time posture analysis loop
  useEffect(() => {
    if (!running) return;

    let isRunning = true;

    const processFrame = (timestamp: number) => {
      if (!isRunning) return;

      if (mode === "camera" && videoRef.current && videoRef.current.readyState >= 2) {
        const frame = analyzeVideoFrame(
          videoRef.current,
          landmarkerRef.current,
          timestamp,
          baselineRef.current,
          profileRef.current
        );

        if (frame) {
          setTilt(frame.pitch);
          setRoll(frame.roll);
          setState(frame.state);
          setScore(frame.score);

          // If framing drawer is visible, draw landmarks on canvas overlay
          if (showFraming && canvasRef.current && frame.rawLandmarks) {
            drawPostureOverlay(canvasRef.current, frame.rawLandmarks, frame.state);
          }
        }
      } else if (mode === "sensor") {
        // Sensor or simulated mode smooth drift
        const driftT = (Math.random() - 0.48) * 1.5;
        const driftR = (Math.random() - 0.5) * 1.2;
        setTilt((prev) => Number(Math.max(-10, Math.min(35, prev + driftT)).toFixed(1)));
        setRoll((prev) => Number(Math.max(-20, Math.min(20, prev + driftR)).toFixed(1)));
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [running, mode, showFraming]);

  // 1-second cadence timer: accumulates metrics, alerts, and timeline points
  useEffect(() => {
    if (!running) return;

    const interval = setInterval(() => {
      setT((prev) => {
        const nextSec = prev + 1;

        // Track time in good posture
        if (state === "good") {
          goodTimeRef.current += 1;
        }

        // Record timeline point every 4 seconds
        if (nextSec % 4 === 0) {
          timelineRef.current.push({
            t: nextSec,
            score: Math.round(score),
            state,
            tilt,
            roll,
          });
        }

        // Live sparkline buffer
        setSeries((s) => [...s.slice(1), Math.round(score)]);

        // Alert Streak evaluation
        const alertDelaySec = Math.max(8, profileRef.current.alertAfterSec || 30);
        const now = Date.now();

        if (state === "bad" || state === "warn") {
          badStreakRef.current += 1;

          // Check if streak exceeded and cooldown passed (at least 15s between voice alerts)
          if (badStreakRef.current >= alertDelaySec && now - lastAlertTimeRef.current > 15000) {
            lastAlertTimeRef.current = now;
            badStreakRef.current = 0; // reset streak after alert

            let msg = "Corrija sua postura";
            if (tilt > 15) {
              msg = `Você está inclinando a cabeça para frente há ${alertDelaySec} segundos`;
            } else if (Math.abs(roll) > 12) {
              msg = "Alinhe sua cabeça e relaxe os ombros";
            }

            setAlert(msg);
            setCorrections((c) => c + 1);
            triggerPostureAlert(msg, profileRef.current, "warning");

            setTimeout(() => setAlert(null), 4500);
          }
        } else {
          badStreakRef.current = Math.max(0, badStreakRef.current - 1);
        }

        return nextSec;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [running, state, score, tilt, roll]);

  const finishSession = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    const durationSec = Math.max(t, 2);
    const topIssue = generateSessionDiagnosis(timelineRef.current);

    const summary = {
      id: `s-${Date.now()}`,
      date: new Date().toISOString(),
      durationSec,
      score: Math.round(score),
      goodPosturePct: Math.round((goodTimeRef.current / durationSec) * 100),
      corrections,
      topIssue,
      timeline: timelineRef.current,
      source: mode,
    };

    saveSession(summary);
    playGentleChime("success");
    navigate({ to: "/summary", search: { id: summary.id } });
  };

  const stateColor = state === "good" ? "text-primary" : state === "warn" ? "text-warn" : "text-danger";
  const stateLabel = state === "good" ? "Postura alinhada" : state === "warn" ? "Atenção" : "Corrija agora";

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-8 min-h-full flex flex-col relative">
        {/* Hidden video running in background for MediaPipe */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="hidden"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Top bar with time and status pill */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Sessão ao vivo</div>
            <div className="text-2xl font-bold tabular-nums">{formatDuration(t)}</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFraming(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
              title="Ver enquadramento da câmera"
            >
              <span className={`h-2 w-2 rounded-full ${cameraActive ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              <Eye size={13} />
              <span>Enquadramento</span>
            </button>

            <div
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                state === "good"
                  ? "bg-primary/15 text-primary"
                  : state === "warn"
                    ? "bg-warn/15 text-warn"
                    : "bg-danger/15 text-danger"
              }`}
            >
              {stateLabel}
            </div>
          </div>
        </div>

        {/* Central Activity Score Ring */}
        <div className="mt-5 flex justify-center">
          <RingScore value={score} label="Score atual" />
        </div>

        {/* Live alert banner */}
        <div
          className={`mt-4 transition-all duration-300 ${
            alert ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`}
        >
          <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 border-warn/30 bg-warn/10">
            <Volume2 size={20} className="text-warn shrink-0 animate-bounce" />
            <div>
              <div className="text-[10px] uppercase tracking-wider text-warn font-semibold">Alerta do Assistente</div>
              <div className="text-sm font-medium">{alert ?? " "}</div>
            </div>
          </div>
        </div>

        {/* Live Ergonomic Telemetry Badges */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Telemetry
            label="Tilt Frontal"
            value={`${tilt > 0 ? "+" : ""}${Math.round(tilt)}°`}
            sub="frente/trás"
            highlight={tilt > 14}
          />
          <Telemetry
            label="Tilt Lateral"
            value={`${roll > 0 ? "+" : ""}${Math.round(roll)}°`}
            sub="esq/dir"
            highlight={Math.abs(roll) > 10}
          />
          <Telemetry
            label="Correções"
            value={String(corrections)}
            sub="nesta sessão"
          />
        </div>

        {/* Live 40-second sparkline chart */}
        <div className="mt-5 glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Score · últimos 40s</div>
            <div className={`text-xs font-semibold ${stateColor}`}>
              {state === "good" ? "Estável" : state === "warn" ? "Desvio leve" : "Correção necessária"}
            </div>
          </div>
          <Sparkline data={series} />
        </div>

        {/* Mode switch & active tracking indicator */}
        <div className="mt-4 flex items-center justify-between px-1">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            {mode === "camera" ? (
              <>
                <Camera size={13} className="text-primary" />
                <span>Câmera Frontal IA Ativa</span>
              </>
            ) : (
              <>
                <Headphones size={13} className="text-accent" />
                <span>Modo AirPods / Sensores</span>
              </>
            )}
          </div>

          <button
            onClick={() => setMode(mode === "camera" ? "sensor" : "camera")}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <RefreshCw size={11} />
            Alternar para {mode === "camera" ? "AirPods" : "Câmera"}
          </button>
        </div>

        <div className="flex-1" />

        {/* Controls: Pause/Play & Finish button */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setRunning((r) => !r)}
            className="h-14 w-14 rounded-2xl glass flex items-center justify-center text-foreground hover:bg-white/10 active:scale-95 transition-all"
            title={running ? "Pausar sessão" : "Retomar sessão"}
          >
            {running ? <Pause size={20} /> : <Play size={20} className="ml-0.5 text-primary" />}
          </button>

          <button
            onClick={finishSession}
            className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_20px_50px_-20px_var(--color-primary)] active:scale-[0.98] transition-transform text-base"
          >
            <Square size={16} fill="currentColor" />
            Finalizar sessão
          </button>
        </div>

        {/* Enquadramento Modal / Sheet */}
        {showFraming && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl rounded-[2.5rem] p-5 flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h3 className="text-lg font-bold">Enquadramento da Câmera</h3>
                <p className="text-xs text-muted-foreground">Confira o alinhamento da cabeça e ombros</p>
              </div>
              <button
                onClick={() => setShowFraming(false)}
                className="h-9 w-9 rounded-full glass flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 relative rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <video
                ref={previewVideoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
              <canvas
                ref={canvasRef}
                width={360}
                height={480}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: "scaleX(-1)" }}
              />

              <div className="absolute bottom-3 left-3 right-3 glass rounded-xl p-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${state === "good" ? "bg-primary" : state === "warn" ? "bg-warn" : "bg-danger"}`} />
                  {stateLabel}
                </span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  P: {Math.round(tilt)}° | R: {Math.round(roll)}°
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowFraming(false)}
              className="mt-4 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform text-sm"
            >
              Concluir e voltar ao foco
            </button>
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function Telemetry({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`glass rounded-2xl p-3 text-center transition-all ${
        highlight ? "ring-1 ring-warn/50 bg-warn/10" : ""
      }`}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold mt-0.5 tabular-nums ${highlight ? "text-warn" : ""}`}>{value}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const min = 40;
  const max = 100;
  const w = 280;
  const h = 54;
  const step = w / Math.max(1, data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" points={points} />
    </svg>
  );
}
