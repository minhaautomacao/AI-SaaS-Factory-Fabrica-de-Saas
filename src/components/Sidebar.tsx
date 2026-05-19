import React from "react";
import { SaaSProject } from "../types";
import { Plus, LayoutGrid, Calendar, HelpCircle, HardDrive, ChevronRight, Check } from "lucide-react";

interface SidebarProps {
  projects: SaaSProject[];
  selectedProject: SaaSProject | null;
  onSelectProject: (p: SaaSProject) => void;
  onNewProject: () => void;
  hasAPIKey: boolean;
  isLoading: boolean;
}

export default function Sidebar({
  projects,
  selectedProject,
  onSelectProject,
  onNewProject,
  hasAPIKey,
  isLoading
}: SidebarProps) {
  return (
    <div className="w-full lg:w-80 bg-white border border-gray-100 rounded-2xl p-5 shrink-0 flex flex-col justify-between h-auto lg:h-[calc(100vh-120px)] lg:sticky lg:top-[100px]">
      <div className="space-y-6">
        {/* Header with quick creation action */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-indigo-600" />
            <span className="font-sans font-bold text-gray-950 tracking-tight">Projetos Ativos</span>
          </div>

          <button
            onClick={onNewProject}
            disabled={isLoading}
            className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 text-gray-400 rounded-lg transition-all cursor-pointer"
            title="Surgir Nova Ideia de SaaS"
            id="new-project-btn"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Project Navigation List */}
        <div className="space-y-2.5 max-h-[220px] lg:max-h-[360px] overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <div className="text-center py-8 px-2 border border-dashed border-gray-100 rounded-xl">
              <span className="text-xs font-mono text-gray-400">Nenhum plano ativo.</span>
              <p className="text-[10px] text-gray-500 mt-1">Crie um planejamento no formulário integrado.</p>
            </div>
          ) : (
            projects.map((p) => {
              const isActive = selectedProject?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
                    isActive
                      ? "bg-indigo-50/50 border-indigo-200 text-indigo-950 font-semibold"
                      : "bg-white border-gray-100 hover:border-gray-200 text-gray-700"
                  }`}
                  id={`project-side-btn-${p.id}`}
                >
                  <div className="truncate pr-2">
                    <span className="text-xs font-sans tracking-tight block truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {p.techStack.aiTools[0] || "Gemini 3.5"}
                    </span>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isActive ? "text-indigo-600 translate-x-0.5" : "text-gray-300"}`} />
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Workspace Status and Credentials Indicator */}
      <div className="pt-5 border-t border-gray-100 mt-6 space-y-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider block uppercase">Serviços Integrados</span>
          <div className="mt-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>VS Code + CloudCode</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Conectado</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${hasAPIKey ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                <span>Google AI Studio</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">
                {hasAPIKey ? "Chave Ativa" : "Chave Demo"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-gray-600 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Antigravity Router</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-400">Canal Ativo</span>
            </div>
          </div>
        </div>

        {/* Informative block about workflow constraints */}
        <div className="bg-gray-50/50 p-3.5 border border-gray-100 rounded-xl text-[10px] text-gray-500 leading-normal">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-500 mb-1 inline mr-1" />
          O <strong>AI SaaS Factory</strong> opera de forma segura e server-side. Chaves de API configuradas no painel <strong>Settings &gt; Secrets</strong> nunca são exportadas para o navegador.
        </div>
      </div>
    </div>
  );
}
