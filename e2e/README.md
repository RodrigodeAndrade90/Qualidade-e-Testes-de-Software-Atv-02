# Testes de ponta a ponta (E2E)

Para executar, tenha Node.js 24, Docker ativo com contêineres Linux e uma
versão do Docker Compose que ofereça `up --wait`. Na pasta principal do projeto,
instale as dependências e o Chromium e inicie a suíte:

```powershell
npm ci
npx playwright install chromium
npm run test:e2e
```

A execução monta a aplicação inteira usando apenas `compose.e2e.yml`, o projeto
Docker `aula4-e2e` e a porta local `18080`. Ela ignora o `.env` e o volume usado
pela demonstração. Reserve o nome do projeto e essa porta enquanto os testes
estiverem rodando. O PostgreSQL não publica uma porta e mantém seus dados em
armazenamento descartável.

Antes de cada cenário, a fixture limpa as tabelas com `TRUNCATE` e carrega de
novo `database/seed.sql`, somente no banco `aula4_e2e` deste projeto Docker. Os
casos rodam em sequência, com um worker e sem repetição automática. Não inicie
duas suítes ao mesmo tempo. Nos casos com envio, o percurso inclui navegador,
interface, Nginx, API Express e PostgreSQL reais; as respostas da API não são
interceptadas nem simuladas. Há também verificações de funções locais, como a
montagem da chamada e o bloqueio de JSON malformado antes do envio.

A suíte reúne **13 cenários**:

| Grupo | Quantidade | O que é conferido |
| --- | --- | --- |
| Cadastro pela interface | 1 | Seleção, preenchimento e clique por `send()`; status 201 e objeto do estudante no retorno. |
| Montagem da chamada | 1 | Ação escolhida, método, rota, ativação do corpo e prévia do JSON. |
| Listagens | 3 | Conteúdo inicial de alunos, disciplinas e matrículas. |
| Consultas | 3 | Busca de um item inicial de cada tipo de recurso. |
| Processo completo | 1 | Inclusão de estudante e disciplina, matrícula e consulta dos dados após recarregar. |
| Falhas HTTP | 3 | Exibição dos erros 400, 404 e 409 e da estrutura JSON correspondente. |
| Checagem local | 1 | JSON inválido não gera chamada; depois de corrigido, o cadastro é feito. |

No fluxo completo, o teste usa o ID da disciplina retornado pela API para
registrar a matrícula. A busca após a recarga confirma que os registros
continuam guardados no servidor.

## Primeiro cenário: criar com `send()`

O primeiro caso em `laboratorio.spec.ts`, `registra um aluno pela página`, cria
o objeto de Mariana uma vez e reutiliza o mesmo valor no envio e na comparação
com `toEqual(student)`.

O teste importa `test`, `expect` e `send` de `./support` para conservar a fixture
que restaura o banco e abre a página antes de cada caso.

A função `send()` em `support.ts` reúne seleção da ação, preenchimento, envio e
checagem da resposta. Por exemplo,
`await send(page, 'students-create', 201, { body: student })` executa esse
conjunto de etapas. O auxiliar verifica status, cabeçalhos e conteúdo mostrados
na interface e compara o JSON exibido com a resposta HTTP original.

## Sugestão de roteiro para apresentar

O Laboratório REST deixa selecionar ações, editar JSON, fazer chamadas e
examinar os retornos. Essas operações são o foco da automação E2E e permitem
demonstrar testes no navegador sem reorganizar a aplicação.

1. Criação de estudante com `send()`: veja em `support.ts` como o auxiliar usa
   `getByTestId()` para encontrar campos, escolher uma ação, preencher o JSON,
   clicar e conferir a resposta.
2. Consulta do estudante incluído: acompanhe a busca feita depois da inclusão
   no mesmo caso, como acontece no fluxo completo. O banco é restaurado antes
   de cada cenário, então eles não dependem uns dos outros.
3. Processo de matrícula: observe como `send()` reaproveita interações comuns
   ao incluir estudante e disciplina, matricular e consultar após atualizar a página.
4. Exibição de erro HTTP: examine o status e o corpo da resposta na interface,
   junto das verificações do teste.
5. Recusa de JSON malformado: confira que a validação no navegador impede o
   envio e que a chamada funciona depois da correção.
6. Fixtures, limpeza e relatórios: percorra o `test` de `./support`, o isolamento
   dos casos e os resultados e traces gerados.

## Casos cobertos

- Cadastro de estudante pela interface usando `send()` e comparação do objeto retornado.
- Seleção da ação e conferência da prévia do envio.
- Listagem e consulta dos dados iniciais de alunos, disciplinas e matrículas.
- Criação de estudante e disciplina, registro de matrícula e consulta após recarga.
- Apresentação das respostas HTTP 400, 404 e 409.
- Bloqueio de JSON inválido e envio bem-sucedido depois do ajuste.

## Comandos disponíveis

```powershell
npm run test:e2e:typecheck
npm run test:e2e:list
npm run test:e2e -- --headed
npm run test:e2e -- --grep "matrícula"
npm run test:e2e:report
```

| Comando | Ação |
| --- | --- |
| `npm run test:e2e` | Prepara o ambiente, roda todos os casos e encerra os contêineres. |
| `npm run test:e2e -- --headed` | Mostra a janela do navegador durante a execução. |
| `npm run test:e2e -- --grep "matrícula"` | Filtra cenários pelo texto do título. |
| `npm run test:e2e:list` | Exibe a lista de casos sem iniciar Docker nem executá-los. |
| `npm run test:e2e:typecheck` | Confere tipos dos testes e das configurações. |
| `npm run test:e2e:report` | Abre o relatório HTML da execução mais recente. |

O relatório fica disponível em `127.0.0.1`, usando uma porta livre escolhida
automaticamente. Abra o endereço que aparecer no terminal e deixe esse processo
ativo durante a consulta. A listagem usa somente o reporter de texto e mantém o
HTML da execução anterior.

Os artefatos ficam nestes locais:

| Caminho | O que contém |
| --- | --- |
| `playwright-report/index.html` | Relatório HTML detalhado por cenário. |
| `test-results/` | Imagens e traces mantidos quando há falhas. |
| `test-results/.last-run.json` | Estado da execução anterior e lista de testes que falharam. |
| `e2e-artifacts/compose.log` | Registros do banco, da API e da interface web. |

Esses diretórios são criados automaticamente e ignorados pelo Git. Podem ser
removidos quando os resultados não forem mais necessários; novas execuções os
geram outra vez quando aplicável. Ao excluir `playwright-report/`, o relatório
deixa de estar disponível até a próxima execução dos testes.

O Playwright cria `test-results/`, enquanto `e2e/run.cjs` prepara
`e2e-artifacts/` e salva os logs antes de desligar os contêineres. Quando todos
os casos passam, é esperado que `test-results/` tenha apenas `.last-run.json`,
pois as capturas e os traces são preservados só para falhas.

O trace ajuda a examinar ações no navegador, chamadas de rede e estado da tela.
Para abrir um arquivo gerado por uma falha:

```powershell
npx playwright show-trace "caminho/para/trace.zip"
```

O script desliga os contêineres ao terminar, mesmo se algum caso falhar. Os logs
ficam em `e2e-artifacts/compose.log`, o relatório em `playwright-report/` e as
capturas e traces de falha em `test-results/`. Se a execução for interrompida à
força, limpe os contêineres com:

```powershell
docker compose -f compose.e2e.yml -p aula4-e2e down --remove-orphans
```

O Playwright aguarda respostas de rede e usa asserções que repetem a checagem,
sem tempos de espera fixos. Os seletores usam `getByTestId()` e os atributos
estáveis `data-testid`, que não dependem dos rótulos da tela. Os IDs estão
listados em [front/README.md](../front/README.md).

Consulte a [referência do Playwright Test](https://playwright.dev/docs/intro).
