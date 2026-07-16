// Teste direcionado da criação/reuso do handoff humano com um SupabaseClient fake em memória.
// Cobre: prevenção de duplicidade, reuso de código quando já há handoff aberto, salvamento do
// registro e nova geração de código após o atendimento anterior ser concluído.
// Executar: npx tsx testes/atendimento-humano-handoff.test.ts
import assert from 'node:assert/strict';
import { criarOuReutilizarHandoffHumano } from '../supabase/functions/_shared/atendimento-humano.ts';

interface Row { [key: string]: unknown }

function criarDbFake() {
  const tabela: Row[] = [];
  let sequencial = 0;
  let forcarColisaoUmaVez = false;

  const db = {
    _tabela: tabela,
    _forcarColisao() { forcarColisaoUmaVez = true; },
    rpc(nome: string) {
      assert.equal(nome, 'next_atendimento_sequencial');
      sequencial += 1;
      return Promise.resolve({ data: sequencial, error: null });
    },
    from(nomeTabela: string) {
      assert.equal(nomeTabela, 'atendimentos_humanos');
      return {
        select() {
          return this;
        },
        eq(campo: string, valor: unknown) {
          this._filtroConversa = { campo, valor };
          return this;
        },
        in(campo: string, valores: unknown[]) {
          this._filtroStatus = { campo, valores };
          return this;
        },
        order() { return this; },
        limit() { return this; },
        maybeSingle: () => {
          const encontrada = tabela.find(
            r => r['conversa_id'] === 'conversa-1' && ['aguardando_humano', 'em_atendimento'].includes(r['status'] as string),
          );
          return Promise.resolve({ data: encontrada ?? null, error: null });
        },
        update(campos: Row) {
          return {
            eq: (_campo: string, id: string) => {
              const alvo = tabela.find(r => r['id'] === id);
              if (alvo) Object.assign(alvo, campos);
              return Promise.resolve({ data: alvo, error: null });
            },
          };
        },
        insert(novaLinha: Row) {
          return {
            select: () => ({
              single: () => {
                if (forcarColisaoUmaVez) {
                  forcarColisaoUmaVez = false;
                  return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } });
                }
                const linha = { id: `id-${tabela.length + 1}`, ...novaLinha };
                tabela.push(linha);
                return Promise.resolve({ data: linha, error: null });
              },
            }),
          };
        },
      };
    },
  };
  return db;
}

async function testeCriaNovoAtendimentoQuandoNaoHaHandoffAberto() {
  const db = criarDbFake();
  const atendimento = await criarOuReutilizarHandoffHumano(db as any, {
    workspaceId: null,
    conversaId: 'conversa-1',
    canal: 'instagram',
    canalClienteId: '1784147265',
    resumo: 'Cliente pediu atendente',
    dadosPedido: null,
    motivoTransferencia: 'Cliente solicitou atendimento humano',
  });
  assert.equal(atendimento.codigo, 'INSTA-7265-0001');
  assert.equal(atendimento.status, 'aguardando_humano');
  assert.equal((db as any)._tabela.length, 1);
  assert.equal((db as any)._tabela[0].origem_handoff, 'cliente_solicitou', 'origem_handoff deve ser inferida do motivo quando não informada explicitamente');
  assert.equal((db as any)._tabela[0].atendente_id, undefined, 'campos de assumir/concluir/devolver não são preenchidos nesta etapa');
}

async function testeReutilizaCodigoQuandoJaHaHandoffAberto() {
  const db = criarDbFake();
  const primeiro = await criarOuReutilizarHandoffHumano(db as any, {
    workspaceId: null,
    conversaId: 'conversa-1',
    canal: 'instagram',
    canalClienteId: '1784147265',
    resumo: 'primeiro resumo',
    dadosPedido: null,
    motivoTransferencia: 'motivo A',
  });

  const segundo = await criarOuReutilizarHandoffHumano(db as any, {
    workspaceId: null,
    conversaId: 'conversa-1',
    canal: 'instagram',
    canalClienteId: '1784147265',
    resumo: 'resumo atualizado',
    dadosPedido: { produto: 'Buquê de rosas' },
    motivoTransferencia: 'motivo B',
  });

  assert.equal(segundo.codigo, primeiro.codigo, 'não deve criar novo código para conversa já em handoff aberto');
  assert.equal((db as any)._tabela.length, 1, 'não deve inserir segunda linha enquanto o handoff estiver aberto');
  assert.equal((db as any)._tabela[0].resumo, 'resumo atualizado', 'deve atualizar o resumo do handoff reutilizado');
}

async function testeGeraNovoCodigoAposEncerrarAtendimentoAnterior() {
  const db = criarDbFake();
  const primeiro = await criarOuReutilizarHandoffHumano(db as any, {
    workspaceId: null,
    conversaId: 'conversa-1',
    canal: 'instagram',
    canalClienteId: '1784147265',
    resumo: 'primeiro',
    dadosPedido: null,
    motivoTransferencia: 'motivo A',
  });

  (db as any)._tabela[0].status = 'concluido';

  const segundo = await criarOuReutilizarHandoffHumano(db as any, {
    workspaceId: null,
    conversaId: 'conversa-1',
    canal: 'instagram',
    canalClienteId: '1784147265',
    resumo: 'segundo',
    dadosPedido: null,
    motivoTransferencia: 'motivo B',
  });

  assert.notEqual(segundo.codigo, primeiro.codigo, 'atendimento encerrado não deve ser reutilizado');
  assert.equal((db as any)._tabela.length, 2);
}

async function testeRetentaSequencialEmColisaoDeCodigoUnico() {
  const db = criarDbFake();
  (db as any)._forcarColisao();
  const atendimento = await criarOuReutilizarHandoffHumano(db as any, {
    workspaceId: null,
    conversaId: 'conversa-2',
    canal: 'facebook',
    canalClienteId: '4598823912',
    resumo: null,
    dadosPedido: null,
    motivoTransferencia: 'motivo',
  });
  // 1ª tentativa colide (23505) e é descartada; 2ª tentativa usa o próximo sequencial.
  assert.equal(atendimento.codigo, 'FB-3912-0002');
  assert.equal((db as any)._tabela.length, 1);
}

async function main() {
  await testeCriaNovoAtendimentoQuandoNaoHaHandoffAberto();
  await testeReutilizaCodigoQuandoJaHaHandoffAberto();
  await testeGeraNovoCodigoAposEncerrarAtendimentoAnterior();
  await testeRetentaSequencialEmColisaoDeCodigoUnico();
  console.log('OK — atendimento-humano-handoff: todas as asserções passaram.');
}

main();
