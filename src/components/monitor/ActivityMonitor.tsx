import React, { useState, useEffect, useRef } from 'react';
import { Activity, RefreshCw, Pause, Play } from 'lucide-react';
import type { ActivityMetric } from '../../types';

export default function ActivityMonitor() {
  const [data, setData] = useState<ActivityMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [aovivo, setAovivo] = useState(true);
  const [ultimaAtt, setUltimaAtt] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const carregar = async () => {
    try {
      const res = await fetch('/api/monitor/activity');
      const json = await res.json();
      setData(json.activity ?? []);
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
  }, [aovivo]);

  const totalEventos = data.reduce((s, d) => s + d.eventos, 0);
  const totalErros = data.reduce((s, d) => s + d.erros, 0);
  const maxEventos = Math.max(...data.map(d => d.eventos), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-800">Atividade — últimas 24h</h3>
        </div>
        <div className="flex items-center gap-2">
          {ultimaAtt && <span className="text-[11px] text-gray-400">{ultimaAtt.toLocaleTimeString()}</span>}
          <button onClick={() => setAovivo(v => !v)} className={`p-1.5 rounded-lg transition-colors ${aovivo ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-100 text-gray-400'}`}>
            {aovivo ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button onClick={carregar} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">{totalEventos}</p>
          <p className="text-xs text-indigo-500 mt-0.5">Eventos</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{totalErros}</p>
          <p className="text-xs text-red-400 mt-0.5">Erros</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            {totalEventos > 0 ? Math.round(((totalEventos - totalErros) / totalEventos) * 100) : 100}%
          </p>
          <p className="text-xs text-emerald-500 mt-0.5">Sucesso</p>
        </div>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center text-xs text-gray-400">Carregando...</div>
      ) : (
        <div className="flex items-end gap-0.5 h-24 w-full">
          {data.map((d) => (
            <div key={d.hora} className="flex-1 flex flex-col items-center gap-0.5" title={`${d.hora}: ${d.eventos} eventos, ${d.erros} erros`}>
              <div className="w-full relative flex flex-col justify-end" style={{ height: '80px' }}>
                <div
                  className={`w-full rounded-sm transition-all ${d.erros > 0 ? 'bg-red-200' : 'bg-indigo-200'}`}
                  style={{ height: `${Math.max((d.eventos / maxEventos) * 80, d.eventos > 0 ? 4 : 0)}px` }}
                />
              </div>
              {parseInt(d.hora) % 4 === 0 && (
                <span className="text-[9px] text-gray-300">{d.hora.slice(0, 2)}h</span>
              )}
            </div>
          ))}
        </div>
      )}

      {totalEventos === 0 && !loading && (
        <p className="text-xs text-center text-gray-400 py-2">Nenhuma atividade nas últimas 24h</p>
      )}
    </div>
  );
}
