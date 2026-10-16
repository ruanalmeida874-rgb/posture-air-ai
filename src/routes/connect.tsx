import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Headphones, CheckCircle2, Bluetooth } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { isCalibrated } from "@/lib/posture-store";

export const Route = createFileRoute("/connect")({
  head: () => ({
    meta: [
      { title: "Conectar AirPods — Posture Air AI" },
      { name: "description", content: "Conecte seus AirPods com head tracking para iniciar o monitoramento de postura." },
      { property: "og:title", content: "Conectar AirPods" },
      { property: "og:description", content: "Conecte seus AirPods para iniciar." },
    ],
  }),
  component: Connect,
});

function Connect() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"searching" | "found" | "connected">("searching");
  const [calibrated, setCal] = useState(false);

  useEffect(() => { setCal(isCalibrated()); }, []);
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("found"), 1200);
    const t2 = setTimeout(() => setPhase("connected"), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-8 min-h-full flex flex-col">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft size={16} />Voltar</Link>
        <h1 className="text-2xl font-bold mt-4">Conectar dispositivo</h1>
        <p className="text-sm text-muted-foreground mt-1">Use AirPods (3ª geração), Pro ou Max com head tracking.</p>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="relative grid place-items-center">
            {phase !== "connected" && (
              <>
                <div className="absolute h-56 w-56 rounded-full border border-primary/30 animate-pulse-ring" />
                <div className="absolute h-40 w-40 rounded-full border border-primary/40 animate-pulse-ring" style={{ animationDelay: "0.4s" }} />
              </>
            )}
            <div className={`h-28 w-28 rounded-full grid place-items-center transition-all ${phase === "connected" ? "bg-primary/20 ring-glow" : "bg-secondary"}`}>
              <Headphones size={48} className={phase === "connected" ? "text-primary animate-float" : "text-foreground/70"} />
            </div>
          </div>
          <div className="mt-8 text-center">
            {phase === "searching" && (
              <>
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Bluetooth size={14} /> Procurando dispositivos…</div>
                <h2 className="text-lg font-semibold mt-2">Aproxime seus AirPods</h2>
              </>
            )}
            {phase === "found" && (
              <>
                <div className="text-xs text-accent uppercase tracking-wider">Encontrado</div>
                <h2 className="text-lg font-semibold mt-1">AirPods Pro de Você</h2>
                <p className="text-xs text-muted-foreground mt-1">Pareando…</p>
              </>
            )}
            {phase === "connected" && (
              <>
                <div className="inline-flex items-center gap-1.5 text-xs text-primary uppercase tracking-wider font-semibold"><CheckCircle2 size={14} /> Conectado</div>
                <h2 className="text-xl font-bold mt-2">AirPods Pro</h2>
                <p className="text-sm text-muted-foreground mt-1">Head tracking · Áudio espacial pronto</p>
              </>
            )}
          </div>
        </div>

        <button
          disabled={phase !== "connected"}
          onClick={() => navigate({ to: calibrated ? "/session" : "/calibrate" })}
          className="w-full rounded-2xl bg-primary text-primary-foreground py-4 font-semibold disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform"
        >
          {calibrated ? "Iniciar sessão" : "Continuar para calibração"}
        </button>
      </div>
    </PhoneFrame>
  );
}
