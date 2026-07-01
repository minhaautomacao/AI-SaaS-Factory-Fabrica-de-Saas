/**
 * Sanitização de texto antes de qualquer envio para a OpenAI API.
 * Regras completas: docs/GPT_ADVISOR_RULES.md
 */

const MASK = '[MASKED]';

export function sanitize(texto: string): string {
  if (!texto) return texto;

  let s = texto;

  // Bearer tokens
  s = s.replace(/Bearer\s+\S+/gi, `Bearer ${MASK}`);

  // JWT (3 segmentos base64url separados por ponto) — cobre Supabase, Meta, etc.
  s = s.replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, MASK);

  // Facebook/Instagram/Page Access Tokens (prefixo EAA)
  s = s.replace(/\bEAA[A-Za-z0-9]{20,}\b/g, MASK);

  // OpenAI API Keys
  s = s.replace(/\bsk-[A-Za-z0-9-]{10,}\b/g, MASK);

  // Headers sensíveis
  s = s.replace(/^(Authorization:\s*).+$/gim, `$1${MASK}`);
  s = s.replace(/^(Cookie:\s*).+$/gim, `$1${MASK}`);
  s = s.replace(/^(Set-Cookie:\s*).+$/gim, `$1${MASK}`);

  // key: value / key=value para api_key, access_token, password, secret, senha
  s = s.replace(
    /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret|senha)\s*[:=]\s*)["']?[^\s"']+["']?/gi,
    `$1${MASK}`,
  );

  // Linhas estilo .env (CHAVE_MAIUSCULA=valor) — mantém o nome, mascara o valor
  s = s.replace(/^([A-Z][A-Z0-9_]{2,}=)\S+$/gm, `$1${MASK}`);

  // IDs sensíveis (IDs da Meta costumam ter 15+ dígitos: Instagram/Page/App IDs)
  s = s.replace(/\b\d{15,}\b/g, MASK);

  // Catch-all: qualquer sequência alfanumérica longa restante (32+ chars)
  s = s.replace(/\b[A-Za-z0-9_\-.]{32,}\b/g, MASK);

  return s;
}
