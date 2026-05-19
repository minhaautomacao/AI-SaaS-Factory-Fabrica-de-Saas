import React, { useState } from "react";
import { Sparkles, Terminal, ArrowRight, Lightbulb, ClipboardList } from "lucide-react";

interface SaaSPlannerFormProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
  hasAPIKey: boolean;
  onSelectTemplate: (index: number) => void;
}

export default function SaaSPlannerForm({ onSubmit, isLoading, hasAPIKey, onSelectTemplate }: SaaSPlannerFormProps) {
  const [idea, setIdea] = useState("");

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || isLoading) return;
    onSubmit(idea);
  };

  const SUGGESTIONS = [
    {
      title: "Agendamento Médico",
      desc: "IA orientando pacientes a escolher médicos e marcar horários por sintomas",
      index: 0
    },
    {
      title: "Finanças de Freelancers",
      desc: "Importador de extrato bancário com classificação fiscal inteligente de despesas",
      index: 1
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-sans font-semibold text-gray-900 tracking-tight">
            Iniciar Nova Produção de SaaS
          </h2>
          <p className="text-xs text-gray-500 font-mono">
            ESTÁGIO 1: CONCEPÇÃO & ENTRADA DE REQUISITOS
          </p>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descreva seu conceito ou problema de negócio (em Português)
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={isLoading}
            placeholder="Exemplo: Um micro-SaaS para proprietários de cães agendarem banho e tosa automático que analisa raça e tamanho para calcular o preço ideal..."
            className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60 transition-all text-sm resize-none"
            id="saas-idea-input"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${hasAPIKey ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-xs font-mono text-gray-600">
              {hasAPIKey 
                ? "Conectado à IA (Gemini 3.5)" 
                : "Sem CHAVE API ativa — Usando Sandbox local"}
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !idea.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium rounded-xl transition-all shadow-sm shadow-indigo-100 max-sm:w-full"
            id="generate-button"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Orquestrando Fábrica...</span>
              </>
            ) : (
              <>
                <span>Orquestrar Fábrica de IA</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4 text-gray-500">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold tracking-wider font-sans uppercase">Ideias Rápidas (Acelere com Modelos Prontos)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.index}
              onClick={() => onSelectTemplate(s.index)}
              disabled={isLoading}
              className="flex flex-col text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/20 hover:scale-[1.01] transition-all cursor-pointer group disabled:opacity-50"
              id={`template-btn-${s.index}`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {s.title}
                </span>
                <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                  Sandbox
                </span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {s.desc}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
