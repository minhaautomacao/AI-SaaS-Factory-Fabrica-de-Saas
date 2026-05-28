import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import type { Workspace, WorkspaceCredential } from '../../types';

interface Props {
  workspace: Workspace;
  initialTab?: string;
  onClose: () => void;
  onSaved: () => void;
}

type TesteStatus = 'idle' | 'testando' | 'ok' | 'erro';

const TABS: Array<{ id: string; label: string; campos: Array<{ key: string; label: string; placeholder: string; tipo?: string }>; instrucoes: string; link?: string }> = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    instrucoes: 'Configure a Evolution API: acesse seu painel, copie a API Key e a URL base.',
    link: 'https://doc.evolution-api.com',
    campos: [
      { key: 'api_url', label: 'URL da Evolution API', placeholder: 'https://evolution.suaempresa.com' },
      { key: 'api_key', label: 'API Key', placeholder: 'sua-api-key', tipo: 'password' },
      { key: 'instance', label: 'Nome da Instância', placeholder: 'floricultura-prod' },
    ],
  },
  {
    id: 'meta',
    label: 'Meta',
    instrucoes: 'Acesse business.facebook.com → Configurações → API do WhatsApp Business.',
    link: 'https://business.facebook.com',
    campos: [
      { key: 'access_token', label: 'Access Token', placeholder: 'EAABs...', tipo: 'password' },
      { key: 'phone_number_id', label: 'Phone Number ID', placeholder: '1234567890' },
      { key: 'verify_token', label: 'Verify Token (webhook)', placeholder: 'meu-verify-token' },
    ],
  },
  {
    id: 'mercadopago',
    label: 'Mercado Pago',
    instrucoes: 'Acesse mercadopago.com.br → Seu negócio → Credenciais.',
    link: 'https://www.mercadopago.com.br/developers/panel',
    campos: [
      { key: 'access_token', label: 'Access Token', placeholder: 'APP_USR-...', tipo: 'password' },
      { key: 'public_key', label: 'Public Key', placeholder: 'APP_USR-...' },
    ],
  },
  {
    id: 'stripe',
    label: 'Stripe',
    instrucoes: 'Acesse dashboard.stripe.com → Desenvolvedores → Chaves de API.',
    link: 'https://dashboard.stripe.com/apikeys',
    campos: [
      { key: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...', tipo: 'password' },
      { key: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { key: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...', tipo: 'password' },
    ],
  },
  {
    id: 'openbanking',
    label: 'Open Banking',
    instrucoes: 'Configure a integração bancária para conciliação automática de extratos.',
    campos: [
      { key: 'client_id', label: 'Client ID', placeholder: 'client-id' },
      { key: 'client_secret', label: 'Client Secret', placeholder: 'client-secret', tipo: 'password' },
      { key: 'bank_code', label: 'Código do Banco', placeholder: '001 (Banco do Brasil), 341 (Itaú)...' },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    instrucoes: 'Configure o Resend para envio de emails transacionais.',
    link: 'https://resend.com/api-keys',
    campos: [
      { key: 'api_key', label: 'Resend API Key', placeholder: 're_...', tipo: 'password' },
      { key: 'from_email', label: 'Email remetente', placeholder: 'noreply@seudominio.com' },
    ],
  },
];

export default function CredentialSetup({ workspace, initialTab = 'whatsapp', onClose, onSaved }: Props) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, TesteStatus>>({});
  const [salvando, setSalvando] = useState(false);
  const [existentes, setExistentes] = useState<WorkspaceCredential[]>([]);

  useEffect(() => {
    fetch(`/api/workspaces/${workspace.id}/credentials`)
      .then(r => r.json())
      .then(d => setExistentes(d.credentials ?? []));
  }, [workspace.id]);

  const tab = TABS.find(t => t.id === activeTab)!;

  const salvarCredencial = async (chave: string, valor: string) => {
    setSalvando(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: activeTab, chave, valor }),
      });
    } finally {
      setSalvando(false);
    }
  };

  const testarConexao = async () => {
    setStatus(s => ({ ...s, [activeTab]: 'testando' }));
    // Salva todos os campos preenchidos antes de testar
    const campos = tab.campos.filter(c => valores[c.key]?.trim());
    for (const campo of campos) {
      await salvarCredencial(campo.key, valores[campo.key]);
    }

    // Busca o ID da credencial principal para testar
    const cred = existentes.find(c => c.tipo === activeTab);
    if (cred) {
      const res = await fetch(`/api/workspaces/${workspace.id}/credentials/${cred.id}/test`, { method: 'POST' });
      const data = await res.json();
      setStatus(s => ({ ...s, [activeTab]: data.ok ? 'ok' : 'erro' }));
    } else {
      setStatus(s => ({ ...s, [activeTab]: 'ok' }));
    }
    onSaved();
  };

  const temCamposPreenchidos = tab.campos.some(c => valores[c.key]?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Configurar Credenciais</h2>
            <p className="text-xs text-gray-500">{workspace.nome}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex gap-1 px-6 pt-4 overflow-x-auto border-b border-gray-100 pb-0">
          {TABS.map(t => {
            const st = status[t.id];
            const temDados = existentes.some(c => c.tipo === t.id);
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 text-xs font-medium rounded-t-lg whitespace-nowrap transition-colors flex items-center gap-1.5 border-b-2 -mb-px ${
                  activeTab === t.id ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
                {st === 'ok' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                {st === 'erro' && <AlertCircle className="w-3 h-3 text-red-500" />}
                {!st && temDados && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
            <div className="flex-1">
              <p className="text-xs text-blue-700">{tab.instrucoes}</p>
            </div>
            {tab.link && (
              <a href={tab.link} target="_blank" rel="noreferrer" className="shrink-0 text-blue-600 hover:text-blue-800">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {tab.campos.map(campo => (
            <div key={campo.key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{campo.label}</label>
              <input
                type={campo.tipo ?? 'text'}
                value={valores[campo.key] ?? ''}
                onChange={e => setValores(v => ({ ...v, [campo.key]: e.target.value }))}
                placeholder={campo.placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ))}
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Fechar</button>
          <button
            onClick={testarConexao}
            disabled={!temCamposPreenchidos || salvando || status[activeTab] === 'testando'}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {status[activeTab] === 'testando' ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Testando...</>
            ) : status[activeTab] === 'ok' ? (
              <><CheckCircle2 className="w-4 h-4" />Conexão validada</>
            ) : status[activeTab] === 'erro' ? (
              <><AlertCircle className="w-4 h-4" />Erro — tentar novamente</>
            ) : (
              'Salvar e testar conexão'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
