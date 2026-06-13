import React, { useEffect, useState } from 'react';
import { ShoppingBag, Phone, MapPin, Clock, RefreshCw, Package } from 'lucide-react';

interface Pedido {
  id: string;
  numero: number;
  cliente_nome: string;
  cliente_telefone: string;
  produto: string;
  valor: number;
  endereco: string;
  bairro?: string;
  data_entrega: string;
  status: 'novo' | 'confirmado' | 'preparando' | 'pronto' | 'entregue';
  foto_url?: string;
  criado_em: string;
  canal: string;
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  pronto: 'Pronto p/ Entrega',
  entregue: 'Entregue',
};

const STATUS_COLOR: Record<string, string> = {
  novo: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmado: 'bg-amber-50 text-amber-700 border-amber-200',
  preparando: 'bg-orange-50 text-orange-700 border-orange-200',
  pronto: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  entregue: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function PedidosView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/floricultura/pedidos');
      const data = await res.json();
      setPedidos(data.pedidos ?? []);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregar(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pedidos — Enemeop Flores</h2>
          <p className="text-xs text-gray-500 mt-0.5">{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} registrado{pedidos.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/producao', '_blank')}
            className="flex items-center gap-1.5 text-xs bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg font-medium transition-colors"
          >
            <Package className="w-3.5 h-3.5" />
            Abrir Tela de Produção ↗
          </button>
          <button
            onClick={carregar}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mr-2" />
          Carregando pedidos...
        </div>
      ) : pedidos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm gap-2">
          <ShoppingBag className="w-8 h-8 opacity-40" />
          <p>Nenhum pedido fechado ainda.</p>
          <p className="text-xs">Os pedidos dos agentes aparecerão aqui automaticamente.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pedidos.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex gap-4">
              {/* Foto do arranjo */}
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-rose-50 flex items-center justify-center border border-rose-100">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.produto} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🌸</span>
                )}
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-gray-400">#{String(p.numero).padStart(3, '0')}</span>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">{p.produto}</h3>
                    <p className="text-emerald-600 font-bold text-sm">R$ {p.valor.toFixed(2)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${STATUS_COLOR[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-900">{p.cliente_nome}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    {p.cliente_telefone}
                  </div>
                  <div className="flex items-center gap-1 col-span-2">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="truncate">{p.endereco}{p.bairro ? ` — ${p.bairro}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    Entrega: {new Date(p.data_entrega).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-gray-400 capitalize">via {p.canal}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
