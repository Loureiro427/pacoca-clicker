# Reportes, sugestões, termos e navegação

## Estado atual — envio direto temporário

A pedido da equipe, o formulário envia diretamente ao Discord. O webhook informado
foi configurado em `.env.local`, ignorado pelo Git. A variável é
`VITE_SUPPORT_WEBHOOK`; `.env.example` contém somente o nome, sem credencial.

**Variáveis VITE são públicas no app/site compilado.** Não é um segredo protegido
por estar num arquivo ignorado. Qualquer pessoa pode extrair o webhook do bundle
e publicar mensagens no canal. O limite local não impede isso. Não use este
modelo como proteção de um canal sensível; o canal deve ser restrito à equipe.

No computador de outra pessoa ou em CI, configure a variável antes do build,
por um canal privado. Nunca copie o endereço para código versionado, prints,
logs ou esta documentação. Reinicie o Vite após mudar `.env.local`.

`src/systems/ReportsClient.js` valida tipo/assunto e 1–500 caracteres (unidades
UTF-16, como maxlength do navegador), permite uma tentativa por minuto por
instância e impede envios simultâneos. Usa `wait=true`, requer ID de mensagem
na resposta e desativa menções. Envia apenas texto, assunto, nome/ID declarados
no cliente, plataforma e data; não transmite token, senha, email ou save.
Identidade declarada pelo app não equivale a autenticação no servidor.

Em timeout ou resposta ambígua, pode haver entrega sem confirmação. Não há
reenvio automático: a mensagem é preservada e o usuário é orientado a aguardar.
Não existe garantia de entrega única na API direta de webhooks.

Os testes usam transporte simulado e não publicam mensagens reais no Discord.

## Migração para o servidor — João

1. Criar uma rota autenticada de suporte na API do pacoca.net. O app deve mandar
   somente tipo, assunto e mensagem, nunca o endereço do webhook.
2. Guardar o webhook em segredo de ambiente **do servidor**, sem prefixo VITE.
3. Validar de novo tamanho (até 500), enumerações e sessão. Obter nome e ID da
   conta no servidor; não confiar nos dados declarados pelo cliente.
4. Implementar limite por conta/IP, controle de spam e idempotência/replay entre
   abas/dispositivos. O cliente pode ser alterado ou ignorado.
5. Enviar ao Discord com menções desativadas e confirmar o resultado antes de
   responder sucesso. Não registrar URL secreta, senha ou token em logs.
6. Trocar `ReportsClient.send` para chamar a nova rota com o token do login.
7. Remover `VITE_SUPPORT_WEBHOOK`, refazer os builds web/Android, retirar versões
   antigas quando possível e **rotacionar o webhook**: o usado no cliente deve
   ser considerado público, mesmo após a migração.
8. Definir retenção, acesso ao canal e atendimento de pedidos de privacidade.

## Interface

`SupportUI.js` conecta os botões do perfil aos diálogos de relato e termos. Formulário
tem tipo, assunto, textarea com maxlength 500, contador, enviar/cancelar e aviso de
privacidade. Durante envio o fechamento é bloqueado por até o timeout, para não
apresentar como cancelada uma entrega que já pode ter ocorrido. Sucesso só aparece
depois do recibo do Discord. Erros mantêm o texto. O modo de desenvolvimento pode
enviar de verdade; relatórios de mock são identificados como demonstração.

## Voltar e seleção no mobile

`AppNavigation.js` registra abas e modais no histórico da sessão. Voltar fecha
primeiro a camada aberta, depois volta à aba anterior. O modal offline é coletado
normalmente ao voltar; a confirmação de prestígio é cancelada. Durante o envio de
um relato é necessário aguardar.

No Android nativo, `@capacitor/app` intercepta o botão/gesto Voltar. Na raiz há
confirmação para fechar, tentativa de salvar e espera limitada pela sincronização.
O site respeita o histórico do navegador; na raiz, Voltar pode sair do site.
Não forçamos fechar a aba: navegadores restringem `window.close()` para janelas
que não foram abertas por script.

No mobile, copiar/recortar/selecionar e menus de toque longo são bloqueados fora
dos campos editáveis. Textarea/input continuam permitindo edição e colagem.
Isso é uma preferência de interface, não proteção contra captura ou inspeção.

Após instalar dependências: `npm run build` e `npx cap sync android`, depois
gerar/reinstalar o APK. O plugin foi registrado, mas testes no aparelho continuam
necessários: teclado aberto, múltiplas abas, Escape/Voltar nos modais, cancelamento,
sucesso/erro, saída sem conexão e retorno do app ao primeiro plano.

## Texto legal entregue

Fonte única no app: `src/ui/GameTerms.js`. Cópia utilizável:
`docs/termos-e-diretrizes.md`. Sem identificação formal/contato fornecidos pela
equipe, o texto permanece uma versão de orientações, sem fluxo de aceite.
Antes de tratar como contrato/política final, completar responsável, canal de
privacidade, bases legais, retenção e classificação indicativa com revisão adequada.
O botão de leitura não grava aceite nem concordância automática.

Referências consultadas em 21/10/2026; o texto foi escrito para este jogo, sem copiar
cláusulas ou adotar a legislação estrangeira de outros editores:

- [Termos da Playsaurus, editora de jogos clicker](https://playsaurus.com/terms-and-conditions)
- [Política da DashNet: armazenamento e privacidade](https://dashnet.org/privacypolicy)
- [LGPD — Lei 13.709](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Código de Defesa do Consumidor](https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm)
- [Capacitor App: backButton e exitApp](https://capacitorjs.com/docs/apis/app)
- [Discord: execução de webhooks](https://docs.discord.com/developers/resources/webhook)
- [MDN: restrições de fechamento de janelas](https://developer.mozilla.org/en-US/docs/Web/API/Window/close)
