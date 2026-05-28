import React from 'react';
import { CheckCircle2, AlertCircle, Clock, MessageCircle, Share2, CreditCard, Landmark, Mail, Zap } from 'lucide-react';
import type { WorkspaceCredential } from '../../types';

const TIPO_CONFIG: Record<string, { label: string; icon: React.ReactNode; cor: string }> = {
  whatsapp:    { label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" />, cor: 'text-green-600 bg-green-50' },
  meta:        { label: 'Meta', icon: <Share2 className="w-5 h-5" />, cor: 'text-blue-600 bg-blue-50' },
  mercadopago: { label: 'Mercado Pago', icon: <CreditCard className="w-5 h-5" />, cor: 'text-sky-600 bg-sky-50' },
  stripe:      { label: 'Stripe', icon: <CreditCard className="w-5 h-5" />, cor: 'text-violet-600 bg-violet-50' },
  openbanking: { label: 'Open Banking', icon: <Landmark className="w-5 h-5" />, cor: 'text-teal-600 bg-teal-50' },
  email:       { label: 'Email', icon: <Mail className="w-5 h-5" />, cor: 'text-orange-600 bg-orange-50' },
  evolution:   { label: 'Evolution API', icon: <Zap className="w-5 h-5" />, cor: 'text-lime-600 bg-lime-50' },
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  ok:       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  erro:     <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  pendente: <Clock className="w-3.5 h-3.5 text-amber-500" />,
};

interface Props {
  tipo: string;
  credential?: WorkspaceCredential;
  onClick: () => void;
}

export default function CredentialCard({ tipo, credential, onClick }: Props) {
  const config = TIPO_CONFIG[tipo] ?? { label: tipo, icon: null, cor: 'text-gray-600 bg-gray-50' };
  const status = credential?.teste_status ?? null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all text-left w-full"
    >
      <div className={`p-2 rounded-lg ${config.cor}`}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{config.label}</p>
        <p className="text-xs text-gray-400">{credential ? 'Configurado' : 'Não configurado'}</p>
      </div>
      {status && (
        <div className="flex items-center gap-1">
          {STATUS_ICON[status]}
        </div>
      )}
      {!credential && (
        <div className="w-2 h-2 rounded-full bg-gray-200" />
      )}
    </button>
  );
}
