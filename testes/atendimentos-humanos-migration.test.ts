// Teste direcionado (estático) da migration atendimentos_humanos — sem Postgres/Supabase CLI
// disponíveis nesta sessão. Confirma presença dos novos campos, do novo status e de
// origem_handoff, e faz uma checagem simples de balanceamento de parênteses do arquivo.
// Executar: npx tsx testes/atendimentos-humanos-migration.test.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, '../supabase/migrations/20260716000011_atendimentos_humanos.sql'),
  'utf8',
);

// Ajuste 1: novos campos
for (const campo of ['atendente_id', 'assumido_em', 'concluido_em', 'devolvido_em']) {
  assert.ok(sql.includes(campo), `campo ${campo} ausente na migration`);
}
assert.ok(/atendente_id\s+text/.test(sql), 'atendente_id deve seguir o padrão text usado em conversas');
assert.ok(/assumido_em\s+timestamptz/.test(sql), 'assumido_em deve ser timestamptz');
assert.ok(/concluido_em\s+timestamptz/.test(sql), 'concluido_em deve ser timestamptz');
assert.ok(/devolvido_em\s+timestamptz/.test(sql), 'devolvido_em deve ser timestamptz');

// Ajuste 2: novo status, sem remover os existentes
const statusMatch = sql.match(/check \(status in \(([^)]*)\)\)/);
assert.ok(statusMatch, 'check constraint de status não encontrado');
for (const status of ['aguardando_humano', 'em_atendimento', 'concluido', 'cancelado', 'devolvido_flora']) {
  assert.ok(statusMatch![1].includes(status), `status ${status} ausente no check constraint`);
}

// Ajuste 3: origem_handoff com os 7 valores esperados, coluna not null
assert.ok(/origem_handoff\s+text not null/.test(sql), 'origem_handoff deve ser not null');
for (const origem of ['cliente_solicitou', 'flora_sem_confianca', 'limite_tecnico', 'pagamento', 'logistica', 'administrativo', 'manual']) {
  assert.ok(sql.includes(origem), `origem ${origem} ausente no check constraint de origem_handoff`);
}

// Checagem simples de sintaxe: parênteses balanceados no arquivo inteiro
const abertos = (sql.match(/\(/g) ?? []).length;
const fechados = (sql.match(/\)/g) ?? []).length;
assert.equal(abertos, fechados, `parênteses desbalanceados: ${abertos} abertos vs ${fechados} fechados`);

// Índices/estrutura preexistentes não foram removidos (prevenção de duplicidade intacta)
assert.ok(sql.includes('idx_atendimentos_humanos_aberto_unico'), 'índice único de handoff aberto não pode ser removido');
assert.ok(sql.includes("codigo                text not null unique"), 'coluna codigo deve permanecer unique');

console.log('OK — migration atendimentos_humanos: todas as asserções passaram.');
