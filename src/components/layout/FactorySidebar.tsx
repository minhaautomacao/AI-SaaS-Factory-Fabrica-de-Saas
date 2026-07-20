import React from 'react';
import { LayoutGrid, Activity, ScrollText, Sparkles, ChevronRight, Circle } from 'lucide-react';
import type { Workspace } from '../../types';

type View = 'workspaces' | 'workspace-detail' | 'credentials' | 'monitor' | 'logs' | 'planner';

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onSelectWorkspace: (w: Workspace) => void;
}

const STATUS_COLOR: Record<string, string> = {
  ativo: 'text-emerald-500',
  configurando: 'text-amber-500',
  pausado: 'text-gray-400',
  encerrado: 'text-red-400',
};

const NAV = [
  { id: 'workspaces' as View, label: 'Workspaces', icon: LayoutGrid },
  { id: 'monitor' as View, label: 'Monitor', icon: Activity },
  { id: 'logs' as View, label: 'Logs', icon: ScrollText },
  { id: 'planner' as View, label: 'Criar SaaS', icon: Sparkles },
];

export default function FactorySidebar({ view, onNavigate, workspaces, selectedWorkspace, onSelectWorkspace }: Props) {
  return (
    <aside className="w-64 shrink-0 bg-white border border-gray-200 rounded-2xl p-4 h-fit sticky top-24 space-y-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">Fábrica</p>
        <nav className="space-y-0.5">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Módulos específicos de cliente (ex: floricultura) não ficam mais
          hardcoded aqui — cada cliente tem seu próprio painel no repositório
          dele. Ver docs/GENERIC_CORE_BACKLOG.md para o registro dinâmico
          de módulos por segmento, ainda não implementado. */}

      {workspaces.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 px-1">SaaS Ativos</p>
          <div className="space-y-0.5">
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => { onSelectWorkspace(w); onNavigate('workspace-detail'); }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedWorkspace?.id === w.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Circle className={`w-2 h-2 shrink-0 fill-current ${STATUS_COLOR[w.status] ?? 'text-gray-300'}`} />
                <span className="truncate flex-1 text-left">{w.nome}</span>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
