import React, { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, PauseCircle, XCircle, ChevronRight, Building2 } from 'lucide-react';
import type { Workspace } from '../../types';
import CreateWorkspaceModal from './CreateWorkspaceModal';

interface Props {
  workspaces: Workspace[];
  onSelect: (w: Workspace) => void;
  onRefresh: () => void;
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  ativo: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  configurando: <AlertCircle className="w-4 h-4 text-amber-500" />,
  pausado: <PauseCircle className="w-4 h-4 text-gray-400" />,
  encerrado: <XCircle className="w-4 h-4 text-red-400" />,
};

const STATUS_LABEL: Record<string, string> = {
  ativo: 'Ativo', configurando: 'Configurando', pausado: 'Pausado', encerrado: 'Encerrado',
};

export default function WorkspacesView({ workspaces, onSelect, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Workspaces</h2>
          <p className="text-sm text-gray-500 mt-0.5">{workspaces.length} SaaS {workspaces.length === 1 ? 'cadastrado' : 'cadastrados'}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo SaaS
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
          <Building2 className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">Nenhum SaaS cadastrado ainda</p>
          <p className="text-xs text-gray-400 mt-1">Clique em "Novo SaaS" para começar</p>
          <button onClick={() => setShowModal(true)} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            Criar primeiro SaaS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workspaces.map((w) => {
            const pct = w.credentials_count > 0 ? Math.round((w.credentials_configuradas / w.credentials_count) * 100) : 0;
            return (
              <button
                key={w.id}
                onClick={() => onSelect(w)}
                className="text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {STATUS_ICON[w.status]}
                    <span className="text-xs font-medium text-gray-500">{STATUS_LABEL[w.status]}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>

                <h3 className="font-semibold text-gray-900 truncate">{w.nome}</h3>
                {w.segmento && <p className="text-xs text-gray-400 mt-0.5 capitalize">{w.segmento}</p>}
                {w.descricao && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{w.descricao}</p>}

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-gray-400">Credenciais</span>
                    <span className="text-[11px] font-medium text-gray-600">{w.credentials_configuradas}/{w.credentials_count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-400' : pct > 0 ? 'bg-amber-400' : 'bg-gray-200'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {showModal && <CreateWorkspaceModal onClose={() => setShowModal(false)} onCreated={onRefresh} />}
    </div>
  );
}
