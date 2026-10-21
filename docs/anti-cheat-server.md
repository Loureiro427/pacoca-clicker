# Anticheat — estado da proteção e integração da API

## O que foi implementado neste repositório

- Eventos de clique sintéticos e cadências excessivas são filtrados na interface
  (`ManualClickGuard`): 20/s e 120/10s; teclas mantidas não repetem cliques.
- Estruturas usam o preço do catálogo, nunca o argumento recebido da interface.
  IDs desconhecidos, lotes fora de 1/10/100, valores negativos/não finitos e
  quantidades inválidas não geram compras.
- Melhorias exigem saldo e estruturas. Talentos exigem ouro inteiro e caminho.
- Callbacks de prestígio e coleta offline não podem pagar repetidamente. Respec
  não reembolsa IDs duplicados.
- O tick usa `performance.now()`, sem crédito negativo e com teto de 24h por tick.
  Alterar o relógio civil não injeta dias de PPS no loop ativo.
- Cliques com estado não finito ou ganho que causaria overflow são rejeitados.
- Saves são validados antes de gravar **e** antes de enviar. A validação restringe
  campos, IDs, duplicatas, inventário, requisitos de melhorias, caminhos de talentos,
  saldo versus produção histórica, marcos de prestígio e timestamps futuros.
- Respostas sem `saved: true` não são apresentadas como salvamento confirmado.

Essas barreiras reduzem erros e explorações locais, mas são removíveis por quem
controla o cliente. Nenhum save recebe selo de “legítimo” só por passar no schema.

## O que AINDA NÃO está protegido no servidor

Este repositório contém o cliente Vite/Capacitor, não o backend do pacoca.net.
A API ainda recebe um snapshot em `PUT /clicker/progress`. Um cliente adulterado
pode fabricar um snapshot estruturalmente válido, eventos nativos ou ganhos
offline. O antiautoclick local não é uma prova de interação humana. Saves locais
mais recentes ainda participam da recuperação offline existente; seus timestamps
não podem ser tratados como autoridade na competição.

Não foram adicionados endpoints fictícios ou campos `verified` enviados pelo
cliente. Não houve mudança unilateral no contrato do serviço já integrado.

## Implementação prioritária para o João

1. **Estado autoritativo por conta.** Autenticar todas as operações, usar o ID da
   sessão e nunca um ID declarado pelo save. Ranking deve consultar somente
   progresso confirmado e calculado pelo backend.
2. **Transação e revisão.** Bloquear a linha/perfil ao processar ações. Comparar
   revisão esperada, atualizar estado, revisão e classificação atomicamente.
   Requisições repetidas devem usar idempotência para não pagar de novo.
3. **Cálculo de ações no servidor.** Receber intenções (cliques, ID/quantidade de
   compra, aprendizado, respec, renascimento, coleta), recalcular custos e efeitos
   com o catálogo versionado. Não aceitar saldo/PPS/multiplicadores enviados como
   verdade. A migração deve ser versionada para manter clientes antigos compatíveis.
4. **Limites por conta em todas as sessões.** Implementar janelas móveis de 20
   cliques/s e 120/10s, em armazenamento compartilhado entre instâncias. Contar
   ações aceitas; repetição/replay não gera ganho. Rate limit de HTTP é separado
   do limite de cliques quando o cliente enviar lotes.
5. **Tempo do servidor.** Calcular produção passiva desde o último checkpoint
   confirmado. Limitar offline a 24h (com o bônus legítimo de talento aplicado
   uma vez). Não usar `lastSaveTime` ou relógio do cliente como fonte autoritativa.
6. **Eventos dourados e críticos.** Sorteio e validade precisam ser decididos no
   servidor. Eventos coletáveis têm ID, expiração e consumo único. Críticos não
   devem ser declarados livremente pelo cliente.
7. **Recompensa dobrada.** O botão atual é uma simulação local. Antes de contar
   em competição real, exigir prova verificada de anúncio/provedor ou uma regra
   explícita do servidor. Cada direito de recompensa tem consumo único.
8. **Recuperação.** Em rejeição, devolver o estado canônico e motivo legível.
   Guardar auditoria de eventos rejeitados sem registrar tokens/senhas. Não banir
   automaticamente por uma única divergência ou por usar acessibilidade.

Enquanto o serviço aceitar snapshots, validar pelo menos schema e transições
contra o último checkpoint, com tempo do servidor e revisões. Isso é mitigação,
não substitui simulação autoritativa: bônus como +1% do saldo no frenesi tornam
um teto simples de saldo insuficiente para provar legitimidade.

## Casos de teste obrigatórios na API

- Dois dispositivos clicam/compram simultaneamente na mesma revisão.
- Repetir a mesma coleta, renascimento ou lote de ações não muda o saldo duas vezes.
- Lote negativo, custo forjado, IDs extras, NaN, infinito, talento sem caminho e
  melhoria sem estruturas são recusados sem modificar o checkpoint válido.
- Limites de cliques valem entre abas, dispositivos e múltiplas instâncias da API.
- Alterar relógio, data do save ou conteúdo do localStorage não concede ouro/PPS.
- Colheita offline em duas abas e anúncio duplicado só pagam uma vez.
- Sessão de A não pode consultar/resetar/atualizar progresso de B.
- Apenas progresso canônico aparece no ranking; o cliente não escolhe posição.
- Cliques humanos rápidos abaixo dos limites e automação de talentos continuam
  funcionando; não contar o talento automático como clique manual.

Saves legados podem já conter alterações impossíveis de provar só pelo snapshot.
Definir uma política de migração/entrada no ranking; não presumir legitimidade
retroativa nem apagar progresso antigo silenciosamente.
