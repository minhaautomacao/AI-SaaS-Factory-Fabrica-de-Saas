import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, Clock, MessageCircle, RefreshCw, Send, UserCheck } from 'lucide-react';

type Canal = 'instagram' | 'facebook';
type ConversaStatus = 'flora_atendendo' | 'aguardando_humano' | 'humano_atendendo' | 'aguardando_cliente' | 'concluida' | 'erro_envio';

type Mensagem = {
  role: 'user' | 'assistant';
  content: string;
  ts?: string;
  autor_tipo?: 'flora' | 'humano' | 'cliente' | 'sistema';
  autor_id?: string;
  status?: string;
};

type Conversa = {
  id: string;
  canal_id: string;
  canal: Canal;
  fase: string;
  historico: Mensagem[];
  pedido_info: Record<string, unknown> | null;
  nome_cliente: string | null;
  modo_atendimento?: 'flora' | 'humano';
  status_atendimento?: ConversaStatus;
  motivo_handoff?: string | null;
  handoff_em?: string | null;
  resumo?: string | null;
  proximo_passo?: string | null;
  atendente_id?: string | null;
  assumido_em?: string | null;
  atualizado_em?: string | null;
};

const AUTH_HEADER = () => ({ Authorization: `Bearer ${localStorage.getItem('saas_factory_token') ?? ''}` });
const ATENDENTE_ID = 'dashboard-enemeop';

const STATUS_LABEL: Record<string, string> = {
  flora_atendendo: 'Flora atendendo',
  aguardando_humano: 'Aguardando humano',
  humano_atendendo: 'Humano atendendo',
  aguardando_cliente: 'Aguardando cliente',
  concluida: 'Concluída',
  erro_envio: 'Erro no envio',
};

function formatarHora(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function tempoEspera(value?: string | null) {
  if (!value) return '—';
  const min = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}min`;
}

function ultimaMensagem(c: Conversa) {
  return c.historico?.[c.historico.length - 1]?.content ?? '';
}

export default function FloraInboxView() {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [selecionada, setSelecionada] = useState<Conversa | null>(null);
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    try {
      const res = await fetch('/api/flora/conversas', { headers: AUTH_HEADER() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Erro ao carregar conversas');
      setConversas(data.conversas ?? []);
      setSelecionada((atual) => {
        if (!atual) return data.conversas?.[0] ?? null;
        return data.conversas?.find((c: Conversa) => c.id === atual.id) ?? atual;
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar inbox');
    }
  };

  useEffect(() => {
    carregar();
    const timer = window.setInterval(carregar, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const selecionadaAtual = useMemo(
    () => conversas.find(c => c.id === selecionada?.id) ?? selecionada,
    [conversas, selecionada]
  );

  const acao = async (tipo: 'assumir' | 'devolver' | 'concluir') => {
    if (!selecionadaAtual) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(`/api/flora/conversas/${selecionadaAtual.id}/${tipo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AUTH_HEADER() },
        body: JSON.stringify({ atendente_id: ATENDENTE_ID }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha na ação');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha na ação');
    } finally {
      setLoading(false);
    }
  };

  const enviar = async () => {
    if (!selecionadaAtual || !texto.trim()) return;
    setLoading(true);
    setErro(null);
    const mensagem = texto.trim();
    const idempotencyKey = `${selecionadaAtual.id}:${ATENDENTE_ID}:${Date.now()}:${mensagem.length}`;
    try {
      const res = await fetch(`/api/flora/conversas/${selecionadaAtual.id}/mensagens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...AUTH_HEADER() },
        body: JSON.stringify({ mensagem, atendente_id: ATENDENTE_ID, idempotency_key: idempotencyKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Falha ao enviar mensagem');
      setTexto('');
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao enviar mensagem');
    } finally {
      setLoading(false);
    }
  };

  const podeEnviar = selecionadaAtual?.modo_atendimento === 'humano'
    && selecionadaAtual?.atendente_id === ATENDENTE_ID
    && selecionadaAtual?.status_atendimento !== 'concluida';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Atendimento Flora</h2>
          <p className="text-sm text-gray-500">Inbox humano integrado ao Instagram e Facebook</p>
        </div>
        <button onClick={carregar} className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border bg-white hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {erro && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">{erro}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[650px]">
        <aside className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
            <span className="font-bold text-sm">Conversas</span>
            <span className="text-xs text-gray-500">{conversas.length}</span>
          </div>
          <div className="divide-y max-h-[610px] overflow-y-auto">
            {conversas.map((c) => {
              const status = c.status_atendimento ?? (c.modo_atendimento === 'humano' ? 'humano_atendendo' : 'flora_atendendo');
              const destaque = status === 'aguardando_humano' || status === 'erro_envio';
              return (
                <button
                  key={c.id}
                  onClick={() => setSelecionada(c)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selecionadaAtual?.id === c.id ? 'bg-indigo-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-sm truncate">{c.nome_cliente ?? c.canal_id}</div>
                    {destaque && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="capitalize">{c.canal}</span>
                    <span>•</span>
                    <span>{formatarHora(c.atualizado_em)}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ultimaMensagem(c)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-[11px] px-2 py-1 rounded-full ${destaque ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABEL[status] ?? status}
                    </span>
                    <span className="text-[11px] text-gray-400">{tempoEspera(c.handoff_em ?? c.atualizado_em)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col">
          {!selecionadaAtual ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Selecione uma conversa</div>
          ) : (
            <>
              <header className="p-4 border-b bg-gray-50 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-gray-900">{selecionadaAtual.nome_cliente ?? selecionadaAtual.canal_id}</h3>
                  <p className="text-xs text-gray-500 capitalize">{selecionadaAtual.canal} • fase: {selecionadaAtual.fase ?? '—'}</p>
                  {selecionadaAtual.motivo_handoff && <p className="text-xs text-amber-700 mt-1">Motivo: {selecionadaAtual.motivo_handoff}</p>}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <button disabled={loading} onClick={() => acao('assumir')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold disabled:opacity-50">
                    <UserCheck className="w-4 h-4" /> Assumir
                  </button>
                  <button disabled={loading} onClick={() => acao('devolver')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold disabled:opacity-50">
                    <Bot className="w-4 h-4" /> Devolver para Flora
                  </button>
                  <button disabled={loading} onClick={() => acao('concluir')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold disabled:opacity-50">
                    <CheckCircle2 className="w-4 h-4" /> Concluir
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] flex-1 min-h-0">
                <div className="flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                    {(selecionadaAtual.historico ?? []).map((m, idx) => {
                      const humano = m.autor_tipo === 'humano';
                      const cliente = m.role === 'user';
                      return (
                        <div key={idx} className={`flex ${cliente ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${cliente ? 'bg-white border' : humano ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'}`}>
                            <div className="whitespace-pre-wrap">{m.content}</div>
                            <div className={`text-[10px] mt-1 ${cliente ? 'text-gray-400' : 'text-white/70'}`}>
                              {m.autor_tipo ?? (cliente ? 'cliente' : 'flora')} • {formatarHora(m.ts)} {m.status === 'falha' ? '• falha' : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-4 border-t bg-white">
                    {!podeEnviar && (
                      <p className="text-xs text-amber-700 mb-2 flex items-center gap-1"><Clock className="w-3 h-3" /> Assuma a conversa para responder. A Flora fica bloqueada enquanto o modo humano estiver ativo.</p>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        value={texto}
                        onChange={(e) => setTexto(e.target.value)}
                        disabled={!podeEnviar || loading}
                        className="flex-1 min-h-20 rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                        placeholder="Digite a resposta ao cliente no mesmo canal Meta..."
                      />
                      <button disabled={!podeEnviar || !texto.trim() || loading} onClick={enviar} className="px-4 rounded-xl bg-indigo-600 text-white disabled:opacity-50">
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <aside className="border-l p-4 space-y-4 bg-white overflow-y-auto">
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2"><MessageCircle className="w-4 h-4" /> Dados</h4>
                    <dl className="mt-2 text-xs space-y-1 text-gray-600">
                      <div><b>Canal:</b> {selecionadaAtual.canal}</div>
                      <div><b>Status:</b> {STATUS_LABEL[selecionadaAtual.status_atendimento ?? 'flora_atendendo']}</div>
                      <div><b>Modo:</b> {selecionadaAtual.modo_atendimento ?? 'flora'}</div>
                      <div><b>Atendente:</b> {selecionadaAtual.atendente_id ?? '—'}</div>
                    </dl>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Resumo</h4>
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{selecionadaAtual.resumo ?? 'Sem resumo registrado.'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Próximo passo</h4>
                    <p className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{selecionadaAtual.proximo_passo ?? '—'}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Pedido info</h4>
                    <pre className="text-[11px] text-gray-600 bg-gray-50 border rounded-lg p-2 mt-1 overflow-auto max-h-48">{JSON.stringify(selecionadaAtual.pedido_info ?? {}, null, 2)}</pre>
                  </div>
                  <button onClick={() => window.open('/producao', '_blank')} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold">
                    Abrir produção
                  </button>
                </aside>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
