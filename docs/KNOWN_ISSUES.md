# KNOWN ISSUES — Problemas confirmados

> Registrar apenas problemas com evidência objetiva. Nunca hipóteses. Remover quando resolvido (mover resumo relevante para `DECISIONS.md`).

## META_IG_ACCESS_TOKEN incompatível com endpoint de mensagens

- **Status:** token novo gerado e salvo (2026-07-01, via Instagram Business Login) — **aguardando teste de DM real** para confirmar se resolveu
- **Data:** 2026-07-01
- **Evidência:** log real de `webhook-meta` v22, teste de DM real para @enemeopflores:
  `[webhook-meta] erro DM status=400 endpoint=ig corpo={"error":{"message":"Invalid OAuth access token - Cannot parse access token","type":"OAuthException","code":190}}`.
  Diagnóstico de metadados do token (`[diag-token]`) na mesma execução: `igTokenPresente=true length=162 trimLength=162 leadingWhitespace=false trailingWhitespace=false hasQuote=false hasNewline=false looksLikeJson=false igIdPresente=true igIdUsado=true endpointUsado=ig` — descarta malformação por caractere (espaço/aspas/quebra de linha/JSON acidental) e confirma que o endpoint usado está correto.
- **Causa:** o token é um Instagram User Access Token gerado via Graph API Explorer no app Meta principal (`enemeopflores`, app_id `512230540723061`), não via fluxo Instagram Business Login do app `enemeopflores-IG` (app_id `1403719804436572`).
- **Próxima ação:** pedir DM real "teste" para @enemeopflores e verificar logs da `webhook-meta`. **Se falhar de novo:** não gerar outro token — a próxima causa provável, já documentada, é o host do endpoint: a documentação oficial do Instagram API with Instagram Login exige `graph.instagram.com`, mas o código atual (`supabase/functions/webhook-meta/index.ts`) usa `graph.facebook.com` (fonte: [Send Messages using the Instagram API with Instagram Login](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api/) — "Todos os pontos de extremidade podem ser acessados via host `graph.instagram.com`"). Corrigir isso exigiria diff + aprovação + deploy separados.

## Host do endpoint de mensagens pode estar incorreto (graph.facebook.com vs graph.instagram.com)

- **Status:** suspeita documentada, não confirmada em produção — só investigar se o teste de DM com o novo token falhar
- **Data:** 2026-07-01
- **Evidência:** doc oficial da Meta (Instagram API with Instagram Login) afirma que todos os endpoints usam host `graph.instagram.com`. O código de `webhook-meta` usa `https://graph.facebook.com/v21.0/${igId}/messages`.
- **Causa provável:** mistura entre os dois modelos de integração Instagram da Meta ("API with Facebook Login", que usa `graph.facebook.com` + Page Access Token, vs "API with Instagram Login"/Business Login, que usa `graph.instagram.com` + Instagram User Access Token).
- **Próxima ação:** só tratar como alteração de código separada (diff + aprovação + deploy) se o teste de DM com o token novo confirmar que o erro persiste.
