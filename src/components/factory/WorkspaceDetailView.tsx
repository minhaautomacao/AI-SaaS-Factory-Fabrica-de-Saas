import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, CheckCircle2, AlertCircle, PauseCircle } from 'lucide-react';
import type { Workspace, WorkspaceCredential } from '../../types';
import CredentialCard from '../credentials/CredentialCard';
import CredentialSetup from '../credentials/CredentialSetup';

const TIPOS_CREDENTIAL = ['whatsapp', 'meta', 'mercadopago', 'stripe', 'openbanking', 'email'];

const STATUS_BADGE: Record<string, { cor: string; label: string; icon: React.ReactNode }> = {
  ativo:        { cor: 'bg-emerald-100 text-emerald-700', label: 'Ativo', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  configurando: { cor: 'bg-amber-100 text-amber-700', label: 'Configurando', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  pausado:      { cor: 'bg-gray-100 text-gray-600', label: 'Pausado', icon: <PauseCircle className="w-3.5 h-3.5" /> },
  encerrado:    { cor: 'bg-red-100 text-red-700', label: 'Encerrado', icon: null },
};

interface Props {
  workspace: Workspace;
  onBack: () => void;
}

export default function WorkspaceDetailView({ workspace, onBack }: Props) {
  const [credentials, setCredentials] = useState<WorkspaceCredential[]>([]);
  const [setupTab, setSetupTab] = useState<string | null>(null);

  const loadCredentials = () => {
    fetch(`/api/workspaces/${workspace.id}/credentials`)
      .then(r => r.json())
      .then(d => setCredentials(d.credentials ?? []));
  };

  useEffect(() => { loadCredentials(); }, [workspace.id]);

  const badge = STATUS_BADGE[workspace.status] ?? STATUS_BADGE.configurando;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">{workspace.nome}</h2>
            <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.cor}`}>
              {badge.icon}{badge.label}
            </span>
          </div>
          {workspace.segmento && <p className="text-xs text-gray-400 mt-0.5 capitalize">{workspace.segmento}</p>}
        </div>
        <button
          onClick={() => setSetupTab('whatsapp')}
          className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configurar
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">Credenciais de Integração</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIPOS_CREDENTIAL.map(tipo => {
            const cred = credentials.find(c => c.tipo === tipo);
            return (
              <React.Fragment key={tipo}>
                <CredentialCard
                  tipo={tipo}
                  credential={cred}
                  onClick={() => setSetupTab(tipo)}
                />
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {workspace.descricao && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Descrição</h3>
          <p className="text-sm text-gray-600">{workspace.descricao}</p>
        </div>
      )}

      {workspace.owner_email && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Operador</h3>
          <p className="text-sm text-gray-600">{workspace.owner_email}</p>
        </div>
      )}

      {setupTab && (
        <CredentialSetup
          workspace={workspace}
          initialTab={setupTab}
          onClose={() => setSetupTab(null)}
          onSaved={loadCredentials}
        />
      )}
    </div>
  );
}
