/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Terminal, Lightbulb, Settings, Compass, Layers, Github, ExternalLink, HelpCircle, Code2, Play, CheckCircle2, Cloud } from "lucide-react";
import Sidebar from "./components/Sidebar";
import SaaSPlannerForm from "./components/SaaSPlannerForm";
import SystemOverviewDiagram from "./components/SystemOverviewDiagram";
import SaaSDetailsViewer from "./components/SaaSDetailsViewer";
import TerminalSimulator from "./components/TerminalSimulator";
import { SaaSProject, SimulationLog } from "./types";

export default function App() {
  const [projects, setProjects] = useState<SaaSProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<SaaSProject | null>(null);
  const [activatedStep, setActivatedStep] = useState<number>(1);
  const [logs, setLogs] = useState<SimulationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAPIKey, setHasAPIKey] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIntervalId, setSimIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Fetch initial config and templates
  useEffect(() => {
    // Check if API key is configured
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        setHasAPIKey(data.hasAPIKey);
      })
      .catch((err) => console.error("Error loading API status:", err));

    // Load templates into the user's view initially
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.templates) {
          const loaded: SaaSProject[] = data.templates.map((t: any, idx: number) => ({
            id: `temp-${idx}-${Date.now()}`,
            createdAt: new Date().toISOString(),
            name: t.name,
            tagline: t.tagline,
            description: t.description,
            techStack: t.techStack,
            modules: t.modules,
            structuralPrompts: t.structuralPrompts,
            githubActions: t.githubActions,
            currentSimStep: 1
          }));
          setProjects(loaded);
          setSelectedProject(loaded[0]);
          
          // Add pleasant initial info log
          addLog("Fábrica de SaaS iniciada. Requisitos de sandbox preenchidos com sucesso.", "info");
        }
      })
      .catch((err) => {
        console.error("Error loading templates:", err);
        addLog("Não foi possível conectar ao servidor backend. O applet continuará em modo isolado local.", "warning");
      });
  }, []);

  const addLog = (text: string, type: "info" | "success" | "warning" | "error" | "command") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, text, type }]);
  };

  const handleCreateSaaS = async (idea: string) => {
    setIsLoading(true);
    addLog(`Enviando requisitos de SaaS: "${idea}"`, "command");
    addLog("Consultando o orquestrador do Google AI Studio para planejar arquitetura...", "info");

    try {
      const response = await fetch("/api/generate-saas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea })
      });

      const data = await response.json();

      if (!response.ok) {
        // If API key is missing, look for fallbackSuggestions or display precise backend connection error
        if (response.status === 401 && data.isFallbackAvailable) {
          addLog("Chave GEMINI_API_KEY não foi configurada nos Secrects mais seguros do AI Studio.", "warning");
          addLog("Iniciando auto-geração utilizando mecanismo de Sandbox offline para este modelo de ideia...", "info");
          
          // Simulate generating a fine-tuned sandbox based on input keywords
          setTimeout(() => {
            const isFinances = idea.toLowerCase().includes("financ") || idea.toLowerCase().includes("dinheiro") || idea.toLowerCase().includes("paga");
            const templateIndex = isFinances ? 1 : 0;
            handleSelectTemplate(templateIndex, `PROJETO PERSONALIZADO: ${idea.slice(0, 30)}...`);
            setIsLoading(false);
          }, 1500);
          return;
        }
        throw new Error(data.error || "Erro desconhecido gerando planeamento.");
      }

      const generated: SaaSProject = {
        id: `saas-${Date.now()}`,
        createdAt: new Date().toISOString(),
        name: data.saas.name,
        tagline: data.saas.tagline,
        description: data.saas.description,
        techStack: data.saas.techStack,
        modules: data.saas.modules,
        structuralPrompts: data.saas.structuralPrompts,
        githubActions: data.saas.githubActions,
        currentSimStep: 1
      };

      setProjects((prev) => [generated, ...prev]);
      setSelectedProject(generated);
      setActivatedStep(1);
      
      addLog(`SaaS "${generated.name}" gerado com sucesso pelo Gemini 3.5!`, "success");
      addLog("Clique em 'Simular Build Completo' para iniciar a validação automatizada de código.", "info");

    } catch (err: any) {
      console.error(err);
      addLog(`Erro na geração: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTemplate = (index: number, customNameOverride?: string) => {
    // Select from preexisting fallback models safely
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.templates && data.templates[index]) {
          const t = data.templates[index];
          const customProject: SaaSProject = {
            id: `temp-${index}-${Date.now()}`,
            createdAt: new Date().toISOString(),
            name: customNameOverride || t.name,
            tagline: t.tagline,
            description: t.description,
            techStack: t.techStack,
            modules: t.modules,
            structuralPrompts: t.structuralPrompts,
            githubActions: t.githubActions,
            currentSimStep: 1
          };
          setProjects((prev) => [customProject, ...prev]);
          setSelectedProject(customProject);
          setActivatedStep(1);
          addLog(`Modelo "${customProject.name}" carregado. Sandbox pronto para montagem.`, "success");
        }
      });
  };

  const runFullPipelineSimulation = () => {
    if (!selectedProject || isSimulating) return;

    // Clear previous simulation interval if any
    if (simIntervalId) {
      clearInterval(simIntervalId);
    }

    setIsSimulating(true);
    addLog("Iniciando simulação completa da esteira de produção (Etapas 1 a 5)...", "info");
    addLog("npm run dev", "command");

    let currentStep = 1;
    setSelectedProject((prev) => prev ? { ...prev, currentSimStep: 1 } : null);
    setActivatedStep(1);

    const simulationStepsData = [
      {
        step: 1,
        logs: [
          "Iniciando interface do desenvolvedor local (VS Code + CloudCode)...",
          "Requisitos coletados via formulário interativo de SaaS e analisados.",
          "Criação do diretório de sandbox no ambiente virtualizado Cloud Run.",
          "Etapa 1 concluída: Próximo passo é Orquestração Sênior por IA."
        ]
      },
      {
        step: 2,
        logs: [
          "Ativando Antigravity Orquestrador...",
          "Módulos gerados e validados pelo Gemini 3.5.",
          "Gerador cria arquivos recomendados e estrutura dependências.",
          "Pilha de tecnologias validada com sucesso contra o pacote 'package.json'.",
          "Etapa 2 concluída com êxito lógico."
        ]
      },
      {
        step: 3,
        logs: [
          "Consultando especificações do Google AI Studio...",
          "Projetando esquemas de tabelas de banco de dados...",
          "Modelos de prompts de frontend e backend carregados e salvos.",
          "Validação de tokens e chaves de segurança ativa concluída.",
          "Etapa 3 de planejamento de arquitetura finalizada!"
        ]
      },
      {
        step: 4,
        logs: [
          "Iniciando compilação do código: npm run build",
          "Análise semântica e linter TypeScript ativa...",
          "Rodando suite de testes automatizados com Vitest...",
          "✓ Test 1: Simular colisão de calendário de reservas - Passou",
          "✓ Test 2: Validação de resposta do chatbot de triagem - Passou",
          "Empacotamento concluído com sucesso (dist/server.cjs gerado).",
          "Etapa 4 de execução dev bem-sucedida!"
        ]
      },
      {
        step: 5,
        logs: [
          "Preparando fluxo de versionamento GitHub Actions...",
          "Gerando arquivo .github/workflows/deploy.yml no repositório virtual.",
          "Pipeline de CI/CD ativo. Pronto para realizar push e deploy em Cloud Run.",
          "Aplicações web prontas e orquestradas pelo robô!",
          "✔ Simulação Concluída. Sandbox totalmente operável!"
        ]
      }
    ];

    // Trigger sequential simulation interval
    const interval = setInterval(() => {
      const stepData = simulationStepsData.find(s => s.step === currentStep);
      if (stepData) {
        stepData.logs.forEach((logText, lIdx) => {
          setTimeout(() => {
            const isLastOfStep = lIdx === stepData.logs.length - 1;
            addLog(logText, isLastOfStep ? "success" : "info");
          }, lIdx * 250);
        });
      }

      currentStep += 1;
      if (currentStep <= 5) {
        setSelectedProject((prev) => prev ? { ...prev, currentSimStep: currentStep } : null);
        setActivatedStep(currentStep);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        addLog("Esteira de SaaS compilada 100% verde!", "success");
      }
    }, 1800);

    setSimIntervalId(interval);
  };

  const handleResetSimulation = () => {
    if (simIntervalId) {
      clearInterval(simIntervalId);
    }
    setIsSimulating(false);
    setSelectedProject((prev) => prev ? { ...prev, currentSimStep: 1 } : null);
    setActivatedStep(1);
    addLog("Simulador de pipeline de código redefinido.", "info");
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-gray-950 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* Visual Workspace Hero Header */}
      <header className="bg-white border-b border-gray-100 py-5 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white rounded-xl shadow-sm shadow-indigo-100">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <span>AI SaaS Factory</span>
                <span className="text-[10px] font-mono bg-zinc-950 text-emerald-400 px-2 py-0.5 rounded tracking-widest font-bold">
                  BETA V1.0
                </span>
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Orquestrador Avançado de Arquiteturas para Aplicações de Negócio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://ai.studio/build"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 transition-colors font-mono"
            >
              <span>AI Studio Workspace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-8 flex flex-col lg:flex-row gap-8">
        {/* Dynamic Nav Sidebar */}
        <Sidebar
          projects={projects}
          selectedProject={selectedProject}
          onSelectProject={(p) => {
            setSelectedProject(p);
            setActivatedStep(p.currentSimStep || 1);
            addLog(`Focado no projeto: ${p.name}`, "info");
          }}
          onNewProject={() => {
            setSelectedProject(null);
            addLog("Mudando foco para criação de nova arquitetura.", "info");
          }}
          hasAPIKey={hasAPIKey}
          isLoading={isLoading}
        />

        {/* Primary Workspace Panel */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Active Diagram Navigation Tracker */}
          <SystemOverviewDiagram
            currentStep={selectedProject?.currentSimStep || 0}
            activatedStep={activatedStep}
            onSelectStep={(step) => {
              setActivatedStep(step);
              addLog(`Analisando especificações da Etapa ${step}: ${
                step === 1 ? "Entrada de Requisitos do Cliente" : 
                step === 2 ? "Modelagem e Divisão de Módulos por IA" :
                step === 3 ? "Planejamento Arquitetural & Prompts" :
                step === 4 ? "Compilação e Suíte de Testes Locais" :
                "Entrega Contínua e Configuração CI/CD"
              }`, "info");
            }}
            isRunning={isSimulating}
            onRunSimulation={runFullPipelineSimulation}
            onResetSimulation={handleResetSimulation}
            hasSaaS={!!selectedProject}
          />

          {!selectedProject ? (
            <SaaSPlannerForm
              onSubmit={handleCreateSaaS}
              isLoading={isLoading}
              hasAPIKey={hasAPIKey}
              onSelectTemplate={(idx) => handleSelectTemplate(idx)}
            />
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Dynamic View of Specific SaaS Steps details */}
              <SaaSDetailsViewer
                project={selectedProject}
                activatedStep={activatedStep}
              />

              {/* Informative quick switch trigger button to trigger another idea formulation */}
              <div className="flex justify-between items-center bg-gray-100/50 p-4 rounded-xl border border-gray-200/50">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="text-xs text-gray-600">
                    Deseja planejar um conceito de negócio totalmente diferente?
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedProject(null);
                    addLog("Carregando formulário para nova ideia...", "info");
                  }}
                  className="px-4 py-1.5 bg-white border border-gray-200 hover:border-indigo-300 text-indigo-700 hover:text-indigo-800 font-sans font-semibold text-xs rounded-lg transition-all shadow-xs cursor-pointer"
                  id="reset-to-form-btn"
                >
                  Novo SaaS
                </button>
              </div>
            </div>
          )}

          {/* Active Build Console Logs Terminal */}
          <TerminalSimulator
            logs={logs}
            onClear={clearLogs}
            isRunning={isSimulating}
          />
        </div>
      </main>
    </div>
  );
}
