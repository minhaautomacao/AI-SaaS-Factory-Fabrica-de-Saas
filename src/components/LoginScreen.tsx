import React, { useState } from "react";
import { Lock, ShieldAlert, KeyRound, Eye, EyeOff, Sparkles, Server } from "lucide-react";

interface LoginScreenProps {
  onSuccess: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Por favor, digite a senha de acesso.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem("saas_factory_authenticated", "true");
        localStorage.setItem("saas_factory_token", data.token);
        onSuccess();
      } else {
        setError(data.error || "Senha incorreta. Verifique suas credenciais.");
      }
    } catch (err) {
      setError("Erro ao autenticar com o servidor. A rota de login não respondeu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 antialiased selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden p-8 space-y-8">
        
        {/* Guard Header Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 font-sans">
              Estação de Autenticação
            </h1>
            <p className="text-xs text-gray-500 font-medium mt-1">
              AI SaaS Factory — Engenharia Avançada Multicanal
            </p>
          </div>
        </div>

        {/* Security Warning Information Box */}
        <div className="bg-slate-50 border border-gray-100 p-4 rounded-2xl space-y-2.5">
          <div className="flex gap-2 text-indigo-950">
            <KeyRound className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span className="text-xs font-bold font-mono uppercase tracking-wider">
              Acesso Protegido Ativo
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Esta fábrica executa gerações de código complexas e consome saldo da API do Gemini. Digite a senha cadastrada para destravar o orquestrador.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono block">
              Senha da Fábrica (Workspace Secret)
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                disabled={isLoading}
                placeholder="Digite a senha..."
                className="w-full text-sm bg-slate-50 border border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl pl-4 pr-11 py-3 focus:outline-none transition-all text-gray-900 font-sans"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex gap-2 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-sans font-semibold text-sm py-3 px-4 rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Validando Credenciais...</span>
              </>
            ) : (
              <>
                <span>Acessar Fábrica de SaaS</span>
              </>
            )}
          </button>
        </form>

        {/* Helpful hints and diagnostics for Cloud Computing deployers */}
        <div className="border-t border-gray-100 pt-6 text-center space-y-2">
          <div className="flex justify-center items-center gap-1.5 text-[11px] text-gray-400">
            <Server className="w-3.5 h-3.5" />
            <span>Senha padrão de Sandbox: <strong className="font-mono text-gray-600">admin</strong></span>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">
            Você pode alterar essa senha configurando a variável de ambiente <code className="bg-slate-50 px-1 py-0.5 border border-slate-100 rounded text-slate-600 font-mono">APP_PASSWORD</code> no seu painel de Cloud Code ou arquivo .env.
          </p>
        </div>

      </div>
    </div>
  );
}
