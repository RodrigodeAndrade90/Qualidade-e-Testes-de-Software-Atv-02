# Exercício: automação E2E do registro de estudantes

Interface sem dependências, feita com HTML, CSS e JavaScript. Ela usa o mesmo
servidor e a mesma base de dados do laboratório.

## Iniciar a aplicação

Na pasta principal do projeto, rode:

```sh
docker compose up --build -d atividade
```

Abra http://localhost:8081. O Compose também inicia a API e o banco. Para usar
outra porta, configure `ATIVIDADE_PORT_HOST` no arquivo `.env`.

Acesse a página pelo Compose para que o Nginx encaminhe `/api` até a API.

## Resultado esperado

- Na abertura da página, os estudantes são buscados por `GET /api/students`.
- O formulário envia `{ ra: number, name: string }` para `POST /api/students`.
- O RA precisa ser inteiro entre 1 e 2147483647. O nome aceita de 3 a 100
  caracteres, ignorando espaços no começo e no fim.
- Depois de salvar, os campos são limpos e a tabela é carregada novamente sem
  atualizar a página inteira.
- Se o RA já estiver cadastrado, a mensagem da API aparece e os valores ficam
  nos campos.
- A interface mostra os estados de consulta, tabela vazia e falha ao buscar ou salvar.

## Ideias para os testes

Crie cenários para a primeira listagem, inclusão com atualização da tabela,
permanência dos dados após recarga, campos obrigatórios, limites aceitos, RA
repetido e indisponibilidade da API.

Dê preferência a seletores acessíveis, por exemplo `getByLabel('RA')`,
`getByLabel('Nome')` e `getByRole('button', { name: 'Salvar estudante' })`.
Também estão disponíveis os atributos `data-testid`: `student-form`, `ra`,
`name`, `submit`, `form-message`, `list-message`, `students-table`,
`students-list` e `student-row`.

As mensagens expõem `data-state` com os valores `loading`, `success` ou
`error`. Durante a busca, a seção da tabela sinaliza a atividade por meio de
`aria-busy`.

Defina a URL base dos testes para esta página. A suíte que já existe em `e2e`
continua configurada para o Laboratório REST. Use um banco separado ao testar
esta interface, pois os registros são gravados na mesma base usada pelo laboratório.
