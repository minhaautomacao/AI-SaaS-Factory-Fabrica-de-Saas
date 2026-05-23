# Template Agente Base

Template para criar agentes de IA com memória, ferramentas e interface de chat. Ideal para chatbots de suporte, assistentes de produto e agentes de automação.

## O que inclui

- Interface de chat em tempo real
- Integração com Claude API (Anthropic)
- Memória de conversação persistente
- Sistema de ferramentas (tool use)
- Histórico de conversas no banco
- Streaming de respostas
- Suporte a múltiplos agentes configuráveis

## Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase (histórico de chats + auth)
- Anthropic SDK (Claude)
- Vercel AI SDK (streaming)
- Upstash Redis (rate limiting)
- Vercel (deploy)

## Estrutura de pastas

```
agente-base/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── chat/
│   │   │   ├── page.tsx            # Nova conversa
│   │   │   └── [id]/page.tsx       # Conversa existente
│   │   └── historico/page.tsx      # Lista de conversas
│   └── api/
│       ├── chat/route.ts           # Endpoint principal do agente
│       └── conversas/route.ts      # CRUD de conversas
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx       # Container principal
│   │   ├── MessageList.tsx         # Lista de mensagens
│   │   ├── MessageBubble.tsx       # Bolha de mensagem
│   │   ├── ChatInput.tsx           # Input com envio
│   │   └── TypingIndicator.tsx     # Indicador de digitação
│   └── sidebar/
│       ├── ConversasList.tsx
│       └── NewChatButton.tsx
├── lib/
│   ├── anthropic.ts                # Cliente Anthropic + config do agente
│   ├── supabase.ts
│   ├── redis.ts                    # Rate limiting
│   └── tools/
│       ├── index.ts                # Exporta todas as ferramentas
│       ├── buscar-info.ts          # Tool: buscar informações
│       └── criar-evento.ts         # Tool: criar evento no calendário
├── hooks/
│   └── useChat.ts                  # Hook do chat com streaming
├── types/
│   └── index.ts
└── supabase/
    └── migrations/
        └── 001_chat_schema.sql
```

## Schema do banco

```sql
-- Conversas
create table public.conversas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  titulo text default 'Nova conversa',
  agente text default 'assistente',
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Mensagens
create table public.mensagens (
  id uuid default gen_random_uuid() primary key,
  conversa_id uuid references public.conversas(id) on delete cascade,
  papel text check (papel in ('user', 'assistant', 'tool')),
  conteudo text not null,
  tokens_usados int,
  criado_em timestamptz default now()
);
```

## Configuração do agente (lib/anthropic.ts)

```typescript
import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const AGENTES = {
  assistente: {
    modelo: 'claude-sonnet-4-6',
    instrucoes: `Você é um assistente prestativo para [Nome do Produto].
    
Você ajuda usuários com:
- [Tarefa 1]
- [Tarefa 2]
- [Tarefa 3]

Sempre responda em português brasileiro de forma clara e direta.
Se não souber algo, diga que não sabe — nunca invente informações.`,
    max_tokens: 2048,
    temperatura: 0.7,
  },
  suporte: {
    modelo: 'claude-haiku-4-5-20251001',
    instrucoes: `Você é um agente de suporte técnico especializado.
Seja objetivo e técnico. Peça informações específicas quando necessário.`,
    max_tokens: 1024,
    temperatura: 0.3,
  }
} as const
```

## Endpoint do chat com streaming (api/chat/route.ts)

```typescript
import { anthropic, AGENTES } from '@/lib/anthropic'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { mensagens, conversaId, agente = 'assistente' } = await req.json()
  
  const config = AGENTES[agente as keyof typeof AGENTES]
  
  const stream = await anthropic.messages.create({
    model: config.modelo,
    max_tokens: config.max_tokens,
    system: config.instrucoes,
    messages: mensagens,
    stream: true,
  })
  
  // Retornar stream para o cliente
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (event.type === 'content_block_delta') {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
            )
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
        controller.close()
      }
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  )
}
```

## Hook de chat com streaming (hooks/useChat.ts)

```typescript
import { useState, useCallback } from 'react'

type Mensagem = { papel: 'user' | 'assistant'; conteudo: string }

export function useChat(agente = 'assistente') {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [carregando, setCarregando] = useState(false)

  const enviar = useCallback(async (texto: string) => {
    const novaMensagem: Mensagem = { papel: 'user', conteudo: texto }
    const historico = [...mensagens, novaMensagem]
    setMensagens(historico)
    setCarregando(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mensagens: historico.map(m => ({ role: m.papel, content: m.conteudo })),
        agente
      })
    })

    let respostaCompleta = ''
    setMensagens(prev => [...prev, { papel: 'assistant', conteudo: '' }])

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') break
        const { text } = JSON.parse(data)
        respostaCompleta += text
        setMensagens(prev => [
          ...prev.slice(0, -1),
          { papel: 'assistant', conteudo: respostaCompleta }
        ])
      }
    }

    setCarregando(false)
  }, [mensagens, agente])

  return { mensagens, enviar, carregando }
}
```

## Variáveis de ambiente (.env.example)

```env
ANTHROPIC_API_KEY=sk-ant-...

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Meu Agente IA
```

## Como usar este template

```bash
cp -r templates/agente-base meu-agente
cd meu-agente
npm install
cp .env.example .env.local
# Adicionar ANTHROPIC_API_KEY e credenciais Supabase
supabase link --project-ref SEU_PROJECT_REF
supabase db push
npm run dev
```

## Adicionar ferramentas (tool use)

```typescript
// lib/tools/buscar-produto.ts
import { Tool } from '@anthropic-ai/sdk/resources'

export const buscarProdutoTool: Tool = {
  name: 'buscar_produto',
  description: 'Busca informações sobre um produto no catálogo',
  input_schema: {
    type: 'object',
    properties: {
      nome: { type: 'string', description: 'Nome ou código do produto' }
    },
    required: ['nome']
  }
}

export async function executarBuscarProduto(input: { nome: string }) {
  // Buscar no Supabase
  const { data } = await supabase
    .from('produtos')
    .select('*')
    .ilike('nome', `%${input.nome}%`)
    .limit(5)
  
  return data ?? []
}
```
