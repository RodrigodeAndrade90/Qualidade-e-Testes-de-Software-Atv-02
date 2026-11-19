# API de alunos, disciplinas e matrículas — automação E2E

Projeto didático com uma API Express escrita em TypeScript, banco PostgreSQL e
interfaces web. É possível cadastrar alunos e disciplinas e realizar
matrículas. O **Laboratório REST** permite selecionar operações, editar rotas e
corpos JSON e acompanhar as respostas HTTP.

O repositório inclui duas suítes Playwright independentes: uma para a interface
de cadastro de alunos proposta na Atividade 2 e outra para o Laboratório REST.
As duas usam TypeScript e ambientes Docker isolados.

## Atividade 2 — testes E2E do cadastro de alunos

A suíte da atividade testa a interface em `atividade/`. Para instalá-la e
executá-la, rode os comandos na raiz do projeto:

```sh
npm ci
npx playwright install chromium
npm run test:e2e:atividade
```

Ao concluir sem falhas, o resultado esperado é **8 passed**.

| Comando | O que faz |
| --- | --- |
| `npm run test:e2e:atividade` | Executa os cenários da atividade. |
| `npm run test:e2e:atividade -- --headed` | Mantém o navegador visível durante os testes. |
| `npm run test:e2e:atividade:report` | Abre o relatório HTML da execução. |

A cobertura inclui listagem inicial, cadastro válido, atualização da tabela,
limpeza do formulário, persistência após recarregar a página, campos
obrigatórios, valores inválidos de RA e nome, RA duplicado e lista vazia.

Os arquivos da suíte estão organizados assim:

```text
e2e-atividade/
├── run.cjs           # coordena Docker e Playwright
├── support.ts        # restaura o banco antes de cada cenário
├── alunos.spec.ts    # define os casos E2E
└── tsconfig.json
compose.e2e.atividade.yml       # ambiente isolado (banco aula4_e2e_atividade)
playwright.atividade.config.ts  # configuração do Playwright
```

A suíte do Laboratório REST, localizada em `e2e/`, permanece separada e pode
ser executada com `npm run test:e2e`; ela apresenta **13 passed** quando todos
os cenários passam.

## Testes E2E do Laboratório REST

Os testes usam **Playwright Test com TypeScript** para controlar a interface em
um navegador Chromium real. Os cenários que enviam requisições percorrem o
caminho completo — navegador, interface, Nginx, API Express e PostgreSQL. A
suíte também verifica funções locais da tela, como montar uma requisição e
impedir o envio de JSON inválido.

```text
Playwright → navegador → interface web → Nginx → API Express → PostgreSQL
```

Os testes escolhem operações, preenchem os campos e clicam em “Enviar
requisição”. Em seguida, conferem o status, os headers e o corpo exibidos,
comparando o JSON da interface com a resposta HTTP. A API e o banco usados são
reais, sem mocks.

A suíte contém **13 cenários**:

| Grupo | Casos | O que é verificado |
| --- | --- | --- |
| Cadastro pela interface | 1 | Seleção, preenchimento e clique via `send()`; status 201 e objeto do aluno na resposta. |
| Preparação da requisição | 1 | Operação, método, caminho, habilitação do corpo e prévia do JSON. |
| Listagens | 3 | Dados iniciais de alunos, disciplinas e matrículas. |
| Buscas | 3 | Consulta de um registro inicial de cada recurso. |
| Fluxo completo | 1 | Criação de aluno e disciplina, matrícula e consulta após recarregar a página. |
| Erros HTTP | 3 | Exibição dos erros 400, 404 e 409 e do formato JSON correspondente. |
| Validação local | 1 | JSON inválido não é enviado; após a correção, o cadastro funciona. |

No fluxo completo, o teste usa o ID da disciplina retornado pela API para criar
a matrícula. Depois de recarregar a página, consulta os registros novamente
para confirmar que continuam armazenados no servidor.

### Requisitos e primeira execução

Você vai precisar de:

- Node.js 24 e npm.
- Docker em execução, com suporte a contêineres Linux.
- Docker Compose compatível com `up --wait`.
- Porta local `18080` disponível.

Na **raiz do projeto**, instale as dependências e o Chromium:

```powershell
npm ci
npx playwright install chromium
```

Depois, execute a suíte:

```powershell
npm run test:e2e
```

Não é preciso iniciar a aplicação manualmente. O comando remove contêineres
antigos do projeto Docker exclusivo `aula4-e2e`, constrói e inicia banco, API e
frontend com `compose.e2e.yml`, aguarda os healthchecks (inclusive o acesso à
API via Nginx), executa os testes em sequência no Chromium e salva os logs antes
de encerrar os contêineres, mesmo se algum teste falhar.

A instalação do navegador e a primeira construção das imagens podem levar mais
tempo. Uma execução bem-sucedida termina com `13 passed`.

### Isolamento do banco e dos cenários

O ambiente de testes utiliza o banco `aula4_e2e`, com armazenamento temporário
e sem publicar a porta do PostgreSQL. `database/init.sql` cria as tabelas, e
`database/seed.sql` insere os dados iniciais.

Antes de cada cenário, a fixture de `e2e/support.ts` executa `TRUNCATE`, reinicia
as sequências e carrega o seed novamente **somente no banco E2E do projeto
Docker**. Assim, todos os cenários começam com os mesmos dados e podem rodar
independentemente.

O Compose E2E define credenciais e portas próprias. Não usa os valores de
`.env` nem monta o volume demonstrativo `aula4_database_data`. Os dados
temporários são removidos junto com os contêineres.

A configuração usa um worker, sem paralelismo nem novas tentativas automáticas.
Reserve o nome `aula4-e2e` e a porta `18080` para a suíte e não execute dois
conjuntos de testes ao mesmo tempo.

### Comandos úteis

Execute os comandos abaixo na raiz:

| Comando | Finalidade |
| --- | --- |
| `npm run test:e2e` | Prepara o ambiente, executa a suíte e encerra os contêineres. |
| `npm run test:e2e -- --headed` | Exibe a janela do navegador durante os testes. |
| `npm run test:e2e -- --grep "matricula"` | Filtra cenários pelo texto do título. |
| `npm run test:e2e:list` | Lista os testes sem iniciar o Docker ou executá-los. |
| `npm run test:e2e:typecheck` | Confere os tipos dos testes e da configuração. |
| `npm run test:e2e:report` | Abre o relatório HTML da execução mais recente. |

### Relatórios e diagnóstico

Rode `npm run test:e2e:report` e abra o endereço informado no terminal. O
servidor escolhe automaticamente uma porta livre em `127.0.0.1`. Mantenha o
terminal aberto enquanto consulta o relatório e pressione **Ctrl+C** para
encerrar o servidor. O comando de listagem usa somente texto e preserva o HTML
da última execução.

| Caminho | Conteúdo |
| --- | --- |
| `playwright-report/index.html` | Relatório HTML detalhado por cenário. |
| `test-results/` | Capturas de tela e traces mantidos quando há falhas. |
| `test-results/.last-run.json` | Estado da última execução e identificação dos cenários com falha. |
| `e2e-artifacts/compose.log` | Logs do banco, da API e do frontend. |

Essas pastas são geradas automaticamente e estão no `.gitignore`. Podem ser
removidas quando os resultados não forem mais necessários; as próximas
execuções que gerarem esses arquivos vão criá-las novamente. Se
`playwright-report/` for apagada, o relatório só estará disponível outra vez
depois de uma nova execução.

O Playwright cria `test-results/`; `e2e/run.cjs` cria `e2e-artifacts/` para
guardar os logs antes de desligar os contêineres. Quando todos os testes passam,
é normal que `test-results/` contenha apenas `.last-run.json`, pois capturas e
traces são preservados somente quando há falhas.

Um trace permite examinar as ações no navegador, as requisições e o estado da
página. Para abrir um trace produzido por uma falha, use:

```powershell
npx playwright show-trace "caminho/para/trace.zip"
```

Se o processo for encerrado à força e os contêineres continuarem ativos, remova
o ambiente com:

```powershell
docker compose -f compose.e2e.yml -p aula4-e2e down --remove-orphans
```

### Organização dos testes

O código E2E e seus recursos de apoio ficam em `e2e/`, na raiz, pois os
cenários verificam em conjunto a interface, a API e o banco. Essa disposição é
uma escolha organizacional; `testDir: './e2e'` em `playwright.config.ts` define
onde o Playwright procura os testes.

| Arquivo | Responsabilidade |
| --- | --- |
| `e2e/laboratorio.spec.ts` | Cenários executados no navegador. |
| `e2e/support.ts` | Restauração do banco e auxiliar de envio pela interface. |
| `e2e/run.cjs` | Inicialização, execução, gravação de logs e encerramento. |
| `e2e/tsconfig.json` | Verificação de tipos dos testes. |
| `playwright.config.ts` | Chromium, sequência, capturas e relatórios. |
| `compose.e2e.yml` | Banco, API e frontend isolados para os testes. |
| `package.json` e `package-lock.json` da raiz | Scripts e dependências E2E. |

### Como adicionar casos

Inclua cenários em `e2e/laboratorio.spec.ts` ou em outros arquivos `*.spec.ts`
dentro de `e2e/`. Importe `test` e `expect` de `./support` para usar a limpeza
automática do banco. O auxiliar `send()` escolhe uma operação, envia a
requisição pela interface e verifica o retorno.

Use `getByTestId()` com os atributos `data-testid` e os valores fixos das
operações listados em [front/README.md](front/README.md). Crie no cenário os
dados necessários e utilize os IDs devolvidos pela API. Aguarde respostas e
condições da página em vez de usar pausas fixas.

A cobertura atual prioriza os fluxos do Laboratório REST. Ela não inclui testes
de carga, concorrência, outros navegadores ou todas as combinações de validação
da API. O guia de execução está em [e2e/README.md](e2e/README.md).

## Executar a aplicação manualmente

Na raiz do projeto, copie `.env.example` para `.env` se o arquivo ainda não
existir e inicie os serviços:

```powershell
docker compose up -d --build
```

Com as portas definidas no arquivo de exemplo, os endereços são:

- Laboratório REST (`front/`): http://localhost:8080
- Cadastro de alunos (`atividade/`): http://localhost:8081
- API de alunos: http://localhost:3002/api/students
- PostgreSQL: localhost:5433

Na primeira inicialização de um diretório de dados vazio, o banco executa os
scripts de `database/` e persiste os registros no volume
`aula4_database_data`. Para desligar os serviços, rode `docker compose down`.

## Interface da Atividade 2

A página em `atividade/` carrega os alunos ao abrir. O formulário envia RA e
nome para `POST /api/students`. Quando o cadastro dá certo, limpa os campos e
consulta novamente a lista com `GET /api/students`, sem recarregar a página. A
tela também apresenta validações, mensagens de sucesso e erro e o estado de
lista vazia.

Para iniciar somente essa interface e os serviços de que ela depende, rode na
raiz:

```powershell
docker compose up --build -d atividade
```

Acesse http://localhost:8081, ou a porta configurada por
`ATIVIDADE_PORT_HOST` no `.env`. O Nginx encaminha as chamadas `/api` ao
servidor. No ambiente manual, as duas interfaces compartilham a API e o banco.

A proposta da atividade inclui testes para listagem inicial, cadastro com
atualização da tabela, persistência após recarga, campos inválidos, RA duplicado
e falhas da API. A página fornece labels acessíveis e atributos `data-testid`
para localizar elementos.

A suíte `e2e/` e o ambiente `compose.e2e.yml` continuam voltados ao Laboratório
REST. Para testar a interface da atividade, configure uma suíte e um ambiente
com banco isolado. Os comportamentos esperados e seletores estão em
[atividade/README.md](atividade/README.md).

## Desenvolver a API

Na pasta `server`, instale dependências, confira os tipos e compile:

```powershell
npm ci
npm run typecheck
npm run build
```

Para executar a API localmente, configure as variáveis `DB_*` do `.env` para
usar um PostgreSQL acessível pela máquina. Com o banco iniciado pelo Compose,
defina `DB_HOST=127.0.0.1` e `DB_PORT=5433`. Use `npm run dev` durante o
desenvolvimento ou `npm start` depois de compilar.

As dependências na raiz são usadas pelos testes E2E; as dependências de
`server/` pertencem à API.
