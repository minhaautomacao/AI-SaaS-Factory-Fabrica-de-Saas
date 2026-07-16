// Teste direcionado das funções puras de handoff humano (código, link WhatsApp, mensagens).
// Executar: npx tsx testes/atendimento-humano-utils.test.ts
import assert from 'node:assert/strict';
import {
  normalizarCanalAtendimento,
  extrairIdentificadorCliente,
  gerarCodigoAtendimento,
  montarLinkWhatsAppOficial,
  montarMensagemWhatsApp,
  montarMensagemTransicaoCliente,
  clientePediuHumano,
  inferirOrigemHandoff,
} from '../supabase/functions/_shared/atendimento-humano-utils.ts';

// 1-3: prefixo correto por canal
assert.equal(normalizarCanalAtendimento('instagram'), 'INSTA');
assert.equal(normalizarCanalAtendimento('facebook'), 'FB');
assert.equal(normalizarCanalAtendimento('whatsapp'), 'WA');

// 4: extração correta dos últimos 4 dígitos (exemplos do enunciado)
assert.equal(extrairIdentificadorCliente('5511999984837'), '4837');
assert.equal(extrairIdentificadorCliente('1784147265'), '7265');
assert.equal(extrairIdentificadorCliente('4598823912'), '3912');

// Fallback: identificador curto -> zero à esquerda; ausente -> sufixo derivado de UUID (4 chars)
assert.equal(extrairIdentificadorCliente('42'), '0042');
const semIdentificador = extrairIdentificadorCliente(null);
assert.equal(semIdentificador.length, 4);
assert.notEqual(extrairIdentificadorCliente(undefined), extrairIdentificadorCliente(undefined));

// 5: formato final do código
assert.equal(gerarCodigoAtendimento('instagram', '1784147265', 21), 'INSTA-7265-0021');
assert.equal(gerarCodigoAtendimento('facebook', '4598823912', 21), 'FB-3912-0021');
assert.equal(gerarCodigoAtendimento('whatsapp', '5511999984837', 21), 'WA-4837-0021');

// 6: unicidade — sequenciais diferentes para o mesmo cliente nunca colidem
assert.notEqual(
  gerarCodigoAtendimento('instagram', '1784147265', 21),
  gerarCodigoAtendimento('instagram', '1784147265', 22),
);

// 10/14/15: link usa somente o número oficial (9083) + canal/código — sem histórico/dados pessoais
const codigo = 'INSTA-7265-0021';
const link = montarLinkWhatsAppOficial('instagram', codigo);
assert.ok(link.startsWith('https://wa.me/5511982829083?text='));
assert.ok(!/endereco|pagamento|cpf|cartao/i.test(link));
const mensagemDecodificada = decodeURIComponent(link.split('text=')[1]);
assert.equal(mensagemDecodificada, montarMensagemWhatsApp('instagram', codigo));
assert.ok(mensagemDecodificada.includes(codigo));

// 11: mensagem de transição ao cliente contém o código correto e varia por canal
assert.ok(montarMensagemTransicaoCliente('instagram', codigo).includes(codigo));
assert.ok(montarMensagemTransicaoCliente('facebook', 'FB-3912-0021').includes('FB-3912-0021'));
assert.ok(montarMensagemTransicaoCliente('whatsapp', 'WA-4837-0021').includes('WA-4837-0021'));

// 12/13: gatilho de escalada — não dispara em pergunta comercial normal, dispara em pedido explícito
assert.equal(clientePediuHumano('Quais flores vocês têm para hoje?'), false);
assert.equal(clientePediuHumano('Quero comprar um buquê para aniversário'), false);
assert.equal(clientePediuHumano('Quero falar com um atendente'), true);
assert.equal(clientePediuHumano('Pode chamar um humano, por favor'), true);

// origem_handoff: classifica os motivos hoje usados pelo webhook-meta sem exigir alterá-lo
assert.equal(inferirOrigemHandoff('Cliente solicitou atendimento humano'), 'cliente_solicitou');
assert.equal(inferirOrigemHandoff('Falha t?cnica ao gerar link de pagamento'), 'pagamento');
assert.equal(inferirOrigemHandoff('Falha técnica ao gerar link de pagamento'), 'pagamento');
assert.equal(inferirOrigemHandoff('Erro técnico inesperado'), 'limite_tecnico');
assert.equal(inferirOrigemHandoff('Cotação de frete pendente'), 'logistica');
assert.equal(inferirOrigemHandoff('Motivo não mapeado'), 'manual');
assert.equal(inferirOrigemHandoff(null), 'manual');

console.log('OK — atendimento-humano-utils: todas as asserções passaram.');
