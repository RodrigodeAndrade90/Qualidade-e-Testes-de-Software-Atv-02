# API de gestão acadêmica e testes E2E

Aplicação didática composta por uma API REST em Express e TypeScript, banco de
dados PostgreSQL e duas interfaces web. O sistema permite cadastrar alunos e
disciplinas e registrar matrículas. O **Laboratório REST** oferece operações
para enviar requisições e analisar as respostas HTTP.

O projeto contém duas suítes independentes de testes ponta a ponta, ambas
implementadas com Playwright Test e TypeScript. Cada suíte utiliza sua própria
configuração e ambiente Docker.

## Atividade 2: cadastro de alunos

Esta suíte cobre a interface de cadastro disponível em `atividade/`. Na raiz do
projeto, instale as dependências, instale o Chromium e execute os testes:

```sh
npm ci
npx playwright install chromium
npm run test:e2e:atividade
```

O resultado esperado para uma execução bem-sucedida é **8 passed**.

| Comando | Descrição |
| --- | --- |
| `npm run test:e2e:atividade` | Executa os testes da Atividade 2. |
| `npm run test:e2e:atividade -- --headed` | Executa os testes com o navegador visível. |
| `npm run test:e2e:atividade:report` | Inicia a visualização do relatório HTML. |

A cobertura inclui carregamento inicial da lista, cadastro válido, atualização
da tabela, limpeza dos campos, persistência após recarga, campos obrigatórios,
validação de RA e nome, RA duplicado e lista vazia.

Arquivos e configurações desta suíte:

```text
e2e-atividade/
├── run.cjs           # coordenação dos serviços Docker e do Playwright
├── support.ts        # preparação do banco antes de cada teste
├── alunos.spec.ts    # cenários de automação
└── tsconfig.json
compose.e2e.atividade.yml       # ambiente isolado (banco aula4_e2e_atividade)
playwright.atividade.config.ts  # configuração do Playwright
```

A suíte do Laboratório REST é separada, está em `e2e/` e pode ser executada com
`npm run test:e2e`. Quando aprovada, a execução informa **13 passed**.

## Testes do Laboratório REST

Os testes automatizam a interface em um navegador Chromium real. Nos cenários
que enviam requisições, o fluxo percorre todos os componentes da aplicação:

```text
Playwright → navegador → interface web → Nginx → API Express → PostgreSQL
```

As respostas da API e do banco são reais, sem mocks. Além dos fluxos que
atravessam a aplicação, a suíte verifica funções locais da interface, incluindo
a preparação da requisição e o bloqueio de JSON inválido antes do envio.

Os **13 cenários** estão distribuídos da seguinte forma:

| Categoria | Casos | Verificações principais |
| --- | --- | --- |
| Cadastro pela interface | 1 | Uso de `send()`, status 201 e objeto do aluno retornado. |
| Preparação da requisição | 1 | Operação, método, caminho, corpo habilitado e prévia do JSON. |
| Listagens | 3 | Dados iniciais de alunos, disciplinas e matrículas. |
| Buscas | 3 | Consulta de um registro inicial de cada recurso. |
| Fluxo completo | 1 | Cadastro de aluno e disciplina, matrícula e consultas após recarregar a página. |
| Erros HTTP | 3 | Respostas 400, 404 e 409 e seus respectivos formatos JSON. |
| Validação local | 1 | Bloqueio de JSON inválido e cadastro após a correção. |

No fluxo completo, o ID da disciplina retornado pela API é usado na criação da
matrícula. Após atualizar a página, o teste consulta os registros para confirmar
que os dados continuam armazenados no servidor.

### Requisitos

- Node.js 24 e npm.
- Docker em execução com suporte a contêineres Linux.
- Docker Compose compatível com `up --wait`.
- Porta local `18080` disponível.

### Instalação e execução

Na raiz do projeto, instale as dependências e o navegador Chromium:

```powershell
npm ci
npx playwright install chromium
```

Execute a suíte:

```powershell
npm run test:e2e
```

O comando prepara o ambiente automaticamente. Ele remove contêineres
remanescentes do projeto Docker `aula4-e2e`, constrói e inicia banco, API e
frontend com `compose.e2e.yml`, aguarda os healthchecks — incluindo o acesso à
API pelo Nginx —, executa os testes em sequência no Chromium, salva os logs e
encerra os contêineres, inclusive quando há falhas.

A primeira instalação do navegador e a construção inicial das imagens podem
levar mais tempo. Ao final de uma execução bem-sucedida, o Playwright informa
`13 passed`.

### Isolamento e preparação dos dados

O ambiente E2E utiliza o banco `aula4_e2e`, com armazenamento temporário e sem
publicar a porta do PostgreSQL. As tabelas são criadas por
`database/init.sql`; os dados iniciais são carregados de `database/seed.sql`.

Antes de cada cenário, a fixture em `e2e/support.ts` executa `TRUNCATE`, reinicia
as sequências e reaplica o seed **somente no banco E2E do projeto Docker**. Cada
teste começa com os mesmos dados e pode ser executado sem depender dos demais.

O Compose E2E define credenciais e portas próprias. Ele não utiliza os valores
do `.env` nem monta o volume `aula4_database_data` da demonstração. Os dados
temporários são descartados junto com os contêineres.

A suíte usa um worker, sem paralelismo e sem novas tentativas automáticas.
Reserve o nome `aula4-e2e` e a porta `18080` para os testes; não execute duas
suítes simultaneamente.

### Comandos adicionais

Execute os comandos na raiz do projeto:

| Comando | Descrição |
| --- | --- |
| `npm run test:e2e` | Prepara o ambiente, executa a suíte e encerra os contêineres. |
| `npm run test:e2e -- --headed` | Abre o navegador durante a execução. |
| `npm run test:e2e -- --grep "matricula"` | Seleciona cenários pelo texto do título. |
| `npm run test:e2e:list` | Lista os cenários sem iniciar Docker nem executar os testes. |
| `npm run test:e2e:typecheck` | Verifica os tipos dos testes e da configuração. |
| `npm run test:e2e:report` | Abre o relatório HTML da execução mais recente. |

### Relatórios e diagnóstico

Execute `npm run test:e2e:report` e acesse o endereço apresentado no terminal.
O servidor escolhe automaticamente uma porta disponível em `127.0.0.1`. Mantenha
o processo ativo durante a consulta e pressione **Ctrl+C** para encerrá-lo. O
comando de listagem usa somente saída de texto e preserva o relatório HTML
anterior.

| Local | Conteúdo |
| --- | --- |
| `playwright-report/index.html` | Relatório HTML detalhado por cenário. |
| `test-results/` | Capturas de tela e traces preservados em caso de falha. |
| `test-results/.last-run.json` | Estado da execução anterior e identificação dos testes que falharam. |
| `e2e-artifacts/compose.log` | Logs do banco, da API e do frontend. |

Esses diretórios são gerados automaticamente e estão no `.gitignore`. Podem ser
removidos quando os resultados deixarem de ser necessários; serão criados
novamente pelas execuções que produzirem esses arquivos. A remoção de
`playwright-report/` apaga o relatório até a próxima execução da suíte.

O Playwright cria `test-results/`, enquanto `e2e/run.cjs` cria
`e2e-artifacts/` para armazenar os logs antes de encerrar os contêineres. Em
execuções sem falhas, é normal que `test-results/` contenha somente
`.last-run.json`: capturas e traces são mantidos apenas quando há falhas.

O trace registra ações do navegador, requisições e estado da página. Para
examinar um arquivo gerado durante uma falha, use:

```powershell
npx playwright show-trace "caminho/para/trace.zip"
```

Se a execução for interrompida à força e os contêineres permanecerem ativos,
encerre o ambiente com:

```powershell
docker compose -f compose.e2e.yml -p aula4-e2e down --remove-orphans
```

### Estrutura da suíte

Os testes do Laboratório REST e seus recursos de apoio ficam em `e2e/`, na raiz
do projeto, pois verificam interface, API e banco em conjunto. Essa organização
é independente da descoberta dos testes, configurada por
`testDir: './e2e'` em `playwright.config.ts`.

| Arquivo | Responsabilidade |
| --- | --- |
| `e2e/laboratorio.spec.ts` | Cenários executados no navegador. |
| `e2e/support.ts` | Restauração do banco e auxiliar de envio pela interface. |
| `e2e/run.cjs` | Preparação do ambiente, execução, registro de logs e encerramento. |
| `e2e/tsconfig.json` | Verificação dos tipos dos testes. |
| `playwright.config.ts` | Configuração do Chromium, execução sequencial, capturas e relatórios. |
| `compose.e2e.yml` | Banco, API e frontend dedicados aos testes. |
| `package.json` e `package-lock.json` da raiz | Scripts e dependências E2E. |

### Adicionar cenários

Inclua novos testes em `e2e/laboratorio.spec.ts` ou crie arquivos `*.spec.ts`
na pasta `e2e/`. Importe `test` e `expect` de `./support` para utilizar a
restauração automática do banco. O auxiliar `send()` seleciona uma operação,
preenche e envia a requisição pela interface e verifica a resposta.

Use `getByTestId()` com os atributos `data-testid` e os valores fixos das
operações descritos em [front/README.md](front/README.md). Prepare os dados
necessários em cada cenário e utilize os IDs retornados pela API. Aguarde as
respostas e as condições da página; evite pausas com duração fixa.

A cobertura atual prioriza os fluxos do Laboratório REST. Não inclui testes de
carga ou concorrência, outros navegadores nem todas as combinações possíveis de
validação da API. Consulte [e2e/README.md](e2e/README.md) para instruções
operacionais da suíte.

## Executar a aplicação manualmente

Na raiz do projeto, copie `.env.example` para `.env` caso o arquivo ainda não
exista. Em seguida, inicie os serviços:

```powershell
docker compose up -d --build
```

Com as portas definidas no arquivo de exemplo, os serviços ficam disponíveis em:

- Laboratório REST (`front/`): http://localhost:8080
- Cadastro de alunos (`atividade/`): http://localhost:8081
- API de alunos: http://localhost:3002/api/students
- PostgreSQL: localhost:5433

Na primeira inicialização de um diretório de dados vazio, o banco executa os
scripts de `database/` e mantém os registros no volume
`aula4_database_data`. Para encerrar os serviços, execute `docker compose down`.

## Interface da Atividade 2

Ao abrir a interface em `atividade/`, a lista de alunos é carregada. O formulário
envia RA e nome para `POST /api/students`. Quando o cadastro é concluído, os
campos são limpos e a lista é atualizada por `GET /api/students`, sem recarregar
a página. A interface também apresenta validações, mensagens de sucesso e erro
e o estado de lista vazia.

Para iniciar somente essa interface e os serviços de que depende, execute na raiz:

```powershell
docker compose up --build -d atividade
```

Acesse http://localhost:8081 ou a porta definida por `ATIVIDADE_PORT_HOST` no
`.env`. O Nginx encaminha as chamadas `/api` ao servidor. No ambiente manual,
as duas interfaces utilizam a mesma API e o mesmo banco.

A atividade propõe testes para a listagem inicial, cadastro com atualização da
tabela, persistência após recarga, campos inválidos, RA duplicado e falhas da
API. A página disponibiliza labels acessíveis e atributos `data-testid` para a
localização dos elementos.

A suíte `e2e/` e o ambiente `compose.e2e.yml` permanecem dedicados ao Laboratório
REST. Para testar a interface da atividade, configure uma suíte e um ambiente
com banco isolado. Os comportamentos esperados e os seletores estão descritos
em [atividade/README.md](atividade/README.md).

## Desenvolvimento da API

Na pasta `server`, instale as dependências, verifique os tipos e compile o projeto:

```powershell
npm ci
npm run typecheck
npm run build
```

Para executar a API localmente, configure as variáveis `DB_*` do `.env` para
apontar a um PostgreSQL acessível pela máquina. Ao usar o banco do Compose,
defina `DB_HOST=127.0.0.1` e `DB_PORT=5433`. Utilize `npm run dev` durante o
desenvolvimento ou `npm start` após a compilação.

As dependências instaladas na raiz são destinadas aos testes E2E; as de
`server/` são utilizadas pela API.
