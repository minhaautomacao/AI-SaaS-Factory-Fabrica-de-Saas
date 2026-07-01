/**
 * GPT Advisor — diagnóstico local via OpenAI API.
 * Regras completas: docs/GPT_ADVISOR_RULES.md
 *
 * Uso:
 *   $env:OPENAI_API_KEY = "sk-..."   (PowerShell, sessão atual só)
 *   npx tsx scripts/gpt-advisor.ts "webhook-meta erro DM status=400 code=190 Cannot parse access token"
 *
 * Não lê .credentials/. A chave deve vir de uma variável de ambiente
 * já exportada na sessão do terminal antes de rodar o script.
 */

import { readFileSync } from 'node:fs';

const MASK = '[MASKED]';

function mascarar(texto: string): string {
  return texto
    .replace(/[A-Za-z0-9_-]{25,}/g, MASK)
    .replace(/Bearer\s+\S+/gi, `Bearer ${MASK}`);
}

async function main() {
  const erro = process.argv.slice(2).join(' ').trim();
  if (!erro) {
    console.error('Uso: npx tsx scripts/gpt-advisor.ts "<erro/log>"');
    process.exit(1);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY não encontrada no ambiente. Exporte a variável antes de rodar (ver cabeçalho deste arquivo).');
    process.exit(1);
  }

  let estado = '';
  try {
    estado = readFileSync('docs/CURRENT_STATE.md', 'utf-8').slice(0, 1500);
  } catch {
    estado = '(docs/CURRENT_STATE.md não encontrado)';
  }

  const prompt =
    `Contexto do projeto (resumo):\n${mascarar(estado)}\n\n` +
    `Erro reportado:\n${mascarar(erro)}\n\n` +
    `Qual a próxima ação técnica única recomendada? Responda em português, direto, sem gerar código.`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  });

  if (!res.ok) {
    console.error(`Erro da OpenAI API: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  console.log(data.choices?.[0]?.message?.content ?? 'Sem resposta.');
}

main();
