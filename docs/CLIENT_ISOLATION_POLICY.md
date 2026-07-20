# Política de Isolamento de Clientes

> Esta política existe porque ela já foi violada uma vez: a auditoria de
> 2026-07-10 encontrou código, credenciais, screenshots e documentação
> operacional da Enemeop Flores dentro deste repositório (ver
> `docs/ENEMEOP_EXTRACTION_MAP.md` e o histórico de incidentes em
> `enemeop-flores/docs/SECURITY_INCIDENTS.md`). Esta política é o
> mecanismo para não repetir isso com o próximo cliente.

## 1. Proibição de dados específicos de clientes

Não podem existir neste repositório, em nenhuma branch:
- Nome de cliente, nome de produto/agente com marca do cliente (ex.: "Flora").
- IDs reais de Meta, Supabase, Vercel, Render de projeto de cliente.
- URLs de produção de cliente.
- Números de telefone, e-mails, CNPJ, endereços reais.
- Catálogo de produtos, preços, regras comerciais exclusivas de um cliente.
- Histórico de decisão operacional de um cliente (changelog, roadmap,
  incidentes) — isso vive no repositório do cliente.

## 2. Política de credenciais

- Nenhum valor real de credencial em arquivo versionado, nunca — nem como
  "exemplo", nem como fallback de `env.get(...) ?? '<valor real>'`.
- `.env.example` só com placeholders (`SEU_TOKEN_AQUI`) ou vazio.
- `.credentials/` segue allowlist no `.gitignore` (só `README.md`/`INDICE.md`
  versionados, tudo mais bloqueado por padrão — ver `.gitignore` deste
  repositório).
- Credencial real de um cliente nunca fica na Fábrica, nem localmente —
  fica em `.credentials/` do repositório do cliente.

## 3. Política de exemplos fictícios

- Exemplos em `.claude/agents/*.md`, `templates/`, `testes/` devem usar
  nomes claramente fictícios (ex.: "Floricultura Primavera", "FloraGestão")
  e ser explicitamente rotulados como exemplo (seção "Exemplos" ou
  "Exemplos reais — Floricultura" já é o padrão adotado).
- Um exemplo nunca deve conter um ID real, URL real ou valor de produção
  real, mesmo que o nome do cliente esteja mascarado — um ID real
  identifica o cliente independente do nome usado ao lado.
- Um exemplo não pode ser, na prática, uma chamada de API documentada com
  parâmetros reais de produção (achado corrigido nesta auditoria: ver
  item de `marketing.md` em `ENEMEOP_EXTRACTION_MAP.md`).

## 4. Política de logs e screenshots

- Nenhum screenshot de sessão de configuração real (login, dashboard,
  painel de provedor) deve ser commitado neste repositório.
- `.playwright-mcp/` já está no `.gitignore`. Isso não é suficiente — a
  auditoria encontrou 46 screenshots soltos na raiz do repositório,
  versionados via `git add -A` do hook de auto-commit, fora de
  `.playwright-mcp/`. Regra: qualquer novo screenshot de depuração deve
  ficar em `.claude/scratch/` (ou equivalente), adicionado ao `.gitignore`
  antes do primeiro uso — nunca solto na raiz.
- Nenhum log de aplicação com dados de cliente (mensagens de WhatsApp,
  nomes de clientes reais, pedidos) deve ser commitado.

## 5. Política de documentação

- Documentação genérica (como criar um SaaS, como configurar um provedor
  de infraestrutura, contrato de um agente) fica na Fábrica.
- Documentação operacional de um cliente específico (estado atual,
  pendências, decisões, changelog, credenciais indexadas) fica **somente**
  no repositório do cliente, nunca duplicada aqui.
- Documentos de "instruções de setup de notebook/ambiente" que misturam
  passo genérico com credencial real de um cliente (achado real desta
  auditoria) são proibidos — o passo genérico fica aqui, sem nenhum valor
  real embutido.

## 6. Política de variáveis de ambiente

- Toda env var citada em código genérico da Fábrica deve ter um nome
  genérico (`LLM_API_KEY`, não `ANTHROPIC_API_KEY_ENEMEOP`).
- Nenhum default de env var pode conter um valor real, nunca — nem em
  `.env.example`, nem como fallback em código (`?? 'valor_real'`).
- Toda env var específica de cliente (ex.: `META_VERIFY_TOKEN` com valor
  preenchido) deve ser identificada e movida para o `.env.example` do
  cliente antes do commit.

## 7. Critérios para decidir se algo é genérico ou específico

Pergunte, nesta ordem:
1. **Tem nome de cliente, marca, produto ou ID real?** → específico.
2. **Tem endereço, coordenada, CEP, telefone ou e-mail real?** → específico.
3. **É uma regra de negócio com valor fixo (limiar de aprovação, desconto,
   markup) que não vem de configuração?** → provavelmente específico, ou
   pelo menos precisa de parametrização antes de ficar aqui.
4. **É uma chamada de API documentada com parâmetros reais de produção
   (não um exemplo ilustrativo)?** → específico, mesmo que o arquivo em
   volta seja genérico.
5. **Funcionaria sem alteração para um cliente de outro segmento
   (clínica, e-commerce, escritório)?** Se sim → genérico. Se a resposta
   for "só com um find-and-replace de nome" → ainda é específico, porque
   o valor está fixo, não configurável.

## 8. Checklist para revisão antes de commit

- [ ] Nenhum nome de cliente real no diff.
- [ ] Nenhum ID de projeto (Supabase, Vercel, Meta) real no diff.
- [ ] Nenhum valor de credencial, mesmo como fallback ou exemplo, no diff.
- [ ] Nenhum screenshot novo fora de um diretório ignorado.
- [ ] Nenhuma regra de negócio com valor fixo sem comentário indicando que
      deveria ser configurável.
- [ ] `git diff --check` sem espaços em branco problemáticos (checagem
      básica de higiene, não específica desta política, mas parte do
      hábito de revisão).

## 9. Checklist para criação de um novo SaaS

Ver `docs/NEW_SAAS_GUIDE.md` para o fluxo completo. Checklist mínimo antes
de considerar o novo SaaS "isolado":
- [ ] Repositório próprio criado, fora da Fábrica.
- [ ] `.env.example` do novo repositório sem nenhum valor real.
- [ ] `.credentials/` do novo repositório protegido no `.gitignore` desde
      o primeiro commit (allowlist, não blocklist).
- [ ] Nenhum import ou caminho relativo que aponte para dentro do
      repositório da Fábrica.
- [ ] Nenhuma referência ao nome do novo cliente dentro do repositório da
      Fábrica.
