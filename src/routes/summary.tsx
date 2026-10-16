import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Share2, Camera, Headphones, Sparkles, Check } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { RingScore } from "@/components/RingScore";
import { loadSessions, formatDuration, type SessionSummary } from "@/lib/posture-store";

export const Route = createFileRoute("/summary")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Resumo da sessão — Posture Air AI" },
      { name: "description", content: "Relatório ergonômico completo da sua sessão: score, tempo com boa postura, correções e diagnóstico da IA." },
      { property: "og:title", content: "Resumo da Sessão de Postura" },
      { property: "og:description", content: "Relatório de desempenho e correções posturais." },
    ],
  }),
  component: Summary,
});

function Summary() {
  const { id } = Route.useSearch();
  const [s, setS] = useState<SessionSummary | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const list = loadSessions();
    setS(list.find((x) => x.id === id) ?? list[0] ?? null);
  }, [id]);

  if (!s) {
    return (
      <PhoneFrame>
        <div className="p-6 text-center text-muted-foreground">Sem sessões registradas ainda.</div>
      </PhoneFrame>
    );
  }

  const tier =
    s.score >= 90
      ? "Excelente postura"
      : s.score >= 70
        ? "Boa postura"
        : s.score >= 50
          ? "Atenção necessária"
          : "Muitas correções";

  const handleShare = async () => {
    const text = `Finalizei uma sessão de postura no Posture Air AI!\n⏱️ Duração: ${formatDuration(s.durationSec)}\n⭐ Score: ${s.score}/100\n✅ ${s.goodPosturePct}% de postura alinhada`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Meu Treino Postural — Posture Air AI",
          text,
          url: window.location.href,
        });
        return;
      } catch {}
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Início
          </Link>
          <button
            onClick={handleShare}
            className="h-9 w-9 grid place-items-center rounded-full glass hover:bg-white/10 active:scale-95 transition-all text-foreground"
            title="Compartilhar resumo"
          >
            {copied ? <Check size={16} className="text-primary" /> : <Share2 size={16} />}
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Resumo da sessão</span>
            {s.source && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {s.source === "camera" ? <Camera size={10} /> : <Headphones size={10} />}
                {s.source === "camera" ? "Câmera IA" : "AirPods"}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-1">
            {new Date(s.date).toLocaleString("pt-BR", {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </h1>
        </div>

        <div className="mt-6 flex justify-center">
          <RingScore value={s.score} label={tier} />
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <Stat label="Duração" value={formatDuration(s.durationSec)} />
          <Stat label="Boa postura" value={`${s.goodPosturePct}%`} />
          <Stat label="Correções" value={String(s.corrections)} />
          <Stat label="Score final" value={`${s.score}/100`} />
        </div>

        {/* AI Diagnostic Pattern */}
        <div className="mt-6 glass rounded-2xl p-4 border-l-2 border-primary">
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary font-semibold">
            <Sparkles size={14} /> Padrão Detectado pela IA
          </div>
          <div className="text-base font-semibold mt-1 text-foreground">{s.topIssue}</div>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            Nossa engine correlaciona seus micro-desvios anatômicos ao longo do tempo para sugerir ajustes ergonômicos personalizados.
          </p>
        </div>

        {/* Real Session Timeline Chart */}
        <div className="mt-6 glass rounded-2xl p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Linha do tempo da postura</div>
          <TimelineBars points={s.timeline} />
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-3">
            <span className="inline-flex items-center gap-1">
              <Dot c="var(--color-mint)" /> Alinhado
            </span>
            <span className="inline-flex items-center gap-1">
              <Dot c="var(--color-warn)" /> Alerta
            </span>
            <span className="inline-flex items-center gap-1">
              <Dot c="var(--color-danger)" /> Desvio
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="mt-7 block w-full text-center rounded-2xl bg-primary text-primary-foreground py-4 font-semibold active:scale-[0.98] transition-transform shadow-[0_20px_50px_-20px_var(--color-primary)]"
        >
          Concluir e Voltar
        </Link>
      </div>
    </PhoneFrame>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function Dot({ c }: { c: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: c }} />;
}

function TimelineBars({ points }: { points?: SessionSummary["timeline"] }) {
  // If we have actual timeline points, use them! Otherwise show 24 representative bars
  const bars =
    points && points.length > 0
      ? points.slice(0, 32).map((p) => {
          const color =
            p.state === "good"
              ? "var(--color-mint)"
              : p.state === "warn"
                ? "var(--color-warn)"
                : "var(--color-danger)";
          const height = p.state === "good" ? 80 : p.state === "warn" ? 55 : 35;
          return { color, height };
        })
      : Array.from({ length: 24 }, (_, i) => ({
          color: i % 5 === 0 ? "var(--color-warn)" : "var(--color-mint)",
          height: 50 + (i % 3) * 15,
        }));

  return (
    <div className="flex items-end gap-1 h-20">
      {bars.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all"
          style={{ height: `${b.height}%`, background: b.color, opacity: 0.9 }}
        />
      ))}
    </div>
  );
}
