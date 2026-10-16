import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, Headphones, Sparkles, Activity, Clock, Camera, LogIn } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TabBar } from "@/components/TabBar";
import { RingScore } from "@/components/RingScore";
import {
  loadSessions,
  formatDuration,
  isCalibrated,
  loadProfile,
  getCurrentUser,
  type SessionSummary,
  type UserAccount,
} from "@/lib/posture-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Posture Air AI — Início" },
      { name: "description", content: "Monitore sua postura em tempo real com a câmera do celular ou AirPods. Pontuação diária, histórico e alertas inteligentes." },
      { property: "og:title", content: "Posture Air AI — Personal Trainer de Postura" },
      { property: "og:description", content: "Personal trainer ergonômico invisível." },
    ],
  }),
  component: Home,
});

function Home() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [calibrated, setCalibrated] = useState(false);
  const [name, setName] = useState("Você");
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [mode, setMode] = useState<"camera" | "sensor">("camera");

  useEffect(() => {
    setSessions(loadSessions());
    setCalibrated(isCalibrated());
    const user = getCurrentUser();
    setCurrentUser(user);
    const prof = loadProfile();
    setName(user ? user.name : prof.name);
    setMode(prof.trackingMode || "camera");
  }, []);

  const today = sessions.filter((s) => {
    const d = new Date(s.date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayScore = today.length
    ? Math.round(today.reduce((a, b) => a + b.score, 0) / today.length)
    : 0;
  const todayTime = today.reduce((a, b) => a + b.durationSec, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-6">
        {/* Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{greeting}</div>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="text-3xl font-bold tracking-tight truncate max-w-[240px]">{name}</h1>
              {!currentUser && (
                <Link
                  to="/auth"
                  className="text-[10px] font-semibold text-primary px-2 py-0.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors flex items-center gap-1"
                >
                  <LogIn size={10} /> Entrar
                </Link>
              )}
            </div>
          </div>
          <Link
            to="/profile"
            className="h-11 w-11 rounded-full bg-gradient-to-br from-mint to-violet flex items-center justify-center font-semibold text-primary-foreground shadow-sm shrink-0"
            title="Ver Perfil"
          >
            {name[0]?.toUpperCase() ?? "U"}
          </Link>
        </div>

        {/* Dynamic Hardware/Vision Status Card */}
        <Link
          to={mode === "camera" ? "/calibrate" : "/connect"}
          className="mt-4 flex items-center justify-between glass rounded-2xl px-4 py-3 hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full grid place-items-center bg-primary/20 shrink-0">
              {mode === "camera" ? (
                <Camera size={18} className="text-primary" />
              ) : (
                <Headphones size={18} className="text-accent" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium">
                {mode === "camera" ? "Câmera Frontal IA" : "AirPods Pro"}
              </div>
              <div className="text-xs text-primary flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {calibrated ? "Calibração biométrica ativa" : "Calibração necessária"}
              </div>
            </div>
          </div>
          <ChevronRight size={18} className="text-muted-foreground" />
        </Link>

        {/* Big Apple Fitness Style Score Ring */}
        <div className="mt-6 flex flex-col items-center">
          <RingScore value={todayScore} label={today.length > 0 ? "Postura hoje" : "Sem sessões hoje"} />
          <div className="mt-4 text-center text-sm text-muted-foreground max-w-[280px]">
            {today.length === 0
              ? "Nenhuma sessão hoje. Inicie sua sessão para registrar seu histórico postural diário."
              : todayScore >= 90
                ? "Postura excelente. Mantenha os ombros relaxados."
                : todayScore >= 70
                  ? "Boa postura — pequenos ajustes ao longo do dia ajudam."
                  : "Atenção: alguns desvios para frente detectados hoje."}
          </div>
        </div>

        {/* Start session CTA */}
        <Link
          to={calibrated ? "/session" : "/calibrate"}
          className="mt-6 flex items-center justify-center gap-2 w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold text-base shadow-[0_20px_50px_-20px_var(--color-primary)] active:scale-[0.98] transition-transform"
        >
          <Sparkles size={18} />
          {calibrated ? "Começar sessão" : "Calibrar postura e começar"}
        </Link>

        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard
            icon={<Activity size={16} />}
            label="Tempo monitorado"
            value={formatDuration(todayTime)}
            accent="mint"
          />
          <StatCard
            icon={<Clock size={16} />}
            label="Sessões hoje"
            value={String(today.length)}
            accent="violet"
          />
        </div>

        {/* Recent activity */}
        <div className="mt-7">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Atividade recente</h2>
            {sessions.length > 0 && (
              <Link to="/history" className="text-sm text-primary font-medium hover:underline">
                Ver tudo
              </Link>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
              <Activity size={28} className="mx-auto mb-2 text-primary opacity-60" />
              <div className="text-sm font-medium text-foreground">Histórico inicial zerado</div>
              <div className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                Conforme você realizar suas sessões diárias, sua evolução e scores aparecerão aqui.
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sessions.slice(0, 3).map((s) => (
                <div key={s.id} className="glass rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">
                      {new Date(s.date).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDuration(s.durationSec)} · {s.corrections} correções
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient tabular-nums">{s.score}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <TabBar />
    </PhoneFrame>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "mint" | "violet";
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`inline-flex items-center gap-1.5 text-xs ${accent === "mint" ? "text-primary" : "text-accent"}`}>
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}
