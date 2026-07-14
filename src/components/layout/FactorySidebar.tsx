import React from 'react';
import { LayoutGrid, Activity, ScrollText, Sparkles, ChevronRight, Circle, ShoppingBag, Monitor, Inbox } from 'lucide-react';
import type { Workspace } from '../../types';

type View = 'workspaces' | 'workspace-detail' | 'credentials' | 'monitor' | 'logs' | 'planner' | 'pedidos' | 'atendimento';

interface Props {
  view: View;
  onNavigate: (v: View) => void;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onSelectWorkspace: (w: Workspace) => void;
  floraInboxCount?: number;
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

export default function FactorySidebar({ view, onNavigate, workspaces, selectedWorkspace, onSelectWorkspace, floraInboxCount = 0 }: Props) {
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

      {/* ── Floricultura ─────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-2 px-1">Floricultura</p>
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('pedidos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
              view === 'pedidos'
                ? 'bg-rose-500 text-white shadow-rose-200'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ShoppingBag className="w-5 h-5 shrink-0" />
            Pedidos
          </button>

          <button
            onClick={() => onNavigate('atendimento')}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-sm ${
              view === 'atendimento'
                ? 'bg-indigo-600 text-white shadow-indigo-200'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <span className="flex items-center gap-3"><Inbox className="w-5 h-5 shrink-0" /> Atendimento Flora</span>
            {floraInboxCount > 0 && <span className="text-[10px] bg-amber-500 text-white rounded-full px-1.5 py-0.5">{floraInboxCount}</span>}
          </button>

          <button
            onClick={() => window.open('/producao', '_blank')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-sm"
          >
            <Monitor className="w-5 h-5 shrink-0" />
            Tela de Produção ↗
          </button>
        </div>
      </div>

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
