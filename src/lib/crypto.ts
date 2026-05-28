import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

function getKey(): Buffer {
  const hex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!hex || hex.trim() === '') {
    throw new Error('CREDENTIAL_ENCRYPTION_KEY não configurada. Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== 32) throw new Error('CREDENTIAL_ENCRYPTION_KEY deve ter exatamente 32 bytes (64 chars hex)');
  return buf;
}

export function encrypt(texto: string): { ciphertext: string; iv: string } {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const combined = Buffer.concat([encrypted, tag]);
  return {
    ciphertext: combined.toString('hex'),
    iv: iv.toString('hex'),
  };
}

export function decrypt(ciphertext: string, iv: string): string {
  const key = getKey();
  const ivBuf = Buffer.from(iv, 'hex');
  const combined = Buffer.from(ciphertext, 'hex');
  const tag = combined.subarray(combined.length - 16);
  const encrypted = combined.subarray(0, combined.length - 16);
  const decipher = createDecipheriv('aes-256-gcm', key, ivBuf);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
