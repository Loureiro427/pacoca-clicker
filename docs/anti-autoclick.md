# Proteção de cliques manuais

`ManualClickGuard` é aplicado em `ClickExperience` antes de creditar um toque.
Aceita eventos nativos (`isTrusted`), rejeita eventos disparados por JavaScript,
limita a 20 cliques em uma janela móvel de 1 segundo e 120 em 10 segundos.
Excessos iniciam uma pausa de 30 segundos nos cliques manuais, sem banir a conta
ou apagar progresso. Repetição de tecla mantida pressionada
é suprimida; ativações individuais por teclado e acessibilidade continuam válidas.
Cliques em outra aba ou com a página oculta não são creditados pela interface.

Os limites são de cliques **manuais**, compartilhados por mouse, toque e teclado.
Não afetam PPS, produção offline ou automação obtida por talentos.

## Integração necessária no servidor

Esta é uma barreira local, não uma garantia contra trapaças. Autoclickers nativos
podem gerar eventos confiáveis e operar abaixo dos limites. Código do navegador,
armazenamento e estado de progresso podem ser adulterados.

O backend deve validar ganhos, cliques e tempo decorrido contra o último estado
aceito antes de atualizar save/ranking. Validar também compras, talentos, bônus,
tempo offline e revisões. Usar tempo do servidor; não confiar em contadores ou
flags enviados pelo cliente. Qualquer aplicação de penalidades precisa de uma
regra própria do servidor, com cuidado para não confundir cliques humanos rápidos,
latência e dispositivos de acessibilidade com automação.

## Pausa por excesso de cliques

Ao ultrapassar o limite, cliques manuais ficam bloqueados por 30 segundos, com
contagem regressiva na tela. Tentativas durante a pausa não reiniciam o prazo.
PPS, coleta offline e automação de talentos continuam funcionando. A pausa
atual é local à sessão; a API precisa aplicar a mesma regra por conta entre
dispositivos para que ela proteja o ranking.
