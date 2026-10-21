# Integração do ranking — Paçoca Clicker

A interface está em `src/ui/RankingUI.js`. O contrato e a normalização ficam em
`src/ui/RankingData.js`. O ponto de conexão é `PacocaApi.ranking(category)`, em
`src/api/PacocaApi.js`: hoje usa `GET /clicker/ranking?category=fortune`.
Se o backend usar outro endpoint ou formato, adapte esse método para devolver o
contrato abaixo. Não é necessário alterar o layout.

## Ambiente

Configure `VITE_PACOCA_API_URL` e `VITE_PACOCA_CDN_URL` conforme `.env.example`.
O cliente existente envia `Authorization: Bearer ...` e `X-Device-Id`.
**Em desenvolvimento (`npm run dev`), a API existente usa mock**, inclusive
autenticação e progresso. O ranking desse modo tem sete jogadores ilustrativos e seu perfil local,
e um aviso visível de demonstração. Para testar a integração real, use
`npm run build` e `npm run preview`, com as variáveis corretas no build.
Não remova apenas o aviso de demonstração: conecte a fonte real.

## Categorias

| Valor | Métrica esperada |
| --- | --- |
| `fortune` | `totalEarned`: produção total histórica, antes dos gastos |
| `gold` | `prestigeChips`: saldo atual de ouro, após gastos em talentos |
| `structures` | Soma das quantidades atuais no inventário |

O período é histórico, sem temporadas ou reinício periódico. Ouro e estruturas
podem diminuir após gastos ou renascimento. Se a regra de negócio mudar, alinhe
o cálculo no backend e as descrições em `RANKING_CATEGORIES`.

## Resposta esperada

```json
{
  "category": "fortune",
  "players": [
    {
      "position": 1,
      "value": 4200000000,
      "user": {
        "id": 42,
        "name": "Nome do jogador",
        "user_name": "nomedojogador",
        "img_account": "users/avatar.jpg"
      }
    }
  ],
  "current_player": {
    "position": 186,
    "value": 123400,
    "user": { "id": 7, "name": "Seu nome", "user_name": "voce", "img_account": null }
  },
  "total_players": 1200,
  "updated_at": "2026-10-21T14:00:00Z"
}
```

- `players` é obrigatório e pode ser vazio. Envie os líderes em uma lista
  limitada (sugestão: até 50). A interface exibe todos os registros recebidos,
  sem paginação; `total_players` representa o total global, não o tamanho da página.
- `position` é um inteiro positivo calculado pelo servidor. Para o jogador atual
  ainda não classificado, use `position: null`. Não omita posições nos registros
  de `players`. Posições 1, 2 e 3 formam o pódio, independentemente da ordem.
- Use posições únicas com desempate estável definido no servidor (por exemplo,
  pontuação decrescente, data em que atingiu a pontuação e ID).
- `value` é um número JSON finito e não negativo. Strings numéricas precisam ser
  convertidas no adaptador. Não envie `NaN`, `Infinity` ou números formatados.
- `current_player` pode ser `null`; ele pode aparecer também em `players`.
  Use a mesma consulta/snapshot para os líderes e a colocação pessoal.
- `total_players` e `updated_at` são opcionais. Sem eles a tela informa apenas
  quantos jogadores foram exibidos e quando a consulta foi feita.
- `img_account` aceita URL HTTP(S) ou caminho relativo ao CDN. Ausências e falhas
  usam a imagem da paçoca. Nomes são inseridos como texto, sem interpretar HTML.
- O bootstrap pode fornecer o mesmo objeto em `bootstrap.ranking` para a
  categoria `fortune`. Sem ele, a tela faz a consulta ao iniciar.

## Estados e operação

A tela consulta ao abrir o ranking, trocar categoria ou clicar em Atualizar.
Respostas de categorias antigas são ignoradas. Em falha ao atualizar, a lista
da mesma categoria permanece visível com aviso; em falha inicial há botão de
nova tentativa. A consulta tem limite de 12 segundos.

## Responsabilidades do servidor antes de liberar competição real

Calcule a classificação no servidor, vinculada à sessão autenticada. Valide
progresso e ganhos offline antes de contabilizar pontuações: o
estado do navegador é editável pelo jogador. O frontend
não garante proteção contra trapaças. Defina limites de consulta, desempate e
consistência das revisões de save. Não exponha email ou tokens nos registros.

## Verificação de integração

1. Conferir bootstrap e consulta autenticada nas três categorias.
2. Conferir posição pessoal dentro e fora da lista de líderes, incluindo ausência.
3. Conferir empate, nomes longos, avatar indisponível e ranking vazio.
4. Conferir erro de rede, timeout e troca rápida de categoria.
5. Conferir atualização após sincronizar progresso, gastar ouro e renascer.
6. Conferir celular (320px e 390px), desktop e navegação por teclado.

Execute `npm test` e `npm run build`. A integração real e a verificação visual
no navegador precisam ser realizadas no ambiente autorizado antes da publicação.
