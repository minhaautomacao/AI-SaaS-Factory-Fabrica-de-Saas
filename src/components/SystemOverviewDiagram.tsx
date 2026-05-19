import React from "react";
import { Terminal, Cpu, Layers, HardDriveDownload, GitBranch, ArrowRight, Play, CheckCircle2, RotateCcw } from "lucide-react";

interface SystemOverviewDiagramProps {
  currentStep: number; // 1 to 5
  activatedStep: number; // Which tab is viewed below
  onSelectStep: (step: number) => void;
  isRunning: boolean;
  onRunSimulation: () => void;
  onResetSimulation: () => void;
  hasSaaS: boolean;
}

export default function SystemOverviewDiagram({
  currentStep,
  activatedStep,
  onSelectStep,
  isRunning,
  onRunSimulation,
  onResetSimulation,
  hasSaaS
}: SystemOverviewDiagramProps) {
  
  const STEPS = [
    {
      id: 1,
      title: "1. Interface Humana",
      subtitle: "VS Code + CloudCode",
      icon: Terminal,
      color: "from-blue-500 to-indigo-600",
      accent: "text-indigo-600",
      bgAccent: "bg-indigo-50",
      desc: "Coleta ideias e envia requisitos."
    },
    {
      id: 2,
      title: "2. Orquestração de IA",
      subtitle: "Antigravity Agent",
      icon: Cpu,
      color: "from-purple-500 to-pink-600",
      accent: "text-purple-600",
      bgAccent: "bg-purple-50",
      desc: "Gera e divide o código em módulos estruturados."
    },
    {
      id: 3,
      title: "3. Planejamento Sênior",
      subtitle: "Google AI Studio",
      icon: Layers,
      color: "from-amber-500 to-orange-600",
      accent: "text-amber-600",
      bgAccent: "bg-amber-50",
      desc: "Especifica esquemas e gera prompts de arquitetura."
    },
    {
      id: 4,
      title: "4. Execução de Código",
      subtitle: "Cloud Dev Environment",
      icon: HardDriveDownload,
      color: "from-emerald-500 to-teal-600",
      accent: "text-emerald-500",
      bgAccent: "bg-emerald-50",
      desc: "Compila, roda testes e analisa integridade do build."
    },
    {
      id: 5,
      title: "5. Repositório GitHub",
      subtitle: "Gestão CI/CD integrada",
      icon: GitBranch,
      color: "from-rose-500 to-red-600",
      accent: "text-rose-500",
      bgAccent: "bg-rose-50",
      desc: "Automatiza deploy final para produção."
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-sans font-semibold text-gray-950 tracking-tight flex items-center gap-2">
            <span>Orquestrador de Fluxo Ativo</span>
            {currentStep > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-mono">
                Ativo: Etapa {currentStep}/5
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Clique em qualquer estágio do diagrama para investigar as especificações técnicas geradas
          </p>
        </div>

        <div className="flex gap-2.5">
          {hasSaaS && (
            <>
              <button
                onClick={onResetSimulation}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 font-mono text-xs rounded-lg transition-all"
                title="Reiniciar Simulação"
                id="reset-simulation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar</span>
              </button>
              <button
                onClick={onRunSimulation}
                disabled={isRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-sans text-xs font-semibold rounded-lg transition-all shadow-sm shadow-zinc-200"
                id="run-simulation"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isRunning ? "Simulando Build..." : "Simular Build Completo"}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Responsive Visual Diagram Pipeline Row */}
      <div className="relative mt-2 mb-6">
        {/* Connection pipe line behind nodes */}
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -translate-y-1/2 hidden lg:block z-0" />
        {isRunning && (
          <div 
            className="absolute top-1/2 left-4 h-0.5 bg-indigo-500 -translate-y-1/2 hidden lg:block z-0 transition-all duration-300 ease-linear animate-pulse"
            style={{ width: `${(currentStep - 1) * 22}%` }}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative z-10">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isAssociated = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const isCurrentlySelected = activatedStep === step.id;

            return (
              <div
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`relative flex flex-col justify-between p-4 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                  isCurrentlySelected
                    ? "border-indigo-500 ring-2 ring-indigo-50 hover:bg-white"
                    : isAssociated
                    ? "border-amber-400 bg-amber-50/10 shadow-md shadow-amber-50/50"
                    : isCompleted
                    ? "border-emerald-200 bg-emerald-50/5 hover:bg-gray-50/30"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/20"
                }`}
                id={`diagram-node-${step.id}`}
              >
                {/* Visual indicator header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${
                    isCurrentlySelected ? "bg-indigo-600 text-white" : step.bgAccent + " " + step.accent
                  } transition-colors`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isAssociated ? (
                      <div className="flex space-x-0.5">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                      </div>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">
                        Etapa {step.id}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-sans font-semibold text-gray-950 truncate">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate leading-normal">
                    {step.subtitle}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-2 leading-relaxed line-clamp-2">
                    {step.desc}
                  </p>
                </div>

                {/* Left/Right connector indicators on small screens */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:block lg:hidden text-gray-300 pointer-events-none">
                  {(step.id === 1 || step.id === 2 || step.id === 4) && <ArrowRight className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
