/**
 * transportadoras.ts — Interface comum e dispatcher multi-transportadora
 *
 * Para adicionar nova transportadora:
 *   1. Criar _shared/<nome>.ts implementando `calcularFrete`
 *   2. Registrar em TRANSPORTADORAS com as chaves de credencial necessárias
 *
 * Credenciais (workspace_credentials, tipo='logistica'):
 *   melhor_envio_token, cep_origem   → Melhor Envio
 *   lalamove_key, lalamove_secret    → Lalamove
 */

import { buscarTodasCredenciais } from './credentials.ts';
import { calcularFreteMelhorEnvio } from './melhor-envio.ts';
import { calcularFreteLalamove } from './lalamove.ts';

export interface DadosFrete {
  cep_origem: string;
  cep_destino: string;
  peso_kg: number;
  valor_declarado: number;
  largura_cm: number;
  altura_cm: number;
  comprimento_cm: number;
}

export interface OpcaoFrete {
  transportadora: string;
  servico?: string;
  preco: number;
  prazo_dias: number;
}

export interface ResultadoFrete {
  opcoes: OpcaoFrete[];
  transportadoras_consultadas: string[];
  erros: Record<string, string>;
}

interface TransportadoraConfig {
  nome: string;
  chaves_necessarias: string[];
  calcular: (creds: Record<string, string>, dados: DadosFrete) => Promise<OpcaoFrete[]>;
}

/**
 * Consulta todas as transportadoras configuradas e retorna opções agregadas por preço.
 * Transportadoras sem credenciais são silenciosamente ignoradas.
 */
export interface OpcoesExtras {
  lat_origem?: string;
  lng_origem?: string;
  lat_destino?: string;
  lng_destino?: string;
  endereco_origem?: string;
  endereco_destino?: string;
}

export async function consultarFretes(
  workspaceId: string | undefined,
  dados: DadosFrete,
  extras?: OpcoesExtras,
): Promise<ResultadoFrete> {
  const creds = await buscarTodasCredenciais(workspaceId, 'logistica');
  const opcoes: OpcaoFrete[] = [];
  const consultadas: string[] = [];
  const erros: Record<string, string> = {};

  const transportadoras: TransportadoraConfig[] = [
    {
      nome: 'Melhor Envio',
      chaves_necessarias: ['melhor_envio_token', 'cep_origem'],
      calcular: async (c, d) =>
        calcularFreteMelhorEnvio(c['melhor_envio_token'], c['cep_origem'] ?? d.cep_origem, d),
    },
    {
      nome: 'Lalamove',
      chaves_necessarias: ['lalamove_key', 'lalamove_secret'],
      calcular: async (c, d) =>
        calcularFreteLalamove(c['lalamove_key'], c['lalamove_secret'], d, extras),
    },
  ];

  await Promise.all(
    transportadoras.map(async (t) => {
      const temCredenciais = t.chaves_necessarias.every((k) => !!creds[k]);
      if (!temCredenciais) return;

      consultadas.push(t.nome);
      try {
        const resultado = await t.calcular(creds, dados);
        opcoes.push(...resultado);
      } catch (e) {
        erros[t.nome] = String(e);
      }
    }),
  );

  opcoes.sort((a, b) => a.preco - b.preco);

  return { opcoes, transportadoras_consultadas: consultadas, erros };
}
