# Skill: /sincronizar

Sincroniza os dois repositórios do projeto (fabrica-saas e enemeop-flores) com o GitHub — enviando commits locais e baixando alterações do outro computador.

## Quando usar
- Na primeira sessão do dia (roda automaticamente via hook, mas pode ser chamado manualmente)
- Após trabalhar no notebook e querer trazer as mudanças para o desktop (ou vice-versa)
- Quando suspeitar que os repos estão desatualizados

## O que fazer

Execute o script de sincronização:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sincronizar-repos.ps1
```

Para forçar sync mesmo já tendo rodado hoje:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/sincronizar-repos.ps1 -Force
```

## O que o script faz

1. Verifica se já sincronizou hoje (arquivo `.claude/.last-sync`) — sai silenciosamente se sim
2. No repo **fabrica-saas**: `git pull` + `git push` se houver commits locais
3. No repo **enemeop-flores**: mesma lógica (detecta o caminho automaticamente como pasta irmã)
4. Grava a data de hoje em `.claude/.last-sync`

## Avisos importantes

- Se houver **alterações não comitadas**, o script avisa mas não aborta — o `git pull` pode falhar com conflito
- Solução: commitar antes de sincronizar
- O script detecta o caminho do enemeop-flores automaticamente (pasta irmã da fábrica) — funciona no desktop e no notebook sem configuração
