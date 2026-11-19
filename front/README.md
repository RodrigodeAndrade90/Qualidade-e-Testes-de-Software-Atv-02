# Seletores e automação da interface

Nos testes, `getByTestId()` encontra cada elemento por seu atributo
`data-testid`, sem depender do texto que aparece na tela. Os campos continuam
com seus labels HTML, e `aria-busy` informa quando o painel de retorno está
sendo atualizado.

| Elemento da página | `data-testid` |
| --- | --- |
| Cabeçalho principal | `page-title` |
| Ação selecionada | `example` |
| URL inicial | `base` |
| Verbo HTTP | `method` |
| Rota do recurso | `path` |
| Conteúdo enviado | `body` |
| Controle de envio | `send` |
| Prévia do envio | `request-preview` |
| Área de retorno | `response` |
| Resultado HTTP | `status` |
| Cabeçalhos recebidos | `response-headers` |
| Conteúdo recebido | `response-body` |

Exemplo: `page.getByTestId('response-body')`. Ao ajustar os textos visíveis,
conserve esses identificadores. As verificações de conteúdo dos cenários devem
continuar comparando os valores previstos.

As opções do seletor usam códigos fixos; a posição na lista não interfere:

| Recurso | Consultar lista | Consultar item | Registrar |
| --- | --- | --- | --- |
| Alunos | `students-list` | `students-get` | `students-create` |
| Disciplinas | `courses-list` | `courses-get` | `courses-create` |
| Matrículas | `enrollments-list` | `enrollments-get` | `enrollments-create` |

As opções que demonstram erros são `error-400`, `error-404` e `error-409`.

## Estado do envio

Enquanto a chamada está em andamento, `#response` apresenta
`aria-busy="true"`; ao terminar, volta para `false`. O botão fica bloqueado
nesse intervalo e é liberado no encerramento. `#status` informa:

- `data-state`: `idle`, `loading`, `success`, `http-error`, `validation-error` ou `network-error`.
- `data-status-code`: código HTTP recebido após a leitura do corpo completo.
  Ele é limpo ao iniciar outro envio; falhas locais ou de rede não têm código HTTP.

Para duas chamadas consecutivas com o mesmo resultado, configure a espera pela
resposta de rede antes de clicar, aguarde a resposta e só então confira o estado
final e o conteúdo. Não exija que `loading` seja observado: uma resposta rápida
pode terminar antes da próxima asserção.

Os identificadores da interface permanecem estáveis. A automação E2E está
descrita em [e2e/README.md](../e2e/README.md). As opções de busca e matrícula
duplicada dependem dos dados de `database/seed.sql`; cada cenário que cria itens
deve preparar os próprios registros em uma base isolada.
