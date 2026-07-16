// Criação/reuso do registro persistente de handoff humano (tabela atendimentos_humanos).
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { gerarCodigoAtendimento } from './atendimento-humano-utils.ts';

const STATUS_ABERTOS = ['aguardando_humano', 'em_atendimento'];
const MAX_TENTATIVAS_SEQUENCIAL = 3;

export interface DadosHandoffHumano {
  workspaceId: string | null;
  conversaId: string | null;
  canal: string;
  canalClienteId: string;
  telefone?: string | null;
  nomeCliente?: string | null;
  resumo?: string | null;
  historicoReferencia?: string | null;
  dadosPedido?: Record<string, unknown> | null;
  pendencias?: unknown[] | null;
  motivoTransferencia?: string | null;
}

export interface AtendimentoHumano {
  id: string;
  codigo: string;
  status: string;
}

// Reutiliza o atendimento aberto da mesma conversa (evita duplicidade) ou cria um novo com código único.
export async function criarOuReutilizarHandoffHumano(
  db: SupabaseClient,
  dados: DadosHandoffHumano,
): Promise<AtendimentoHumano> {
  if (dados.conversaId) {
    const { data: existente } = await db
      .from('atendimentos_humanos')
      .select('id, codigo, status')
      .eq('conversa_id', dados.conversaId)
      .in('status', STATUS_ABERTOS)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existente) {
      await db
        .from('atendimentos_humanos')
        .update({
          resumo: dados.resumo ?? undefined,
          dados_pedido: dados.dadosPedido ?? undefined,
          motivo_transferencia: dados.motivoTransferencia ?? undefined,
        })
        .eq('id', existente.id);
      return existente as AtendimentoHumano;
    }
  }

  for (let tentativa = 0; tentativa < MAX_TENTATIVAS_SEQUENCIAL; tentativa++) {
    const { data: sequencial, error: erroSequencial } = await db.rpc('next_atendimento_sequencial');
    if (erroSequencial || sequencial == null) {
      throw new Error(`Falha ao gerar sequencial de atendimento: ${erroSequencial?.message}`);
    }

    const codigo = gerarCodigoAtendimento(dados.canal, dados.canalClienteId, Number(sequencial));

    const { data: novo, error } = await db
      .from('atendimentos_humanos')
      .insert({
        codigo,
        workspace_id: dados.workspaceId,
        conversa_id: dados.conversaId,
        canal: dados.canal,
        canal_cliente_id: dados.canalClienteId,
        telefone: dados.telefone ?? null,
        nome_cliente: dados.nomeCliente ?? null,
        resumo: dados.resumo ?? null,
        historico_referencia: dados.historicoReferencia ?? null,
        dados_pedido: dados.dadosPedido ?? {},
        pendencias: dados.pendencias ?? [],
        motivo_transferencia: dados.motivoTransferencia ?? null,
        status: 'aguardando_humano',
      })
      .select('id, codigo, status')
      .single();

    if (!error && novo) return novo as AtendimentoHumano;
    if (error?.code !== '23505') throw new Error(`Falha ao criar atendimento humano: ${error?.message}`);
    // 23505 = unique_violation no código (colisão rara) — tenta novo sequencial
  }

  throw new Error('Não foi possível gerar código de atendimento único após múltiplas tentativas');
}
