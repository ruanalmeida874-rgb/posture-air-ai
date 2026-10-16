import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, TrendingUp, Camera, Headphones, Sparkles, Activity } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { TabBar } from "@/components/TabBar";
import { loadSessions, formatDuration, calculateStreak, type SessionSummary } from "@/lib/posture-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Meu progresso — Posture Air AI" },
      { name: "description", content: "Acompanhe sua evolução semanal, média diária e sequência de dias com boa postura." },
      { property: "og:title", content: "Meu Progresso — Posture Air AI" },
      { property: "og:description", content: "Histórico e gamificação da sua postura." },
    ],
  }),
  component: History,
});

function History() {
  const [list, setList] = useState<SessionSummary[]>([]);

  useEffect(() => {
    setList(loadSessions());
  }, []);

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const day = list.filter((s) => new Date(s.date).toDateString() === d.toDateString());
    const avg = day.length ? Math.round(day.reduce((a, b) => a + b.score, 0) / day.length) : 0;
    return {
      d,
      avg,
      label: d.toLocaleDateString("pt-BR", { weekday: "short" })[0].toUpperCase(),
    };
  });

  const max = Math.max(100, ...week.map((w) => w.avg));
  const avgDaily = list.length
    ? Math.round(
        list.slice(0, 7).reduce((a, b) => a + b.score, 0) / Math.max(1, Math.min(7, list.length))
      )
    : 0;
  const streak = calculateStreak(list);

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Meu progresso</div>
        <h1 className="text-3xl font-bold mt-1">Esta semana</h1>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="glass rounded-2xl p-4">
            <div className="inline-flex items-center gap-1.5 text-xs text-primary font-medium">
              <TrendingUp size={14} /> Média
            </div>
            <div className="text-3xl font-bold mt-1 text-gradient tabular-nums">{avgDaily}</div>
            <div className="text-xs text-muted-foreground">score diário</div>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="inline-flex items-center gap-1.5 text-xs text-warn font-medium">
              <Flame size={14} /> Sequência
            </div>
            <div className="text-3xl font-bold mt-1 tabular-nums">{streak} dias</div>
            <div className="text-xs text-muted-foreground">ofensiva ativa</div>
          </div>
        </div>

        {/* Weekly evolution bar chart */}
        <div className="mt-5 glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Evolução semanal</div>
          <div className="flex items-end gap-2 h-32">
            {week.map((w, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-mint to-violet transition-all"
                  style={{
                    height: `${(w.avg / max) * 100}%`,
                    minHeight: w.avg > 0 ? 6 : 2,
                    opacity: w.avg > 0 ? 1 : 0.15,
                  }}
                />
                <div className="text-[10px] text-muted-foreground font-medium">{w.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Sessões Gravadas</h2>
            <span className="text-xs text-muted-foreground">{list.length} no total</span>
          </div>

          {list.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-muted-foreground">
              <Activity size={26} className="mx-auto mb-2 text-primary opacity-60" />
              <div className="text-sm font-medium text-foreground">Nenhuma sessão registrada</div>
              <div className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
                Ao concluir sessões de estudo ou trabalho, seus relatórios e tempo de boa postura aparecerão listados aqui.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {list.slice(0, 20).map((s) => (
                <div key={s.id} className="glass rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">
                        {new Date(s.date).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {s.source === "camera" && <Camera size={12} className="text-primary" />}
                      {s.source === "sensor" && <Headphones size={12} className="text-accent" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {formatDuration(s.durationSec)} · {s.corrections} correções
                    </div>
                  </div>
                  <ScorePill v={s.score} />
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

function ScorePill({ v }: { v: number }) {
  const c =
    v >= 90
      ? "bg-primary/15 text-primary"
      : v >= 70
        ? "bg-primary/10 text-primary"
        : v >= 50
          ? "bg-warn/15 text-warn"
          : "bg-danger/15 text-danger";
  return <div className={`px-3 py-1.5 rounded-full font-bold tabular-nums text-sm ${c}`}>{v}</div>;
}
