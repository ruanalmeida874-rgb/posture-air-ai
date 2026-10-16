import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Volume2,
  Sparkles,
  RefreshCw,
  Trash2,
  LogOut,
  LogIn,
  UserPlus,
  Video,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TabBar } from "@/components/TabBar";
import {
  loadProfile,
  saveProfile,
  type Profile,
  defaultProfile,
  setCalibrated,
  getCurrentUser,
  logoutUser,
  type UserAccount,
} from "@/lib/posture-store";
import { testAlertSound } from "@/lib/audio-alerts";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Perfil e Ajustes — Posture Air AI" },
      { name: "description", content: "Gerencie sua conta, sensibilidade dos alertas, tipo de voz e calibração." },
      { property: "og:title", content: "Perfil e Ajustes — Posture Air AI" },
      { property: "og:description", content: "Personalize seu assistente e conta." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const [p, setP] = useState<Profile>(defaultProfile);
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(null);
  const [tested, setTested] = useState(false);

  useEffect(() => {
    setP(loadProfile());
    setCurrentUserState(getCurrentUser());
  }, []);

  const update = (patch: Partial<Profile>) => {
    const next = { ...p, ...patch };
    setP(next);
    saveProfile(next);
  };

  const handleTestAudio = () => {
    testAlertSound(p);
    setTested(true);
    setTimeout(() => setTested(false), 2000);
  };

  const handleLogout = () => {
    if (confirm("Deseja realmente encerrar a sessão da sua conta?")) {
      logoutUser();
      setCurrentUserState(null);
      setP(loadProfile());
      window.location.reload();
    }
  };

  const handleResetData = () => {
    if (confirm("Deseja redefinir os dados e calibração para o padrão?")) {
      localStorage.clear();
      setCalibrated(false);
      window.location.reload();
    }
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Perfil</div>
        <h1 className="text-3xl font-bold mt-1">Ajustes & Conta</h1>

        {/* User Card */}
        <div className="mt-5 glass rounded-2xl p-4 flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-mint to-violet grid place-items-center text-xl font-bold text-primary-foreground shadow-sm shrink-0">
            {p.name[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg truncate text-foreground">{p.name}</span>
              {currentUser && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                  <ShieldCheck size={11} /> Conectado
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {currentUser ? currentUser.email : "Modo visitante offline"}
            </div>
          </div>
        </div>

        {/* Account Authentication Section */}
        <Section title="Conta & Acesso">
          {currentUser ? (
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>E-mail cadastrado</span>
                <span className="font-medium text-foreground">{currentUser.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Status da sincronização</span>
                <span className="text-primary font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Dados sincronizados localmente
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 py-2.5 rounded-xl bg-danger/15 text-danger hover:bg-danger/25 active:scale-95 transition-all text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                Encerrar Login (Sair da Conta)
              </button>
            </div>
          ) : (
            <div className="p-3.5 space-y-3">
              <p className="text-xs text-muted-foreground">
                Cadastre-se ou faça login para proteger seu histórico de postura e baseline biométrico.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth"
                  className="py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
                >
                  <LogIn size={14} />
                  Fazer Login
                </Link>
                <Link
                  to="/auth"
                  className="py-2.5 rounded-xl glass text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all text-center"
                >
                  <UserPlus size={14} />
                  Criar Conta
                </Link>
              </div>
            </div>
          )}
        </Section>

        {/* Demo Video Simulation Section */}
        <Section title="Divulgação & LinkedIn">
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium flex items-center gap-1.5">
                <Video size={15} className="text-primary" />
                <span>Simulador de Vídeo</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Gere um vídeo gravado pronto para postar no LinkedIn
              </div>
            </div>
            <Link
              to="/demo"
              className="px-3 py-1.5 rounded-xl bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors shrink-0"
            >
              Abrir
            </Link>
          </div>
        </Section>

        {/* Monitoring Settings */}
        <Section title="Monitoramento Principal">
          <Row label="Modo padrão">
            <Select
              value={p.trackingMode}
              onChange={(v) => update({ trackingMode: v as Profile["trackingMode"] })}
              options={[
                ["camera", "Câmera Frontal IA (Recomendado)"],
                ["sensor", "AirPods / Sensores de Movimento"],
              ]}
            />
          </Row>
          <div className="p-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Calibração anatômica ativa</span>
            <Link to="/calibrate" className="text-primary font-medium flex items-center gap-1 hover:underline">
              <RefreshCw size={12} /> Recalibrar
            </Link>
          </div>
        </Section>

        {/* Personal Ergonomics */}
        <Section title="Ergonomia Pessoal">
          <Row label="Altura">
            <input
              type="number"
              value={p.height}
              onChange={(e) => update({ height: Number(e.target.value) })}
              className="w-20 bg-transparent text-right outline-none tabular-nums font-medium"
            />
            <span className="text-muted-foreground text-sm ml-1">cm</span>
          </Row>
          <Row label="Objetivo principal">
            <Select
              value={p.goal}
              onChange={(v) => update({ goal: v as Profile["goal"] })}
              options={[
                ["study", "Estudo prolongado"],
                ["work", "Trabalho em computador"],
                ["reading", "Leitura"],
                ["phone", "Uso do celular"],
              ]}
            />
          </Row>
        </Section>

        {/* Alerts and Speech Feedback */}
        <Section title="Alertas e Feedback">
          <Row label="Sensibilidade da IA">
            <Select
              value={p.sensitivity}
              onChange={(v) => update({ sensitivity: v as Profile["sensitivity"] })}
              options={[
                ["low", "Baixa (Tolerante)"],
                ["medium", "Média (Equilibrada)"],
                ["high", "Alta (Rigorosa)"],
              ]}
            />
          </Row>
          <Row label="Tolerância antes do alerta">
            <input
              type="number"
              min={5}
              max={120}
              value={p.alertAfterSec}
              onChange={(e) => update({ alertAfterSec: Number(e.target.value) })}
              className="w-16 bg-transparent text-right outline-none tabular-nums font-medium"
            />
            <span className="text-muted-foreground text-sm ml-1">segundos</span>
          </Row>
          <Row label="Tipo de áudio / Voz">
            <Select
              value={p.voice}
              onChange={(v) => update({ voice: v as Profile["voice"] })}
              options={[
                ["female", "Voz Feminina (pt-BR)"],
                ["male", "Voz Masculina (pt-BR)"],
                ["tone", "Apenas Acordes Suaves"],
                ["vibration", "Apenas Vibração"],
              ]}
            />
          </Row>

          <div className="p-3">
            <button
              onClick={handleTestAudio}
              className="w-full py-2.5 rounded-xl glass hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs font-semibold text-primary"
            >
              <Volume2 size={14} />
              {tested ? "Alerta reproduzido!" : "Testar Alerta de Áudio e Voz"}
            </button>
          </div>
        </Section>

        {/* Data & Reset */}
        <Section title="Dados e Armazenamento">
          <div className="p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Redefinir aplicativo</div>
              <div className="text-xs text-muted-foreground">Limpa dados locais e recalibra</div>
            </div>
            <button
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl bg-danger/10 text-danger text-xs font-semibold hover:bg-danger/20 transition-colors flex items-center gap-1"
            >
              <Trash2 size={13} /> Limpar
            </button>
          </div>
        </Section>
      </div>
      <TabBar />
    </PhoneFrame>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground px-1 mb-2">{title}</div>
      <div className="glass rounded-2xl divide-y divide-white/5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <div className="text-sm">{label}</div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent text-sm text-foreground/90 outline-none appearance-none pr-2 cursor-pointer font-medium"
    >
      {options.map(([v, l]) => (
        <option key={v} value={v} className="bg-card text-foreground">
          {l}
        </option>
      ))}
    </select>
  );
}
