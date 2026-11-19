# Aplicação de estudantes, disciplinas e matrículas — testes E2E

Projeto de ensino formado por uma API Express em TypeScript, PostgreSQL e uma
interface web. Com ele é possível incluir estudantes e disciplinas e registrar
matrículas. O **Laboratório REST** deixa escolher ações, editar rotas e corpos
JSON e conferir as respostas HTTP.

Os testes ponta a ponta usam **Playwright Test com TypeScript** para operar a
interface em um navegador Chromium real.

A pasta **`atividade/`** traz uma segunda interface em HTML, CSS e JavaScript,
voltada ao registro de estudantes pelos campos `ra` e `name`. Ela utiliza a
mesma API e foi preparada para que os alunos desenvolvam a própria automação E2E.

## Escopo dos testes

Nos cenários que enviam chamadas, o caminho percorrido inclui navegador,
interface, Nginx, API Express e PostgreSQL. A suíte também cobre ações locais da
tela, como preparar o envio e impedir que um JSON inválido seja enviado.

```text
Playwright → navegador → interface web → Nginx → API Express → PostgreSQL
```

Nesses cenários, os testes selecionam uma ação, preenchem os campos e clicam em
“Fazer envio”. Depois conferem status, cabeçalhos e conteúdo apresentados e
comparam o JSON da tela com o retorno HTTP. A API e o banco são usados de
verdade; as respostas não são simuladas.

A suíte possui **13 cenários**:

| Grupo | Casos | Conferências |
| --- | --- | --- |
| Inclusão pela tela | 1 | Seleção, preenchimento e clique por `send()`; status 201 e objeto retornado. |
| Prévia do envio | 1 | Ação, método, rota, ativação do corpo e JSON preparado. |
| Listagens | 3 | Dados iniciais de estudantes, disciplinas e matrículas. |
| Consultas | 3 | Busca de um item existente de cada recurso. |
| Fluxo completo | 1 | Inclusão de estudante e disciplina, matrícula e consultas depois da recarga. |
| Erros HTTP | 3 | Exibição dos retornos 400, 404 e 409 com o formato JSON esperado. |
| Validação local | 1 | O JSON malformado não gera chamada; a inclusão funciona após o ajuste. |

No fluxo completo, o teste utiliza o ID de disciplina recebido da API ao criar a
matrícula. As consultas feitas após recarregar a página confirmam que os dados
permanecem no servidor.

## Rodar a suíte E2E

É necessário ter:

- Node.js 24 e npm.
- Docker em execução com suporte a contêineres Linux.
- Docker Compose compatível com `up --wait`.
- Porta local `18080` livre.

Na **raiz do projeto**, instale as dependências e o navegador:

```powershell
npm ci
npx playwright install chromium
```

Em seguida, execute:

```powershell
npm run test:e2e
```

Não é preciso iniciar a aplicação manualmente. O comando:

1. Remove contêineres remanescentes do projeto Docker exclusivo `aula4-e2e`.
2. Monta e inicia banco, API e interface usando `compose.e2e.yml`.
3. Espera os healthchecks, incluindo o acesso à API pelo Nginx.
4. Executa os testes em sequência no Chromium.
5. Guarda os logs dos serviços e encerra os contêineres, também em caso de falha.

Uma execução sem falhas termina com `13 passed`. A instalação do Chromium e a
primeira criação das imagens Docker podem demorar mais.

### Banco isolado e dados iniciais

O ambiente E2E usa a base `aula4_e2e`, com armazenamento temporário e sem
publicar a porta do PostgreSQL. `database/init.sql` cria as tabelas e
`database/seed.sql` inclui os registros de partida.

Antes de cada caso, a fixture de `e2e/support.ts` executa `TRUNCATE`, reinicia
as sequências e reaplica o seed **somente na base de testes do projeto Docker**.
Assim, todos começam com os mesmos registros e funcionam independentemente.

O Compose de testes define suas próprias credenciais e portas. Ele não lê os
valores de `.env` nem monta o volume demonstrativo `aula4_database_data`. Ao
remover os contêineres, os dados temporários também são descartados.

A configuração usa um worker, sem paralelismo ou tentativas automáticas
adicionais. Reserve `aula4-e2e` e a porta `18080` para a suíte e evite duas
execuções simultâneas.

### Atalhos de execução

Rode estes comandos na raiz do projeto:

| Comando | Para que serve |
| --- | --- |
| `npm run test:e2e` | Prepara o ambiente, executa os testes e remove os contêineres. |
| `npm run test:e2e -- --headed` | Exibe o navegador durante a execução. |
| `npm run test:e2e -- --grep "matrícula"` | Executa os casos cujos títulos correspondem ao filtro. |
| `npm run test:e2e:list` | Lista os casos sem iniciar Docker nem rodar a suíte. |
| `npm run test:e2e:typecheck` | Confere os tipos dos testes e da configuração. |
| `npm run test:e2e:report` | Abre o relatório HTML mais recente. |

### Relatórios e investigação

Execute `npm run test:e2e:report` e abra o endereço mostrado no terminal. O
servidor escolhe uma porta livre em `127.0.0.1`. Deixe o terminal aberto
enquanto consulta o relatório e pressione **Ctrl+C** quando terminar. O comando
de listagem usa apenas texto e conserva o relatório HTML da última execução.

| Caminho | Conteúdo |
| --- | --- |
| `playwright-report/index.html` | Relatório HTML organizado por cenário. |
| `test-results/` | Capturas de tela e traces mantidos para falhas. |
| `test-results/.last-run.json` | Situação da execução anterior e identificação dos casos que falharam. |
| `e2e-artifacts/compose.log` | Logs do banco, da API e da interface. |

Esses diretórios são gerados automaticamente e constam no `.gitignore`. Remova-os
quando os resultados não forem mais úteis; serão recriados por execuções futuras
que produzam esses artefatos. Apagar `playwright-report/` remove o relatório até
que os testes sejam executados novamente.

O Playwright cria `test-results/`; `e2e/run.cjs` monta `e2e-artifacts/` e salva os
logs antes de encerrar os contêineres. Se todos os casos passarem, é normal que
`test-results/` tenha apenas `.last-run.json`, porque capturas e traces são
guardados somente quando há falhas.

O trace permite inspecionar as interações no navegador, as chamadas de rede e o
estado da página. Abra um arquivo produzido por uma falha assim:

```powershell
npx playwright show-trace "caminho/para/trace.zip"
```

Se o processo for encerrado à força e os contêineres permanecerem ativos, finalize
o ambiente com:

```powershell
docker compose -f compose.e2e.yml -p aula4-e2e down --remove-orphans
```

## Estrutura da suíte

O código dos testes e seus recursos de apoio ficam em `e2e/`. A pasta está na
raiz porque os cenários verificam em conjunto a interface, a API e o banco. Essa
é uma decisão de organização; `testDir: './e2e'` em `playwright.config.ts`
determina onde o Playwright procura os testes.

| Arquivo | Função |
| --- | --- |
| `e2e/laboratorio.spec.ts` | Cenários executados pelo navegador. |
| `e2e/support.ts` | Limpeza do banco e auxiliar de envio pela interface. |
| `e2e/run.cjs` | Prepara o ambiente, executa a suíte, salva logs e encerra serviços. |
| `e2e/tsconfig.json` | Checagem de tipos dos testes. |
| `playwright.config.ts` | Define Chromium, sequência, capturas e relatórios. |
| `compose.e2e.yml` | Serviços isolados de banco, API e interface para a suíte. |
| `package.json` e `package-lock.json` da raiz | Scripts e dependências E2E. |

### Acrescentar cenários

Inclua novos casos em `e2e/laboratorio.spec.ts` ou crie arquivos `*.spec.ts`
na pasta `e2e/`. Importe `test` e `expect` de `./support` para aproveitar a
limpeza automática do banco. `send()` escolhe a ação, preenche a tela, envia e
confere o retorno.

Use `getByTestId()` com os atributos `data-testid` e os códigos fixos das ações
descritos em [front/README.md](front/README.md). Prepare no próprio cenário os
registros necessários e use os IDs retornados pela API. Aguarde respostas e
condições da página em vez de adicionar pausas fixas.

Atualmente, os testes se concentram nos fluxos do Laboratório REST. Não cobrem
testes de carga, concorrência, outros navegadores nem todas as combinações de
validação da API. O guia operacional da suíte está em [e2e/README.md](e2e/README.md).

## Iniciar a aplicação manualmente

Na raiz, se `.env` ainda não existir, copie `.env.example` para `.env` e rode:

```powershell
docker compose up -d --build
```

Com as portas definidas no arquivo de exemplo, use:

- Laboratório REST (`front/`): http://localhost:8080
- Cadastro de estudantes (`atividade/`): http://localhost:8081
- API de estudantes: http://localhost:3002/api/students
- PostgreSQL: localhost:5433

Na primeira inicialização de um diretório de dados vazio, o banco aplica os
scripts de `database/` e guarda os dados no volume `aula4_database_data`. Para
parar a aplicação, execute `docker compose down`.

## Interface proposta para a atividade E2E

Ao abrir `atividade/`, a página consulta a lista de estudantes. O formulário
envia RA e nome a `POST /api/students`; quando o cadastro dá certo, limpa os
campos e busca a lista outra vez com `GET /api/students`, sem recarregar toda a
página. A tela mostra validações, avisos de sucesso ou erro e o estado sem itens.

Para iniciar apenas essa interface e seus serviços, rode na raiz:

```powershell
docker compose up --build -d atividade
```

Acesse http://localhost:8081, ou a porta indicada por `ATIVIDADE_PORT_HOST` no
`.env`. O Nginx encaminha as chamadas `/api` à API. No modo manual, as duas
interfaces compartilham o servidor e a base de dados.

A atividade sugere testes para a listagem inicial, cadastro com atualização da
tabela, persistência após recarga, campos inválidos, RA repetido e falhas da API.
A página inclui labels acessíveis e atributos `data-testid` para encontrar os
elementos.

A suíte atual em `e2e/` e o ambiente `compose.e2e.yml` atendem ao Laboratório
REST. Para exercitar a segunda interface, prepare uma configuração e um ambiente
de testes com banco isolado. Consulte [atividade/README.md](atividade/README.md)
para os comportamentos previstos e seletores disponíveis.

## Desenvolvimento da API

Na pasta `server`, use:

```powershell
npm ci
npm run typecheck
npm run build
```

Para executar a API localmente, ajuste as variáveis `DB_*` do `.env` para apontar
para um PostgreSQL acessível pela máquina. Se usar o banco do Compose, configure
`DB_HOST=127.0.0.1` e `DB_PORT=5433`. Rode `npm run dev` durante o desenvolvimento
ou `npm start` depois da compilação.

As dependências da raiz servem à automação E2E; as de `server/` são usadas pela API.
