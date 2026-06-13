import React, { useEffect, useState } from 'react';

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
  canal: string;
  criado_em: string;
}

const STATUS_LABEL: Record<string, string> = {
  novo: 'NOVO',
  confirmado: 'CONFIRMADO',
  preparando: 'PREPARANDO',
  pronto: 'PRONTO',
  entregue: 'ENTREGUE',
};

const STATUS_BG: Record<string, string> = {
  novo: 'bg-blue-600',
  confirmado: 'bg-amber-500',
  preparando: 'bg-orange-500',
  pronto: 'bg-emerald-600',
  entregue: 'bg-gray-500',
};

export default function ProducaoScreen() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [agora, setAgora] = useState(new Date());

  const carregar = async () => {
    try {
      const res = await fetch('/api/floricultura/pedidos?status=ativo');
      const data = await res.json();
      setPedidos(data.pedidos ?? []);
    } catch {
      setPedidos([]);
    }
  };

  useEffect(() => {
    carregar();
    const dataInterval = setInterval(carregar, 30_000); // atualiza a cada 30s
    const clockInterval = setInterval(() => setAgora(new Date()), 1_000);
    return () => { clearInterval(dataInterval); clearInterval(clockInterval); };
  }, []);

  const ativos = pedidos.filter(p => p.status !== 'entregue');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="text-3xl">🌸</span>
          <div>
            <h1 className="text-2xl font-black tracking-tight">ENEMEOP FLORES</h1>
            <p className="text-gray-400 text-sm">Painel de Produção — atualiza a cada 30s</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-bold text-emerald-400">
            {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-gray-400 text-sm">
            {agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Contador */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {(['novo', 'confirmado', 'preparando', 'pronto'] as const).map(status => (
          <div key={status} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-white">
              {pedidos.filter(p => p.status === status).length}
            </p>
            <p className={`text-xs font-bold mt-1 ${STATUS_BG[status].replace('bg-', 'text-').replace('-600', '-400').replace('-500', '-400')}`}>
              {STATUS_LABEL[status]}
            </p>
          </div>
        ))}
      </div>

      {/* Pedidos */}
      {ativos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-600">
          <span className="text-5xl mb-4">🌸</span>
          <p className="text-lg font-medium">Nenhum pedido ativo no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ativos.map((p) => (
            <div
              key={p.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Foto do arranjo */}
              <div className="relative h-44 bg-gray-800 flex items-center justify-center">
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.produto} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl">🌸</span>
                )}
                <div className={`absolute top-3 left-3 ${STATUS_BG[p.status]} text-white text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest`}>
                  {STATUS_LABEL[p.status]}
                </div>
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                  #{String(p.numero).padStart(3, '0')}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 space-y-3">
                <div>
                  <p className="font-bold text-white text-base leading-tight">{p.produto}</p>
                  <p className="text-emerald-400 font-bold text-lg">R$ {p.valor.toFixed(2)}</p>
                </div>

                <div className="border-t border-gray-800 pt-3 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-16 text-xs">Cliente</span>
                    <span className="text-white font-semibold">{p.cliente_nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-16 text-xs">Fone</span>
                    <span className="text-gray-300">{p.cliente_telefone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 w-16 text-xs shrink-0">Endereço</span>
                    <span className="text-gray-300 text-xs leading-relaxed">{p.endereco}{p.bairro ? ` — ${p.bairro}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-16 text-xs">Entrega</span>
                    <span className="text-amber-400 font-medium text-xs">
                      {new Date(p.data_entrega).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-16 text-xs">Canal</span>
                    <span className="text-gray-400 text-xs capitalize">{p.canal}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
