/**
 * marketing — Campanhas e copy de marketing
 *
 * Fluxo:
 *   1. Claude cria estratégia e copy da campanha
 *   2. Envia pelo canal recomendado:
 *      - whatsapp → enviarWhatsApp (para contato individual ou lista no payload)
 *      - email    → enviarEmail via Resend
 *      - todos    → ambos os canais
 *      - instagram → registra copy para ação manual (não automatizável via API simples)
 *
 * Credenciais necessárias (workspace_credentials):
 *   tipo='evolution'/'whatsapp': para campanhas WhatsApp
 *   tipo='email': api_key, from (para campanhas email)
 *
 * Payload esperado:
 *   telefone     — número para envio individual (opcional)
 *   email        — email para envio (opcional)
 *   tipo_campanha— contexto da campanha
 *   segmento     — descrição do público
 *   dados_extras — contexto adicional
 */

import { callClaude } from '../_shared/anthropic.ts';
import { logEvento } from '../_shared/logger.ts';
import { enviarWhatsApp } from '../_shared/whatsapp.ts';
import { enviarEmail } from '../_shared/email.ts';
import type { OrquestradorPayload } from '../_shared/types.ts';

const SYSTEM_PROMPT = `Você é o agente de Marketing da Fábrica de SaaS.
Crie estratégias e conteúdo de marketing focado em conversão. Retorne JSON:
{
  "tipo_campanha": "reativacao"|"upsell"|"promocao"|"conteudo_organico"|"nenhuma",
  "copy_whatsapp": "texto para WhatsApp (máx 300 chars, casual e direto)",
  "copy_email_assunto": "assunto do email (máx 60 chars)",
  "copy_email_corpo": "corpo do email em texto (máx 500 chars)",
  "canal_recomendado": "whatsapp"|"email"|"instagram"|"todos",
  "acoes": ["ações executadas"],
  "segmento_alvo": "descrição do público"
}`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const inicio = Date.now();
  let body: OrquestradorPayload;
  try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400 }); }

  const { task_id, escopo, urgencia, payload, workspace_id } = body;
  const acoes: string[] = [];

  try {
    const resposta = await callClaude(SYSTEM_PROMPT, `Contexto de marketing:\n${JSON.stringify(payload, null, 2)}`);
    const resultado = JSON.parse(resposta);

    acoes.push(`Campanha: ${resultado.tipo_campanha} | Canal: ${resultado.canal_recomendado}`);
    acoes.push(`Segmento: ${resultado.segmento_alvo}`);

    const telefone = payload.telefone as string | undefined;
    const email    = payload.email    as string | undefined;
    const canal    = resultado.canal_recomendado as string ?? 'nenhuma';

    // Envio WhatsApp
    if ((canal === 'whatsapp' || canal === 'todos') && resultado.copy_whatsapp) {
      const envio = await enviarWhatsApp(workspace_id, telefone, resultado.copy_whatsapp);
      acoes.push(envio.enviado
        ? `WhatsApp enviado (${envio.provedor})`
        : `WhatsApp não enviado: ${envio.erro}`);
    }

    // Envio Email
    if ((canal === 'email' || canal === 'todos') && resultado.copy_email_corpo) {
      const envio = await enviarEmail(
        workspace_id,
        email,
        resultado.copy_email_assunto ?? 'Novidade para você',
        resultado.copy_email_corpo,
      );
      acoes.push(envio.enviado
        ? `Email enviado (id: ${envio.id})`
        : `Email não enviado: ${envio.erro}`);
    }

    // Instagram: só registra (requer intervenção humana)
    if (canal === 'instagram') {
      acoes.push('Copy criada para Instagram — publicação manual necessária (API requer aprovação Meta)');
    }

    await logEvento({ task_id, escopo, agente: 'marketing', tipo_evento: 'concluido', urgencia, duracao_ms: Date.now() - inicio, workspace_id });
    return new Response(
      JSON.stringify({ sucesso: true, tipo_campanha: resultado.tipo_campanha, acoes_executadas: acoes }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logEvento({ task_id, escopo, agente: 'marketing', tipo_evento: 'erro', urgencia, duracao_ms: Date.now() - inicio, erro: msg, workspace_id });
    return new Response(JSON.stringify({ sucesso: false, erro: msg }), { status: 500 });
  }
});
