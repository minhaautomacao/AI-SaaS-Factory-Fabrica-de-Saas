#!/usr/bin/env npx tsx
/**
 * criar-saas.ts — Script de scaffolding da Fábrica de SaaS
 *
 * Uso:
 *   npx tsx scripts/criar-saas.ts
 *
 * O que faz:
 *   1. Pergunta o nome e tipo do SaaS
 *   2. Copia o template adequado para uma nova pasta
 *   3. Substitui placeholders pelo nome real
 *   4. Cria o .env.local pronto para preencher
 *   5. Instrui os próximos passos (Supabase + Vercel)
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const ROOT = path.resolve(process.cwd());
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const PROJETOS_DIR = path.join(ROOT, '..'); // pasta irmã do fabrica-saas

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string): Promise<string> => new Promise((res) => rl.question(q, res));

function copiarDiretorio(origem: string, destino: string, substituicoes: Record<string, string>) {
  if (!fs.existsSync(destino)) fs.mkdirSync(destino, { recursive: true });

  for (const item of fs.readdirSync(origem)) {
    const srcPath = path.join(origem, item);
    const destPath = path.join(destino, item);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copiarDiretorio(srcPath, destPath, substituicoes);
    } else {
      let conteudo = fs.readFileSync(srcPath, 'utf8');
      for (const [chave, valor] of Object.entries(substituicoes)) {
        conteudo = conteudo.replaceAll(chave, valor);
      }
      fs.writeFileSync(destPath, conteudo);
    }
  }
}

function slugify(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function main() {
  console.log('\n🏭 Fábrica de SaaS — Criador de Novo Projeto\n');

  const nomeSaaS = await ask('Nome do SaaS (ex: Floricultura Primavera): ');
  const descricao = await ask('Descrição breve (ex: Loja de flores com WhatsApp): ');
  const tipoRaw = await ask('Tipo [1=saas-base, 2=saas-b2b, 3=agente-base] (padrão: 1): ');

  const tipos: Record<string, string> = { '1': 'saas-base', '2': 'saas-b2b', '3': 'agente-base' };
  const tipo = tipos[tipoRaw.trim()] ?? 'saas-base';

  const slug = slugify(nomeSaaS);
  const templateDir = path.join(TEMPLATES_DIR, tipo);
  const destinoDir = path.join(PROJETOS_DIR, slug);

  if (!fs.existsSync(templateDir)) {
    console.error(`\n❌ Template "${tipo}" não encontrado em ${templateDir}`);
    rl.close();
    process.exit(1);
  }

  if (fs.existsSync(destinoDir)) {
    const confirmar = await ask(`\n⚠️  Pasta "${slug}" já existe. Sobrescrever? [s/N]: `);
    if (confirmar.toLowerCase() !== 's') {
      console.log('Cancelado.');
      rl.close();
      return;
    }
  }

  console.log(`\n📦 Copiando template "${tipo}" para "${slug}"...`);

  const substituicoes: Record<string, string> = {
    'Meu SaaS': nomeSaaS,
    'meu-saas': slug,
    'saas-base': slug,
    'Gerado pela Fábrica de SaaS': descricao,
  };

  copiarDiretorio(templateDir, destinoDir, substituicoes);

  // Cria .env.local a partir do .env.example
  const envExemplo = path.join(destinoDir, '.env.example');
  const envLocal = path.join(destinoDir, '.env.local');
  if (fs.existsSync(envExemplo) && !fs.existsSync(envLocal)) {
    let envConteudo = fs.readFileSync(envExemplo, 'utf8');
    envConteudo = envConteudo.replace(
      /NEXT_PUBLIC_APP_NAME=.*/,
      `NEXT_PUBLIC_APP_NAME=${nomeSaaS}`
    );
    fs.writeFileSync(envLocal, envConteudo);
  }

  console.log('\n✅ Projeto criado com sucesso!\n');
  console.log(`📁 Local: ${destinoDir}\n`);
  console.log('─'.repeat(50));
  console.log('📋 Próximos passos:\n');
  console.log(`  1. cd ../${slug}`);
  console.log(`  2. Editar .env.local com suas credenciais`);
  console.log(`  3. Criar projeto no Supabase:`);
  console.log(`     → https://supabase.com/dashboard/new`);
  console.log(`     → Copiar URL e chaves para .env.local`);
  console.log(`     → supabase link --project-ref SEU_REF`);
  console.log(`     → supabase db push`);
  console.log(`  4. npm install && npm run dev`);
  console.log(`  5. Deploy: npx vercel --prod`);
  console.log('─'.repeat(50));
  console.log(`\n🎯 Workspace na Fábrica: registrar em https://fabrica-saas.vercel.app`);
  console.log(`   → "+ Novo SaaS" → nome: ${nomeSaaS}\n`);

  rl.close();
}

main().catch((e) => {
  console.error(e);
  rl.close();
  process.exit(1);
});
