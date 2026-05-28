import React, { useState, useEffect, useRef } from 'react';
import { ScrollText, RefreshCw, Pause, Play, AlertCircle } from 'lucide-react';
import type { OrchestratorLog } from '../../types';

const AGENTES = ['captacao-leads', 'whatsapp-sdr', 'financeiro', 'logistica', 'conciliacao', 'operacional', 'rastreamento', 'pos-venda', 'marketing', 'inteligencia', 'estoque', 'agente-dev'];

const EVENTO_COR: Record<string, string> = {
  acionado: 'bg-indigo-100 text-indigo-700',
  concluido: 'bg-emerald-100 text-emerald-700',
  erro: 'bg-red-100 text-red-700',
};

const URGENCIA_COR: Record<string, string> = {
  critical: 'bg-red-100 text-red-600',
  normal: 'bg-gray-100 text-gray-600',
  low: 'bg-blue-100 text-blue-600',
};

interface Props {
  full?: boolean;
}

export default function LogsViewer({ full }: Props) {
  const [logs, setLogs] = useState<OrchestratorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [aovivo, setAovivo] = useState(true);
  const [filtroAgente, setFiltroAgente] = useState('');
  const [ultimaAtt, setUltimaAtt] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const carregar = async () => {
    const params = new URLSearchParams({ limit: full ? '100' : '50' });
    if (filtroAgente) params.set('agente', filtroAgente);
    try {
      const res = await fetch(`/api/monitor/logs?${params}`);
      const json = await res.json();
      setLogs(json.logs ?? []);
      setUltimaAtt(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    if (aovivo) {
      intervalRef.current = setInterval(carregar, 10000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [aovivo, filtroAgente]);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-800">Logs do Orquestrador</h3>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtroAgente}
            onChange={e => setFiltroAgente(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300"
          >
            <option value="">Todos os agentes</option>
            {AGENTES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {ultimaAtt && <span className="text-[11px] text-gray-400">{ultimaAtt.toLocaleTimeString()}</span>}
          <button onClick={() => setAovivo(v => !v)} className={`p-1.5 rounded-lg transition-colors ${aovivo ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}>
            {aovivo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={carregar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400">Carregando logs...</div>
      ) : logs.length === 0 ? (
        <div className="py-12 text-center">
          <ScrollText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-xs text-gray-400">Nenhum log encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-2 text-left font-medium text-gray-500">Horário</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Agente</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Evento</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Urgência</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Duração</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Erro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-mono text-gray-500 whitespace-nowrap">
                    {new Date(log.criado_em).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700 whitespace-nowrap">{log.agente}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${EVENTO_COR[log.tipo_evento] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.tipo_evento}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {log.urgencia && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${URGENCIA_COR[log.urgencia] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.urgencia}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                    {log.duracao_ms != null ? `${log.duracao_ms}ms` : '—'}
                  </td>
                  <td className="px-4 py-2.5">
                    {log.erro && (
                      <div className="flex items-center gap-1 text-red-500" title={log.erro}>
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-[200px]">{log.erro}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
