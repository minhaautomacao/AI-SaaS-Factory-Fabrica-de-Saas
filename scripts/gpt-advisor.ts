/**
 * CLI do GPT Advisor — nunca executa nada, só diagnostica.
 * Regras completas: docs/GPT_ADVISOR_RULES.md
 *
 * Uso:
 *   $env:OPENAI_API_KEY = "sk-..."   (ou salvar em .credentials/ia/.env)
 *   npx tsx scripts/gpt-advisor.ts "webhook-meta erro DM status=400 code=190 Cannot parse access token"
 */

import { consultarAdvisor } from '../ai/advisor.ts';

async function main() {
  const erro = process.argv.slice(2).join(' ').trim();
  if (!erro) {
    console.error('Uso: npx tsx scripts/gpt-advisor.ts "<erro/log>"');
    process.exit(1);
  }

  try {
    const resposta = await consultarAdvisor(erro);
    console.log(JSON.stringify(resposta, null, 2));
  } catch (e) {
    console.error(String(e));
    process.exit(1);
  }
}

main();
