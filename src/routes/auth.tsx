import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Sparkles, Mail, Lock, User, Target, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { loginUser, registerUser, type Profile } from "@/lib/posture-store";
import { playGentleChime } from "@/lib/audio-alerts";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou Cadastrar — Posture Air AI" },
      { name: "description", content: "Acesse sua conta do Posture Air AI para sincronizar suas métricas e calibração." },
      { property: "og:title", content: "Autenticação — Posture Air AI" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [goal, setGoal] = useState<Profile["goal"]>("work");
  const [height, setHeight] = useState(175);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = loginUser(email, password);
      setLoading(false);
      if (res.success) {
        playGentleChime("success");
        navigate({ to: "/" });
      } else {
        setError(res.error || "Falha ao entrar.");
      }
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = registerUser(name, email, password, goal, height);
      setLoading(false);
      if (res.success) {
        playGentleChime("success");
        navigate({ to: "/" });
      } else {
        setError(res.error || "Falha ao cadastrar.");
      }
    }, 400);
  };

  const fillDemoAccount = () => {
    setEmail("alex@apple.com");
    setPassword("123456");
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-2 pb-8 min-h-full flex flex-col">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Início
          </Link>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Posture ID</span>
        </div>

        {/* Brand Header */}
        <div className="mt-5 text-center">
          <div className="h-16 w-16 mx-auto rounded-3xl bg-gradient-to-tr from-mint to-violet grid place-items-center shadow-lg shadow-primary/20">
            <Sparkles size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold mt-3">Posture Air AI</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
            Seu personal trainer de postura invisível. Salve seu histórico e calibração biométrica.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 p-1 glass rounded-2xl flex items-center">
          <button
            onClick={() => {
              setTab("login");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              tab === "login"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setTab("register");
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              tab === "register"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                E-mail
              </label>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2.5">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-transparent flex-1 outline-none text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                Senha
              </label>
              <div className="glass rounded-2xl px-4 py-3 flex items-center gap-2.5">
                <Lock size={16} className="text-muted-foreground shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="bg-transparent flex-1 outline-none text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Credentials shortcut */}
            <div className="pt-1 flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Conta demo rápida:</span>
              <button
                type="button"
                onClick={fillDemoAccount}
                className="text-primary font-medium hover:underline"
              >
                Preencher alex@apple.com
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform shadow-[0_20px_50px_-20px_var(--color-primary)] disabled:opacity-50"
            >
              {loading ? "Entrando..." : "Acessar Conta"}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="mt-4 space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                Nome Completo
              </label>
              <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                <User size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-transparent flex-1 outline-none text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                E-mail
              </label>
              <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-transparent flex-1 outline-none text-sm text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                Senha
              </label>
              <div className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
                <Lock size={16} className="text-muted-foreground shrink-0" />
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="bg-transparent flex-1 outline-none text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                  Objetivo
                </label>
                <div className="glass rounded-2xl px-3 py-2.5">
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as Profile["goal"])}
                    className="w-full bg-transparent text-xs text-foreground outline-none cursor-pointer"
                  >
                    <option value="work" className="bg-card text-foreground">Trabalho</option>
                    <option value="study" className="bg-card text-foreground">Estudo</option>
                    <option value="reading" className="bg-card text-foreground">Leitura</option>
                    <option value="phone" className="bg-card text-foreground">Celular</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground block mb-1 px-1">
                  Altura (cm)
                </label>
                <div className="glass rounded-2xl px-3 py-2.5">
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    className="w-full bg-transparent text-xs text-foreground outline-none font-medium tabular-nums"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold active:scale-[0.98] transition-transform shadow-[0_20px_50px_-20px_var(--color-primary)] disabled:opacity-50"
            >
              {loading ? "Criando Conta..." : "Criar Minha Conta"}
            </button>
          </form>
        )}

        <div className="flex-1" />

        {/* Footer Guest Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar sem conta (Modo Local Offline)
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}
