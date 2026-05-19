import React, { useState } from "react";
import { SaaSProject } from "../types";
import { Cpu, Terminal, Database, Code, Copy, Check, CheckCircle2, ChevronRight, FileCode, Clipboard, ShieldCheck } from "lucide-react";

interface SaaSDetailsViewerProps {
  project: SaaSProject;
  activatedStep: number;
}

export default function SaaSDetailsViewer({ project, activatedStep }: SaaSDetailsViewerProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
      <div className="border-b border-gray-100 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase font-bold">
              ESTÁGIO ATIVO: {activatedStep === 1 ? "INTERFACE" : activatedStep === 2 ? "ORQUESTRADOR" : activatedStep === 3 ? "ARQUITETURA" : activatedStep === 4 ? "EXECUÇÃO DE CODIGO" : "PIPELINE GITHUB"}
            </span>
            <h2 className="text-2xl font-sans font-bold text-gray-950 tracking-tight mt-2">
              {project.name}
            </h2>
            <p className="text-sm text-gray-500 italic mt-0.5">
              "{project.tagline}"
            </p>
          </div>
          <div className="text-right sm:self-start">
            <span className="text-xs font-mono text-zinc-400 block">Identificador Único</span>
            <span className="text-xs font-mono text-zinc-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
              {project.id.slice(0, 8)}...
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mt-4">
          {project.description}
        </p>
      </div>

      {/* Focus based on Activated Step */}
      <div className="space-y-8">
        {/* Step 1 & 2 Focus: Stack & Modules */}
        {(activatedStep === 1 || activatedStep === 2) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-100/30">
                <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm mb-2">
                  <Code className="w-4 h-4" />
                  <span>Frontend</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.frontend.map((f, i) => (
                    <span key={i} className="text-xs font-mono bg-white text-blue-700 px-2 py-0.5 rounded border border-blue-50">
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-purple-50/40 rounded-xl border border-purple-100/30">
                <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm mb-2">
                  <Cpu className="w-4 h-4" />
                  <span>Backend</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.backend.map((b, i) => (
                    <span key={i} className="text-xs font-mono bg-white text-purple-700 px-2 py-0.5 rounded border border-purple-50">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-100/30">
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm mb-2">
                  <Database className="w-4 h-4" />
                  <span>Banco de Dados</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.database.map((d, i) => (
                    <span key={i} className="text-xs font-mono bg-white text-amber-700 px-2 py-0.5 rounded border border-amber-50">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/30">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Soluções IA</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {project.techStack.aiTools.map((a, i) => (
                    <span key={i} className="text-xs font-mono bg-white text-emerald-700 px-2 py-0.5 rounded border border-emerald-50">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modules Expansion Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 tracking-wider font-sans uppercase mb-4">
                Módulos de Negócio Estruturados (Orquestração de Arquitetura)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {project.modules.map((m, idx) => (
                  <div key={idx} className="bg-gray-50/40 rounded-xl border border-gray-100 p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-500 bg-indigo-50/50 px-2 py-0.5 rounded">
                        MÓDULO 0{idx + 1}
                      </span>
                      <h4 className="text-sm font-semibold text-gray-900 mt-2 mb-1">
                        {m.name}
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed mb-4">
                        {m.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-mono text-zinc-400 block mb-1.5 uppercase tracking-wide font-semibold">Arquivos de Desenvolvimento</span>
                      <div className="space-y-1">
                        {m.files.map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
                            <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 & 4 Focus: Structural Prompts & Architecture */}
        {(activatedStep === 3 || activatedStep === 4) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-800 tracking-wider uppercase font-sans">
                Diretivas Estruturais de Geração (Google AI Studio Tools)
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-gray-950 font-mono">1. Diretivas de Sistema (Backend)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(project.structuralPrompts.systemInstruction, "system")}
                    className="p-1 hover:bg-white rounded text-zinc-400 hover:text-gray-700 transition-colors"
                    title="Copiar prompt"
                  >
                    {copiedSection === "system" ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <blockquote className="text-xs text-zinc-600 font-mono leading-relaxed whitespace-pre-line">
                    {project.structuralPrompts.systemInstruction}
                  </blockquote>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-gray-950 font-mono">2. Design & Layout (Frontend UI)</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(project.structuralPrompts.uiPrompt, "ui")}
                    className="p-1 hover:bg-white rounded text-zinc-400 hover:text-gray-700 transition-colors"
                    title="Copiar prompt"
                  >
                    {copiedSection === "ui" ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <blockquote className="text-xs text-zinc-600 font-mono leading-relaxed whitespace-pre-line">
                    {project.structuralPrompts.uiPrompt}
                  </blockquote>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-gray-950 font-mono">3. Banco de Dados & Coleções</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(project.structuralPrompts.databaseSchema, "db")}
                    className="p-1 hover:bg-white rounded text-zinc-400 hover:text-gray-700 transition-colors"
                    title="Copiar prompt"
                  >
                    {copiedSection === "db" ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <blockquote className="text-xs text-zinc-600 font-mono leading-relaxed whitespace-pre-wrap">
                    {project.structuralPrompts.databaseSchema}
                  </blockquote>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex flex-col h-[280px]">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-gray-950 font-mono">4. Estratégia de Testes de Qualidade</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(project.structuralPrompts.testsPrompt, "test")}
                    className="p-1 hover:bg-white rounded text-zinc-400 hover:text-gray-700 transition-colors"
                    title="Copiar prompt"
                  >
                    {copiedSection === "test" ? <Check className="w-4 h-4 text-emerald-500" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-1">
                  <blockquote className="text-xs text-zinc-600 font-mono leading-relaxed whitespace-pre-line">
                    {project.structuralPrompts.testsPrompt}
                  </blockquote>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5 Focus: CI/CD Pipeline & GitHub Repos */}
        {activatedStep === 5 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <h4 className="text-xs font-mono font-bold text-indigo-600 uppercase">CONFIGURAÇÃO DE REPOSITÓRIO</h4>
                <p className="text-sm font-semibold text-gray-950 mt-1">Condução de Versionamento e Entrega Contínua</p>
              </div>
              <button
                onClick={() => copyToClipboard(project.githubActions, "github")}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium max-sm:w-full justify-center cursor-pointer transition-colors"
              >
                {copiedSection === "github" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Workflow do GitHub</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative">
              <span className="absolute top-3.5 right-4 font-mono text-[9px] text-zinc-500 font-semibold bg-gray-100 border border-gray-200 px-1.5 rounded uppercase">YAML</span>
              <pre className="text-xs font-mono bg-zinc-950 text-emerald-400 p-5 rounded-2xl overflow-x-auto border border-zinc-900 leading-relaxed font-semibold">
                <code>{project.githubActions}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
