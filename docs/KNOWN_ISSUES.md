# KNOWN ISSUES — Problemas confirmados

> Registrar apenas problemas com evidência objetiva. Nunca hipóteses. Remover quando resolvido (mover resumo relevante para `DECISIONS.md`).

## META_IG_ACCESS_TOKEN incompatível com endpoint de mensagens

- **Status:** aberto — aguardando geração de token pelo fluxo correto
- **Data:** 2026-07-01
- **Evidência:** log real de `webhook-meta` v22, teste de DM real para @enemeopflores:
  `[webhook-meta] erro DM status=400 endpoint=ig corpo={"error":{"message":"Invalid OAuth access token - Cannot parse access token","type":"OAuthException","code":190}}`.
  Diagnóstico de metadados do token (`[diag-token]`) na mesma execução: `igTokenPresente=true length=162 trimLength=162 leadingWhitespace=false trailingWhitespace=false hasQuote=false hasNewline=false looksLikeJson=false igIdPresente=true igIdUsado=true endpointUsado=ig` — descarta malformação por caractere (espaço/aspas/quebra de linha/JSON acidental) e confirma que o endpoint usado está correto.
- **Causa:** o token é um Instagram User Access Token gerado via Graph API Explorer no app Meta principal (`enemeopflores`, app_id `512230540723061`), não via fluxo Instagram Business Login do app `enemeopflores-IG` (app_id `1403719804436572`).
- **Próxima ação:** gerar token pelo fluxo correto (Meta Dashboard → `enemeopflores` → API do Instagram → Configuração da API com login do Instagram → conta @enemeopflores, Instagram ID `17841402064363907`), com escopos `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, converter para long-lived (60 dias) e salvar em `META_IG_ACCESS_TOKEN` (Supabase Edge Function Secret).
