# Integração do Paçoca Clicker — guia único para o João

Este artigo substitui os documentos separados de ranking, perfil, suporte e anticheat. Este repositório contém o cliente Vite/Capacitor; o backend do pacoca.net deve implementar e validar as rotas abaixo. As rotas de códigos e suporte são contratos propostos pelo cliente, não serviços já publicados ou testados em produção.

## 1. Ordem de implementação e ambiente

1. Confirmar login, bootstrap e salvamento por revisão; impedir sobrescrita de progresso canônico por snapshots antigos.
2. Corrigir o envio do suporte no servidor.
3. Cadastrar os IDs permanentes das contas de administração e implementar campanhas/resgates transacionais.
4. Validar métricas do ranking e proteção das ações no servidor.
5. Testar web e Android com contas comuns e da equipe antes de publicar.

`src/api/PacocaApi.js` centraliza as chamadas: `VITE_PACOCA_API_URL` (padrão `https://api.pacoca.net/api`), token Bearer e `X-Device-Id`. O dispositivo não substitui autenticação. Login `/login`, 2FA `/2fa/verify`, bootstrap `/clicker/bootstrap`, progresso `PUT/DELETE /clicker/progress` e ranking `/clicker/ranking` já têm integração no cliente.

`npm run dev` usa usuário/progresso/ranking de demonstração. Códigos e suporte não simulam sucesso nem concedem recompensas nesse modo. Para testar API real: configurar `.env`, executar `npm run build` e `npm run preview`. Após alterações: `npm test`, `npm run build`, `npx cap sync android`, gerar/reinstalar APK. Não publicar credenciais no Git ou em variáveis VITE.

## 2. Ranking e renascimento: resolver a divergência de expectativa

O ranking atual de paçocas mede **produção histórica (`totalEarned`)**, não o saldo (`score`). Por isso 1,18 bi no cabeçalho e 55,41 bi no ranking podem estar corretos. Renascer zera saldo, inventário e melhorias, preservando histórico, talentos, conquistas e cliques. Novos ganhos continuam acumulando no histórico. Ainda não foi escolhida outra regra pela equipe.

Não zerar `totalEarned` para consertar o ranking: os marcos de renascimento dependem dele e de `claimedPrestigeChips`, que impede repetir ouro já recebido. Se a equipe escolher uma classificação por ciclo, adicionar um contador próprio de produção da vida atual, migrá-lo e zerá-lo atomicamente ao renascer, ajustando descrição, cliente e API juntos. Se escolher saldo, usar `score` e deixar claro que compras também reduzem a posição.

No backend, ranking deve **substituir a métrica pelo valor canônico**, nunca somar novamente um snapshot cumulativo a cada atualização. Revisar se os valores armazenados são produção histórica legítima ou somas duplicadas; corrigir com checkpoint/auditoria, sem apagar contas arbitrariamente.

Categorias atuais: `fortune = totalEarned`; `gold = prestigeChips` disponível após gastos; `structures = soma do inventário atual`. Ouro e estruturas podem diminuir. GET `/clicker/ranking?category=fortune` e bootstrap.ranking retornam:

```json
{
  "category": "fortune",
  "players": [{"position": 1, "value": 4200000, "user": {"id": 42, "name": "Nome", "user_name": "nome", "img_account": null}}],
  "current_player": {"position": 186, "value": 123400, "user": {"id": 7, "name": "Você", "user_name": "voce", "img_account": null}},
  "total_players": 1200,
  "updated_at": "2026-10-21T14:00:00Z"
}
```

`players` obrigatório, pode ser vazio; posições positivas únicas, desempate estável do servidor; jogador não classificado pode ter position null. `current_player` pode ser null. `value` numérico finito não negativo. Avatar HTTP(S) ou caminho relativo ao CDN. Não retornar emails/tokens. Lista e colocação pessoal devem vir do mesmo snapshot.

A tela mostra todos os registros recebidos, sem paginação; não há limite de 20 imposto pelo frontend. Limitar líderes no backend (ex.: 50) e sempre retornar colocação pessoal e total global. Atualização após salvar, gastar ouro ou renascer deve refletir o progresso canônico. Arquivos: `RankingUI.js`, `RankingData.js`, `RankingDemo.js`.

## 3. Suporte/Discord — envio relatado como não funcionando

A causa da falha de produção ainda não foi comprovada. Antes havia envio direto com `VITE_SUPPORT_WEBHOOK`: a variável era local/ignorada no Git, podia faltar no build de outro computador e expunha a URL no bundle. Também verificar resposta do Discord, webhook revogado, timeout e configuração de rede. Não registrar a URL secreta nos logs.

**O fluxo principal do app agora está preparado para `POST /clicker/reports` autenticado.** `main.js` injeta `ReportsClient({ api })`; não usa o webhook do cliente. O transporte direto antigo permanece isolado na classe para compatibilidade/testes, mas não é o caminho do app. Até João implementar a rota, o formulário exibirá erro real, sem falso sucesso. Retirar `VITE_SUPPORT_WEBHOOK` dos ambientes de build e rotacionar a URL que já foi distribuída.

Pedido:
```json
{"type":"problem","category":"save","message":"Meu progresso não apareceu.","platform":"android","request_id":"uuid"}
```

`type`: problem/suggestion; category: gameplay/save/account/ranking/audio/visual/other; mensagem não vazia até 500 unidades UTF-16 (mesmo contador do maxlength do app). Validar no servidor, obter identidade pela sessão, limitar por conta/IP (ao menos 1/minuto), deduplicar request_id por usuário e registrar entrega. Nunca aceitar URL de webhook no pedido.

Guardar `DISCORD_SUPPORT_WEBHOOK` somente no ambiente do backend (sem VITE). Enviar ao Discord com `allowed_mentions: {parse: []}`, `wait=true`, identidade da sessão, assunto, plataforma e data do servidor. Confirmar o ID retornado pelo Discord antes de responder:
```json
{"sent":true,"report_id":"recibo-do-servidor"}
```

O cliente exige ambos os campos. Retornar status HTTP correto e `{message: "Mensagem clara"}` em falhas; 401 sessão, 422 validação, 429 limite, 502/503 entrega indisponível. Em timeout, pode haver entrega sem recibo: não reenviar automaticamente. Uma fila pode existir, mas não responder `sent: true` apenas por ter enfileirado. Testar envio real em canal de teste, falhas, sem rede, duplicidade e Android. Nenhum teste automatizado deste repositório publica no Discord.

## 4. Códigos — interface pronta, servidor pendente

Perfil → **Resgatar código** disponível para todos. Código normalizado com trim e maiúsculas, 3–40 caracteres ASCII: letras, números, `_` e `-`, começando com letra/número. Cada campanha vale **uma vez por ID de usuário**, independentemente de dispositivo, logout, reinstalação ou renascimento. Não usar localStorage como prova de consumo.

Perfil → **Códigos da equipe** aparece para user_name `joao` e `Bochecha` (sem diferenciar caixa ou @). Isso é somente apresentação. O formulário de gerenciamento fica oculto até a API retornar `can_manage: true`; alterar JS, nome de usuário ou resposta local não deve permitir operações no servidor.

### Autorização administrativa

Resolver no banco os perfis [@joao](https://pacoca.net/@joao) e [@Bochecha](https://pacoca.net/@Bochecha), conferir identidade e guardar **IDs imutáveis** em papel/permissão do backend. Nunca autorizar por texto recebido do cliente nem confiar em username mutável. Mudanças de nome não transferem privilégios; uma nova conta que adote um nome antigo não herda acesso. Aplicar a permissão em GET/POST/PATCH/DELETE e auditar autor, data e alterações. Não acrescentar campos de admin no save do jogo.

### Rotas esperadas pelo cliente

Todas relativas à base da API, autenticadas:

| Método e rota | Pedido | Resposta de sucesso |
| --- | --- | --- |
| GET `/clicker/codes/admin` | — | `{ "can_manage": true, "codes": [...] }` |
| POST `/clicker/codes/admin` | campanha abaixo + request_id UUID | `{ "created": true, "code": {...} }` |
| PATCH `/clicker/codes/admin/:id` | `{ "active": false }` ou true | `{ "updated": true }` |
| DELETE `/clicker/codes/admin/:id` | — | `{ "deleted": true }` |
| POST `/clicker/codes/redeem` | `{ "code": "PACOCA2026", "request_id": "uuid", "revision": 12 }` | `{ "redeemed": true, "profile": { "state": "ESTADO COMPLETO", "revision": 13 } }` |

`state` acima é um objeto de progresso completo compatível com `SaveManager.validate`, não uma string nem apenas o delta da recompensa. Revisão deve ser inteira e maior que a atual. O app salva antes de pedir o resgate, suspende gravações durante a aplicação e recarrega com o estado canônico após confirmação. Não credita moedas localmente com base apenas no código digitado. Em timeout, mantém o código e reutiliza request_id na mesma tela. O servidor precisa de idempotência durável mesmo após recarga/novo request_id e da unicidade usuário+campanha.

Campanha criada e registro da lista:
```json
{
  "id": "campaign-uuid",
  "code": "PACOCA2026",
  "reward_type": "coins",
  "amount": 100000,
  "active": true,
  "expires_at": "2026-12-31T23:59:59Z",
  "max_redemptions": 1000,
  "redemptions_count": 0
}
```

Na criação, não enviar/aceitar `id` ou contagem escolhida pelo cliente. O formulário envia `code`, `reward_type`, `amount`, `active`, `expires_at` e `max_redemptions`, mais request_id. reward_type coins/gold; amount inteiro de 1 a 10^12 (servidor pode impor teto menor); limite total null (ilimitado) ou inteiro 1..10^9; validade null ou futura ISO UTC. Interface converte horário local para UTC. Código precisa de unicidade normalizada inclusive entre excluídos; impedir recriar o mesmo texto para driblar o limite de um uso. Criações repetidas com mesmo request_id retornam a campanha já criada; mesmo ID com conteúdo diferente é conflito.

Não editar recompensa/quantidade de campanha já criada: desativar e criar outra com novo código para preservar auditoria. Ativar campanha expirada não altera sua validade. Exclusão deve ser lógica/tombstone, interromper novos resgates e preservar histórico/consumos. A confirmação de exclusão acontece no próprio cartão. Não retirar recompensas já concedidas ao desativar/excluir.

### Transação de resgate (obrigatória)

1. Autenticar e obter ID da sessão; normalizar/validar código e limitar tentativas por conta/IP.
2. Bloquear campanha e perfil em ordem consistente; conferir idempotência e revisão. Campanha inexistente, desativada, excluída, expirada, esgotada ou já consumida não paga.
3. Inserir consumo com UNIQUE(campaign_id, user_id), limitado globalmente, e atualizar progresso e revisão na **mesma transação**. Não separar check e insert sem bloqueio/constraint.
4. `coins`: aumentar score e totalEarned pelo mesmo valor, preservando score <= totalEarned. A regra escolhida aqui conta o presente no histórico/marcos; caso a equipe prefira excluir presentes, versionar a economia antes de mudar.
5. `gold`: aumentar prestigeChips; não alterar claimedPrestigeChips nem conceder novamente marcos de renascimento. Verificar overflow e todos os invariantes do save.
6. Atualizar ranking a partir do estado resultante (sem somar snapshots) e devolver o perfil completo/revisão. Em repetição, retornar recibo/estado canônico atual, nunca recompensar de novo ou devolver revisão antiga.
7. Rejeitar saves de revisão anterior (incluindo de outro dispositivo) após a recompensa, retornando perfil canônico no fluxo de conflito já suportado. Caso contrário, o autosave antigo pode apagar o presente.

Erros com HTTP 401/403/404/409/422/429 e `{message}` legível: sem acesso, inexistente, já usado, revisão conflitante, expirado, desativado, limite esgotado. Falha de rede não prova que a transação falhou. Não permitir reset de progresso apagar consumos de campanhas. Testar disputas entre dois dispositivos, dois usuários pelo último resgate, repetição com mesmo/novo request_id e falha após commit.

Arquivos: `src/ui/CodesUI.js` (diálogos/lista), `src/systems/CodesClient.js` (validação/aplicação de confirmação), `PacocaApi.codesRequest` (timeout 15s). Não há banco de campanhas ou gerador secreto no cliente.

## 5. Progresso, perfil e anticheat no servidor

O perfil usa `{id,name,user_name,img_account}`. `updateAccountProfile` e `updateAccountSyncStatus` estão ligados ao bootstrap e SaveManager; consulta contínua aos dados sociais ainda precisa ser conectada. Status de save não prova sincronização de nome/avatar. Sem backup manual no app: progresso da conta na nuvem, com cache local para recuperação/offline.

`PUT /clicker/progress` recebe state e revision; confirmar com `saved: true` e profile.revision. Em conflito, retornar `{saved:false, profile:{state,revision}}` canônico (o SaveManager atual trata esse corpo em resposta HTTP de sucesso e recarrega). Se usar HTTP 409, adaptar o cliente para esse contrato; não misturar sem tratar. Não escolher autoridade pela data fornecida pelo dispositivo. Reset remoto deve confirmar exclusão; logout/troca de conta não pode cruzar saves. Cache tem chave por usuário.

Barreiras locais já existentes: preços de catálogo, lotes 1/10/100, requisitos, caminhos de talentos, schema de save, bloqueio de duplicidade de prestígio/coleta offline, relógio monotônico no tick e limite de 24h, cliques sintéticos filtrados. **Isso não torna um snapshot confiável**: tudo pode ser adulterado por quem controla o cliente.

Implementar estado autoritativo por conta, ações/intenção validadas por servidor com catálogo versionado, revisões, transações e idempotência. Não confiar em saldo/PPS/crítico/tempo enviados. Até migrar de snapshot para ações, validar transições contra checkpoint e tempo do servidor; isso é mitigação, não prova de legitimidade.

Antiautoclick: máximo 20 cliques manuais/1s e 120/10s (janelas móveis); excedeu → pausa de **30 segundos**, tentativas durante a pausa não estendem. Implementar por conta em armazenamento compartilhado entre dispositivos/instâncias. Automação legítima de talentos e PPS não são cliques manuais; limite HTTP separado de ações em lotes. Não banir por uma divergência isolada ou acessibilidade.

Servidor calcula produção passiva/offline (teto 24h com bônus legítimos), sorteia críticos/eventos dourados, expiração e consumo único. Recompensa dobrada de anúncio ainda é simulação local: exigir prova do provedor ou regra explícita antes de aceitar em competição. Não assinar snapshots com segredo embutido no app. Definir política para saves legados sem apagar progresso silenciosamente.

## 6. Navegação, termos e validação final

`AppNavigation.js` fecha modal antes de voltar à aba anterior. Android na raiz oferece confirmação de saída; site respeita histórico do navegador (não força fechar aba). Campos editáveis preservam edição/colagem; seleção/cópia fora deles é bloqueada no mobile por interface, não como medida de segurança. Testar teclado aberto, Escape/Voltar, modal offline, envio pendente, sem rede e retorno ao app.

Termos no app vêm de `src/ui/GameTerms.js`. O texto completo foi preservado abaixo para reutilização. Faltam responsável formal e contato de privacidade (equipe pediu para deixar pendente). Não há aceite contratual registrado. Antes da publicação definitiva, completar contato, retenção/acesso a reports, tratamento de dados e revisão dos termos.

Checklist de entrega: autenticação real/2FA/logout, saves entre dispositivos/conflitos, prestígio sem repetir ouro, ranking após renascimento/gastos/presentes, reports reais e falhas, usuário comum bloqueado em TODAS as rotas administrativas, somente IDs autorizados gerenciando, campanhas esgotadas/expiradas/excluídas, resgate único após reset/reinstalação, timeout sem pagamento duplicado, layout mobile/desktop e navegação Android. Testes unitários usam transportes simulados; build/sync não confirmam integração de produção.

---

## Apêndice: texto dos termos e diretrizes para reutilização

# Paçoca Clicker — Termos e diretrizes

Versão 21/10/2026

## 1. Sobre estas regras

Estas orientações explicam o uso do Paçoca Clicker no aplicativo e no site. O jogo é de entretenimento: paçocas, ouro, estruturas e posições no ranking são elementos virtuais e não representam dinheiro, investimento ou prêmio financeiro. A consulta desta tela não registra aceite contratual.

## 2. Conta e segurança

O acesso usa a conta do pacoca.net. Proteja sua senha e seus códigos de autenticação; a equipe nunca pede esses dados no formulário de suporte. Não use contas de terceiros nem se passe por outra pessoa. Os serviços da conta no pacoca.net também possuem regras próprias, que devem ser consultadas no site.

## 3. Uma competição justa

Não use autoclickers externos, scripts, bots, exploração de falhas, adulteração de saves ou chamadas indevidas à API para obter vantagens. A automação oferecida pelos próprios talentos faz parte do jogo. Recursos de acessibilidade são permitidos quando usados para interação pessoal, sem automatizar ganhos. Se encontrar uma falha, reporte-a sem explorá-la ou divulgar dados de outras pessoas.

## 4. Progresso e renascimento

O progresso é associado à conta e usa sincronização com a nuvem. Falhas de rede podem deixar envios pendentes; confira o status no perfil antes de trocar de dispositivo. Valores inconsistentes podem ser recusados ou corrigidos após apuração. Renascer reinicia saldo, estruturas e melhorias conforme a confirmação exibida, preservando os itens que a tela informa. Apagar progresso é uma ação separada, com confirmação, e não exclui a conta do pacoca.net.

## 5. Respeito à comunidade

Não envie assédio, ameaças, discriminação, conteúdo sexual inadequado, spam, propaganda ou informações privadas de outras pessoas. Use nomes e mensagens respeitosos. Reportes devem ser feitos de boa-fé; mensagens críticas sobre o jogo são bem-vindas quando descrevem o problema sem ataques pessoais.

## 6. Problemas e sugestões

O formulário aceita uma mensagem de até 500 caracteres, com tipo e assunto. Ao enviar, o texto, o nome/identificador da conta informado pelo app, a plataforma e a data são encaminhados à equipe em um canal do Discord. Não inclua senha, token, endereço, documentos ou dados sensíveis. A confirmação indica recebimento pelo canal, não resposta individual, prazo de solução ou promessa de implementar a ideia. Você continua titular dos direitos sobre seu conteúdo; o envio permite à equipe analisá-lo para atender a solicitação e melhorar o jogo.

## 7. Privacidade e armazenamento

O jogo usa dados da conta e de progresso para autenticação, salvamento e ranking, além de armazenamento local para sessão, preferências e recuperação de envios pendentes. Relatos são tratados pela equipe no Discord, um serviço de terceiro com política própria. Use o formulário para pedir esclarecimentos ou encaminhar uma solicitação de privacidade, sem enviar credenciais. Os dados devem ser usados para essas finalidades e mantidos apenas pelo tempo necessário ao atendimento e às obrigações aplicáveis. A identificação formal do responsável, contato específico e política completa de privacidade serão publicados pela equipe; este resumo não os substitui.

## 8. Menores de idade

Se você for menor de idade, use o jogo com a orientação e a autorização do responsável quando exigidas pela legislação e pelas regras da conta e da plataforma. Não envie informações pessoais no suporte. O jogo não define nesta tela uma classificação indicativa oficial nem dispensa as exigências de proteção de crianças e adolescentes.

## 9. Conteúdo e atualizações

A identidade visual, código, textos e demais conteúdos pertencem aos seus respectivos titulares. Jogar não transfere esses direitos. A equipe pode corrigir falhas, ajustar o equilíbrio e atualizar funcionalidades, informando mudanças relevantes. Não há promessa de disponibilidade ininterrupta; falhas de serviço devem ser reportadas para análise.

## 10. Apuração e direitos

Violações podem levar à análise de atividades, correção de ganhos indevidos, retirada de posições do ranking ou restrições proporcionais. Sempre que viável, a equipe deve explicar o motivo e permitir contestação pelo suporte. Nenhuma regra desta tela afasta direitos obrigatórios do consumidor ou de proteção de dados. Dúvidas sobre estas orientações podem ser enviadas pelo formulário no perfil.

