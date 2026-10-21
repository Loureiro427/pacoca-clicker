# Perfil — integração com pacoca.net

O perfil tem conta, ascensão, jornada, conquistas, áudio e exclusão do
progresso. Os IDs dos controles de autenticação (`btn-logout`), avatar, nome e
status de salvamento foram preservados.

## Pontos para o João conectar

`src/ui/ProfileAccount.js` expõe:

```js
updateAccountProfile(user, { isDemo: false });
updateAccountSyncStatus('syncing');
```

`user` tem o mesmo formato do login: `{ id, name, user_name, img_account }`.
`img_account` pode ser URL HTTP(S) ou caminho relativo a `VITE_PACOCA_CDN_URL`.
O fallback é a paçoca. Os valores são inseridos como texto, sem HTML.

`src/main.js` já chama `updateAccountProfile` após login e passa
`updateAccountSyncStatus` para `SaveManager.configure`. Quando houver uma API de
atualização contínua dos dados do site, chame `updateAccountProfile` com o novo
usuário. Essa consulta **ainda não foi implementada**: a interface informa
“Em preparação”. Não há botão de conexão fictício nem endpoint inventado.

Após atualizar a identidade, reaplique o estado de sincronização conhecido:
atualizar o perfil redefine a apresentação de sync para `pending`.

## Estados de progresso

- `pending`: nenhuma confirmação de salvamento recebida.
- `syncing`: envio em andamento.
- `synced`: usar somente depois da confirmação real do backend.
- `offline`: último envio falhou; há tentativa pendente.
- `conflict`: progresso mais recente foi encontrado na nuvem.
- Em `isDemo: true`, a interface sempre informa demonstração, mesmo se o mock
  responder sucesso. Não apresenta isso como confirmação real do pacoca.net.

Estados são de **progresso**; não significam que os dados sociais do site estão
sincronizados continuamente. O backend deve continuar autenticando o usuário e
aplicando suas regras de revisão de save.

## Regras de exibição

- Renascimento usa produção histórica e `claimedPrestigeChips`; o saldo de ouro
  é separado do total recebido. A barra indica o próximo marco histórico; um
  renascimento já disponível é informado separadamente no botão e na descrição.
- “Desde o início” mede o tempo de calendário desde `startTime`, incluindo
  períodos offline. Não representa horas ativas jogadas.
- Conquistas podem ser filtradas por todas, conquistadas e a conquistar.
- Música e efeitos mantêm as preferências existentes de armazenamento local.
- O progresso é salvo automaticamente na conta pela sincronização existente.
  Não há exportação, importação ou restauração manual por código.
- Apagar progresso usa `SaveManager.reset` com confirmação explícita. Isso não
  apaga a conta social no pacoca.net.

## Validação antes da publicação

Executar `npm test` e `npm run build`. No navegador/Android, conferir rolagem,
atalhos das seções, textos longos, filtros, switches com teclado e salvamento
com/sem conexão. Validar avatar e nome reais, logout, confirmação
de sync e reset em uma conta de teste. O modo de desenvolvimento usa mock;
testes reais exigem o ambiente conectado configurado pelo João.
