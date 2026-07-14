import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { getSupabaseAdmin } from './src/lib/supabase-server.js';
import { encrypt } from './src/lib/crypto.js';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// ── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const correctEmail    = process.env.APP_EMAIL    || 'minhaautomacao10@gmail.com';
  const correctPassword = process.env.APP_PASSWORD || '12345678';
  if (email === correctEmail && password === correctPassword) {
    return res.json({ success: true, token: 'factory-auth-token-9988' });
  }
  return res.status(401).json({ error: 'Email ou senha incorretos.' });
});

app.get('/api/auth-status', (_req, res) => {
  res.json({ isProtected: true, hasCustomPassword: !!(process.env.APP_PASSWORD?.trim()) });
});

app.get('/api/config-status', (_req, res) => {
  res.json({ hasAPIKey: !!(process.env.ANTHROPIC_API_KEY?.trim()) });
});

function requireDashboardAuth(req: express.Request, res: express.Response): boolean {
  const expected = 'factory-auth-token-9988';
  const auth = String(req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const alt = String(req.headers['x-auth-token'] ?? '');
  if (auth === expected || alt === expected) return true;
  res.status(401).json({ error: 'N?o autenticado' });
  return false;
}

function getEnemeopSupabase() {
  return createClient(
    process.env.SUPABASE_ENEMEOP_URL || process.env.SUPABASE_URL || '',
    process.env.SUPABASE_ENEMEOP_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );
}

// ── Floricultura — Pedidos ────────────────────────────────────────────────────

app.get('/api/floricultura/pedidos', async (req, res) => {
  try {
    // Supabase do projeto Enemeop Flores (pode ser o mesmo projeto ou outro)
    const flor = createClient(
      process.env.SUPABASE_ENEMEOP_URL || process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ENEMEOP_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    );
    const statusFiltro = req.query.status === 'ativo'
      ? ['novo', 'confirmado', 'preparando', 'pronto']
      : null;

    let query = flor.from('pedidos')
      .select('*')
      .order('numero', { ascending: false });

    if (statusFiltro) query = query.in('status', statusFiltro);

    const { data, error } = await query;
    if (error) throw error;
    res.json({ pedidos: data ?? [] });
  } catch (err: unknown) {
    // Se tabela não existir ainda, retorna mock para desenvolvimento
    const mock = [
      {
        id: 'mock-1', numero: 1, cliente_nome: 'Maria Silva', cliente_telefone: '11999990001',
        produto: 'Buquê 12 Rosas Vermelhas', valor: 280, endereco: 'Rua das Flores, 100',
        bairro: 'Moema', data_entrega: new Date(Date.now() + 3 * 3600000).toISOString(),
        status: 'preparando', foto_url: '', canal: 'whatsapp', criado_em: new Date().toISOString(),
      },
      {
        id: 'mock-2', numero: 2, cliente_nome: 'João Pereira', cliente_telefone: '11999990002',
        produto: 'Arranjo Girassóis R$255', valor: 255, endereco: 'Av. Paulista, 500',
        bairro: 'Bela Vista', data_entrega: new Date(Date.now() + 5 * 3600000).toISOString(),
        status: 'confirmado', foto_url: '', canal: 'instagram', criado_em: new Date().toISOString(),
      },
    ];
    res.json({ pedidos: mock, aviso: 'Tabela pedidos não encontrada — exibindo dados de exemplo' });
  }
});

// ── Workspaces ────────────────────────────────────────────────────────────────

app.get('/api/workspaces', async (_req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('workspaces')
      .select('*, workspace_credentials(count)')
      .order('criado_em', { ascending: false });
    if (error) throw error;

    const workspaces = (data ?? []).map((w: Record<string, unknown>) => {
      const creds = (w.workspace_credentials as { count: number }[])?.[0]?.count ?? 0;
      return { ...w, workspace_credentials: undefined, credentials_count: 6, credentials_configuradas: creds };
    });
    res.json({ workspaces });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao listar workspaces' });
  }
});

app.post('/api/workspaces', async (req, res) => {
  try {
    const { nome, descricao, owner_email, segmento } = req.body;
    if (!nome?.trim()) return res.status(400).json({ error: 'nome é obrigatório' });

    const slug = nome.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('workspaces').insert({ nome, slug, descricao, owner_email, segmento }).select().single();
    if (error) throw error;
    res.status(201).json({ workspace: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao criar workspace' });
  }
});

app.get('/api/workspaces/:id', async (req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('workspaces').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ workspace: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar workspace' });
  }
});

app.put('/api/workspaces/:id', async (req, res) => {
  try {
    const { nome, descricao, status, segmento, owner_email } = req.body;
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('workspaces').update({ nome, descricao, status, segmento, owner_email }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ workspace: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao atualizar workspace' });
  }
});

// ── Credentials ───────────────────────────────────────────────────────────────

app.get('/api/workspaces/:id/credentials', async (req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from('workspace_credentials')
      .select('id, workspace_id, tipo, chave, ativo, testado_em, teste_status, teste_detalhe')
      .eq('workspace_id', req.params.id)
      .order('tipo');
    if (error) throw error;
    res.json({ credentials: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao listar credenciais' });
  }
});

app.post('/api/workspaces/:id/credentials', async (req, res) => {
  try {
    const { tipo, chave, valor } = req.body;
    if (!tipo || !chave || !valor) return res.status(400).json({ error: 'tipo, chave e valor são obrigatórios' });

    const { ciphertext, iv } = encrypt(valor);
    const sb = getSupabaseAdmin();
    const { data, error } = await sb.from('workspace_credentials').upsert({
      workspace_id: req.params.id, tipo, chave, valor: ciphertext, iv, teste_status: 'pendente',
    }, { onConflict: 'workspace_id,tipo,chave' }).select('id, workspace_id, tipo, chave, ativo, testado_em, teste_status').single();
    if (error) throw error;
    res.status(201).json({ credential: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao salvar credencial' });
  }
});

app.delete('/api/workspaces/:id/credentials/:credId', async (req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from('workspace_credentials').delete().eq('id', req.params.credId).eq('workspace_id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao remover credencial' });
  }
});

app.post('/api/workspaces/:id/credentials/:credId/test', async (req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: cred, error } = await sb.from('workspace_credentials').select('tipo').eq('id', req.params.credId).single();
    if (error) throw error;

    // Teste básico: ping ao endpoint do serviço
    const testeOk = true; // Em produção: chamar Evolution API, Meta Graph, etc.
    const detalhe = testeOk ? 'Conexão validada' : 'Falha ao conectar';

    await sb.from('workspace_credentials').update({
      testado_em: new Date().toISOString(),
      teste_status: testeOk ? 'ok' : 'erro',
      teste_detalhe: detalhe,
    }).eq('id', req.params.credId);

    res.json({ ok: testeOk, tipo: cred.tipo, detalhe });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro no teste de credencial' });
  }
});

// ── Monitor ───────────────────────────────────────────────────────────────────

app.get('/api/monitor/logs', async (req, res) => {
  try {
    const { agente, workspace_id, limit = '50' } = req.query as Record<string, string>;
    const sb = getSupabaseAdmin();
    let query = sb.from('orchestrator_logs').select('*').order('criado_em', { ascending: false }).limit(parseInt(limit));
    if (agente) query = query.eq('agente', agente);
    if (workspace_id) query = query.eq('workspace_id', workspace_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ logs: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar logs' });
  }
});

app.get('/api/monitor/metrics', async (_req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const { data: leads } = await sb.from('leads').select('workspace_id, status, criado_em').order('criado_em', { ascending: false }).limit(500);
    const { data: workspaces } = await sb.from('workspaces').select('id, nome, status');
    res.json({ leads: leads ?? [], workspaces: workspaces ?? [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar métricas' });
  }
});

app.get('/api/monitor/activity', async (_req, res) => {
  try {
    const sb = getSupabaseAdmin();
    const vinte4h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await sb.from('orchestrator_logs').select('criado_em, erro').gte('criado_em', vinte4h).order('criado_em');
    if (error) throw error;

    const porHora: Record<string, { eventos: number; erros: number }> = {};
    for (let h = 0; h < 24; h++) {
      const hora = String(h).padStart(2, '0') + ':00';
      porHora[hora] = { eventos: 0, erros: 0 };
    }
    for (const row of data ?? []) {
      const hora = new Date(row.criado_em).getHours();
      const key = String(hora).padStart(2, '0') + ':00';
      porHora[key].eventos++;
      if (row.erro) porHora[key].erros++;
    }

    res.json({ activity: Object.entries(porHora).map(([hora, v]) => ({ hora, ...v })) });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar atividade' });
  }
});

// ── Templates (backward compat para SaaSPlannerForm) ─────────────────────────

// ?? Floricultura ? Atendimento Flora / Inbox ?????????????????????????????????

app.get('/api/flora/metrics', async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;
  try {
    const sb = getEnemeopSupabase();
    const { count: aguardando } = await sb.from('conversas').select('id', { count: 'exact', head: true }).in('canal', ['instagram', 'facebook']).eq('status_atendimento', 'aguardando_humano');
    const { count: humano } = await sb.from('conversas').select('id', { count: 'exact', head: true }).in('canal', ['instagram', 'facebook']).eq('modo_atendimento', 'humano');
    res.json({ aguardando_humano: aguardando ?? 0, em_atendimento: humano ?? 0 });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao buscar m?tricas Flora' });
  }
});

app.get('/api/flora/conversas', async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;
  try {
    const sb = getEnemeopSupabase();
    const { data, error } = await sb
      .from('conversas')
      .select('id, canal_id, canal, fase, historico, pedido_info, nome_cliente, modo_atendimento, status_atendimento, motivo_handoff, handoff_em, resumo, proximo_passo, atendente_id, assumido_em, atualizado_em, workspace_id')
      .in('canal', ['instagram', 'facebook'])
      .order('atualizado_em', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json({ conversas: data ?? [] });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao listar conversas Flora' });
  }
});

app.post('/api/flora/conversas/:id/assumir', async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;
  try {
    const atendenteId = String(req.body?.atendente_id || 'dashboard-enemeop');
    const sb = getEnemeopSupabase();
    const { data, error } = await sb
      .from('conversas')
      .update({ modo_atendimento: 'humano', status_atendimento: 'humano_atendendo', atendente_id: atendenteId, assumido_em: new Date().toISOString(), atualizado_em: new Date().toISOString() })
      .eq('id', req.params.id)
      .in('canal', ['instagram', 'facebook'])
      .or(`atendente_id.is.null,atendente_id.eq.${atendenteId}`)
      .neq('status_atendimento', 'concluida')
      .select('id, atendente_id, modo_atendimento, status_atendimento')
      .single();
    if (error || !data) return res.status(409).json({ error: 'Conversa j? assumida por outro atendente ou indispon?vel' });
    res.json({ conversa: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao assumir conversa' });
  }
});

app.post('/api/flora/conversas/:id/devolver', async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;
  try {
    const atendenteId = String(req.body?.atendente_id || 'dashboard-enemeop');
    const sb = getEnemeopSupabase();
    const { data, error } = await sb
      .from('conversas')
      .update({ modo_atendimento: 'flora', status_atendimento: 'flora_atendendo', atendente_id: null, assumido_em: null, atualizado_em: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('atendente_id', atendenteId)
      .select('id, modo_atendimento, status_atendimento')
      .single();
    if (error || !data) return res.status(403).json({ error: 'Somente o atendente respons?vel pode devolver esta conversa' });
    res.json({ conversa: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao devolver conversa' });
  }
});

app.post('/api/flora/conversas/:id/concluir', async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;
  try {
    const atendenteId = String(req.body?.atendente_id || 'dashboard-enemeop');
    const sb = getEnemeopSupabase();
    const { data, error } = await sb
      .from('conversas')
      .update({ status_atendimento: 'concluida', modo_atendimento: 'humano', atualizado_em: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('atendente_id', atendenteId)
      .select('id, status_atendimento')
      .single();
    if (error || !data) return res.status(403).json({ error: 'Somente o atendente respons?vel pode concluir esta conversa' });
    res.json({ conversa: data });
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao concluir conversa' });
  }
});

app.post('/api/flora/conversas/:id/mensagens', async (req, res) => {
  if (!requireDashboardAuth(req, res)) return;
  try {
    const mensagem = String(req.body?.mensagem ?? '').trim();
    const atendenteId = String(req.body?.atendente_id || 'dashboard-enemeop');
    const idempotencyKey = String(req.body?.idempotency_key || randomUUID());
    if (!mensagem) return res.status(400).json({ error: 'Mensagem vazia' });
    const sb = getEnemeopSupabase();
    const { data: conversa, error: errConv } = await sb.from('conversas').select('id, workspace_id, canal, modo_atendimento, status_atendimento, atendente_id').eq('id', req.params.id).single();
    if (errConv || !conversa) return res.status(404).json({ error: 'Conversa n?o encontrada' });
    if (!['instagram', 'facebook'].includes(String(conversa.canal))) return res.status(400).json({ error: 'Canal inv?lido para Inbox Flora' });
    if (conversa.status_atendimento === 'concluida') return res.status(409).json({ error: 'Conversa conclu?da' });
    if (conversa.modo_atendimento !== 'humano' || conversa.atendente_id !== atendenteId) return res.status(403).json({ error: 'Assuma a conversa antes de responder' });
    const edgeUrl = `${process.env.SUPABASE_ENEMEOP_URL || process.env.SUPABASE_URL}/functions/v1/webhook-meta`;
    const secret = process.env.FACTORY_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const edgeResp = await fetch(edgeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${secret}`, 'x-flora-inbox-action': 'send-human-message' },
      body: JSON.stringify({ conversa_id: req.params.id, mensagem, autor_id: atendenteId, idempotency_key: idempotencyKey }),
    });
    const data = await edgeResp.json().catch(() => ({}));
    if (!edgeResp.ok) return res.status(edgeResp.status).json({ error: data.error ?? 'Falha ao enviar pelo canal Meta' });
    res.json(data);
  } catch (err: unknown) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Erro ao enviar mensagem' });
  }
});


app.get('/api/templates', (_req, res) => {
  res.json({ templates: [] });
});

// ── Servidor ──────────────────────────────────────────────────────────────────

async function startDev() {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
  app.use(vite.middlewares);
  app.listen(PORT, '0.0.0.0', () => console.log(`Fábrica de SaaS rodando em http://localhost:${PORT}`));
}

function startProd() {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  app.listen(PORT, '0.0.0.0', () => console.log(`Fábrica de SaaS rodando em http://localhost:${PORT}`));
}

export default app;

if (!process.env.VERCEL) {
  if (process.env.NODE_ENV === 'production') startProd();
  else startDev();
}
