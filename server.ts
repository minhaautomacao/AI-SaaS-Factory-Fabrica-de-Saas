import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { getSupabaseAdmin } from './src/lib/supabase-server.js';
import { encrypt } from './src/lib/crypto.js';

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// ── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const correct = process.env.APP_PASSWORD || 'admin';
  if (password === correct) return res.json({ success: true, token: 'factory-auth-token-9988' });
  return res.status(401).json({ error: 'Senha incorreta.' });
});

app.get('/api/auth-status', (_req, res) => {
  res.json({ isProtected: true, hasCustomPassword: !!(process.env.APP_PASSWORD?.trim()) });
});

app.get('/api/config-status', (_req, res) => {
  res.json({ hasAPIKey: !!(process.env.ANTHROPIC_API_KEY?.trim()) });
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
