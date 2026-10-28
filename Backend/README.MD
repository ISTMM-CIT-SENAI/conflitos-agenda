# Conflitos de Agenda API

API REST para gerenciamento de colaboradores, períodos, projetos e solicitações de agenda.

## Execução local

```bash
cd Backend/ConflitosAgendaApi
dotnet run --launch-profile http
```

O banco é **SQLite**: o arquivo `conflitos-agenda.db` é criado na pasta da API e as migrations pendentes são aplicadas automaticamente na inicialização. Para usar outro arquivo ou caminho (por exemplo, um volume persistente no servidor), defina a variável `ConnectionStrings__DefaultConnection`, por exemplo `Data Source=/dados/conflitos-agenda.db`. Para recomeçar do zero, pare a API e apague os arquivos `conflitos-agenda.db*`.

### Carga inicial do ISTMM

Num banco **sem colaboradores**, a API cadastra na inicialização as pessoas e os projetos do ISTMM, a partir de `data/seed-istmm.json` (gerado de `docs/planilhas/funcionarios.xlsx` e `pontos focais.xlsx`):

- 39 colaboradores com a hierarquia ("Responde a"): o coordenador, 3 supervisores e os demais;
- os 10 projetos do ISTMM, com os responsáveis técnicos principal e secundário como membros e pessoas críticas;
- um usuário por pessoa (`primeironome.ultimosobrenome`; se coincidir, entra o segundo nome), com **senha temporária aleatória** e troca obrigatória no primeiro acesso.

As senhas são gravadas **uma única vez** em `credenciais-iniciais.csv`, na pasta da API (fora do git; abre no Excel). Entregue a senha de cada pessoa individualmente e apague o arquivo. Se o banco já tiver colaboradores, nada é feito: para refazer a carga, apague `conflitos-agenda.db*`.

Perfis configurados em `Backend/ConflitosAgendaApi/Properties/launchSettings.json`:

```text
http://localhost:5165
https://localhost:7098
```

As URLs abaixo usam:

```text
http://localhost:5165
```

Todas as requisições com corpo devem usar:

```http
Content-Type: application/json
```

## Observações gerais

- Os identificadores `{id}`, `{colaboradorId}`, `{periodoId}` e `{projetoId}` são inteiros.
- Datas `DateTime` devem ser enviadas em formato ISO 8601, por exemplo: `2026-10-15T08:00:00`.
- Datas `DateTimeOffset` devem incluir o fuso horário, por exemplo: `2026-10-14T11:00:00-03:00`.
- O enum `StatusSolicitacao` é representado por números:
  - `1` — `Em_Analise`
  - `2` — `Aprovada`
  - `3` — `Recusada`
  - `4` — `Conflito_Encontrado`
- Respostas `204 No Content` não possuem corpo.
- Os DTOs de projeto e solicitação recebem objetos de `Colaborador` e `Periodo`, mas **apenas o `id` é usado**: os registros são carregados do banco, e um ID inexistente retorna `400`. Os demais campos são aceitos por compatibilidade e ignorados.
- Erros de regra de negócio retornam `400`, registros inexistentes `404` e exclusões bloqueadas por vínculos `409`, todos no formato ProblemDetails com a mensagem no campo `detail`.

## Autenticação e níveis de acesso

Toda rota exige login, exceto `POST /api/Auth/login` e `POST /api/Auth/logout`. A sessão é um cookie `HttpOnly` (`conflitos-agenda.sessao`, `SameSite=Strict`) emitido pela API, que expira após 8 horas sem uso. As senhas são guardadas apenas como hash (PasswordHasher do ASP.NET Core: PBKDF2 com HMAC-SHA512 e sal aleatório).

| Situação | Resposta |
|---|---|
| Sem sessão ou sessão inválida | `401 Unauthorized` |
| Nível de acesso insuficiente | `403 Forbidden` com a mensagem em `detail` |
| Senha temporária ainda não trocada | `403 Forbidden` com `type: "troca-de-senha-obrigatoria"`; só as rotas de `/api/Auth` respondem |

**Regras de credenciais:** nome de usuário de 3 a 30 caracteres (letras, números, `.`, `_`, `-`), único e sem diferenciar maiúsculas; senha com no mínimo 8 caracteres; após 5 tentativas erradas, o login fica bloqueado por 15 minutos. Trocar ou redefinir a senha, ou desativar o usuário, encerra as sessões abertas dele.

**Níveis de acesso.** O nível é **Coordenador** quando marcado no Usuário; senão, é derivado do Colaborador ligado: **Supervisor** se ele for supervisor, **Colaborador** caso contrário.

| Ação | Coordenador | Supervisor | Colaborador |
|---|:---:|:---:|:---:|
| Criar/alterar/excluir colaboradores e projetos; tornar supervisor; gerenciar usuários | ✅ | ❌ | ❌ |
| Listar colaboradores e projetos | ✅ | ✅ | ✅ |
| Ver solicitações | todas | próprias e de quem responde a ele | próprias |
| Ver períodos | todos | próprios + ausências planejadas dos colegas de projeto | idem |
| Criar/alterar períodos e solicitações | de qualquer colaborador | próprios | próprios |
| Aprovar/recusar (status 2 e 3) | qualquer uma, exceto a própria | de quem responde a ele | ❌ |
| Excluir solicitação | qualquer uma | própria, antes da decisão | própria, antes da decisão |

O Supervisor que não é dono da solicitação só pode mudar o status (validar, aprovar, recusar), não o conteúdo. Ao aprovar ou recusar, a solicitação registra quem decidiu (`decididaPor`) e quando (`decididaEm`).

### Endpoints de autenticação

| Método | Rota | Corpo | Resposta |
|---|---|---|---|
| `POST` | `/api/Auth/login` | `{ "nomeUsuario", "senha" }` | `200` com o usuário logado; `401` com a mensagem (credenciais inválidas ou bloqueio) |
| `POST` | `/api/Auth/logout` | — | `204` |
| `GET` | `/api/Auth/eu` | — | `200` com o usuário logado; `401` sem sessão |
| `POST` | `/api/Auth/trocar-senha` | `{ "senhaAtual", "novaSenha" }` | `200` com o usuário logado |

Usuário logado:

```json
{
  "id": 1,
  "nomeUsuario": "hernane.moreira",
  "nivel": "coordenador",
  "precisaTrocarSenha": false,
  "colaborador": { "id": 1, "nome": "Hernane do Bom Sucesso Xavier Moreira", "isSupervisor": true }
}
```

### Endpoints de usuários (somente Coordenador)

| Método | Rota | Corpo | Observação |
|---|---|---|---|
| `GET` | `/api/Usuario` | — | Lista as contas, com situação (`ativo`, `bloqueado`, `precisaTrocarSenha`) |
| `POST` | `/api/Usuario` | `{ "colaboradorId", "nomeUsuario", "senhaTemporaria", "isCoordenador" }` | Cada colaborador tem no máximo um usuário |
| `PUT` | `/api/Usuario/{id}/coordenador` | `{ "isCoordenador" }` | Ninguém remove o próprio acesso de coordenador |
| `POST` | `/api/Usuario/{id}/redefinir-senha` | `{ "senhaTemporaria" }` | Obriga a troca no próximo login |
| `POST` | `/api/Usuario/{id}/desativar` | — | Não é possível desativar a si mesmo nem o último coordenador ativo |
| `POST` | `/api/Usuario/{id}/reativar` | — | |

## Resumo dos endpoints

| Recurso | Método | Rota | Finalidade |
|---|---:|---|---|
| Colaborador | `GET` | `/api/Colaborador` | Listar colaboradores |
| Colaborador | `GET` | `/api/Colaborador/{id}` | Buscar colaborador |
| Colaborador | `POST` | `/api/Colaborador` | Criar colaborador |
| Colaborador | `PUT` | `/api/Colaborador/{id}` | Atualizar colaborador |
| Colaborador | `DELETE` | `/api/Colaborador/{id}` | Excluir colaborador |
| Colaborador | `PUT` | `/api/Colaborador/{id}/supervisor` | Tornar colaborador supervisor |
| Período | `GET` | `/api/Periodo` | Listar períodos |
| Período | `GET` | `/api/Periodo/{id}` | Buscar período |
| Período | `POST` | `/api/Periodo` | Criar período |
| Período | `PUT` | `/api/Periodo/{id}` | Atualizar período |
| Período | `DELETE` | `/api/Periodo/{id}` | Excluir período |
| Período | `GET` | `/api/Periodo/colaborador/{colaboradorId}` | Listar períodos de um colaborador |
| Projeto | `GET` | `/api/Projeto` | Listar projetos |
| Projeto | `GET` | `/api/Projeto/{id}` | Buscar projeto |
| Projeto | `POST` | `/api/Projeto` | Criar projeto |
| Projeto | `PUT` | `/api/Projeto/{id}` | Atualizar projeto |
| Projeto | `DELETE` | `/api/Projeto/{id}` | Excluir projeto |
| Projeto | `GET` | `/api/Projeto/{id}/colaboradores` | Listar colaboradores do projeto |
| Solicitação | `GET` | `/api/Solicitacao` | Listar solicitações |
| Solicitação | `GET` | `/api/Solicitacao/{id}` | Buscar solicitação |
| Solicitação | `GET` | `/api/Solicitacao/colaborador/{colaboradorId}` | Listar solicitações de um colaborador |
| Solicitação | `GET` | `/api/Solicitacao/periodo/{periodoId}` | Listar solicitações de um período |
| Solicitação | `GET` | `/api/Solicitacao/status/{status}` | Listar solicitações por status |
| Solicitação | `POST` | `/api/Solicitacao` | Criar solicitação |
| Solicitação | `PUT` | `/api/Solicitacao/{id}` | Atualizar solicitação |
| Solicitação | `DELETE` | `/api/Solicitacao/{id}` | Excluir solicitação |
| Solicitação | `PUT` | `/api/Solicitacao/{id}/validate` | Validar conflitos da solicitação |

---

## Colaboradores

### Listar colaboradores

```http
GET /api/Colaborador
```

Resposta: `200 OK` com uma lista de colaboradores.

### Buscar colaborador

```http
GET /api/Colaborador/{id}
```

Resposta:

- `200 OK` quando encontrado;
- `404 Not Found` quando não encontrado.

### Criar colaborador

```http
POST /api/Colaborador
```

Corpo:

```json
{
  "nome": "Maria Silva",
  "respondeAId": 2
}
```

Campos:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---:|---|
| `nome` | `string` | Sim | Nome completo; único, sem diferenciar maiúsculas. O sistema não guarda e-mail (ver ADR 0003) |
| `respondeAId` | `int?` | Não | Supervisor que recebe as solicitações; precisa ser supervisor e não pode ser o próprio. Nulo só para o Coordenador. A resposta traz `respondeA: { id, nome }` |

Resposta: `201 Created`.

### Atualizar colaborador

```http
PUT /api/Colaborador/{id}
```

Corpo:

```json
{
  "nome": "Maria Souza",
  "respondeAId": 2
}
```

Envie sempre `respondeAId`: omitido, ele é gravado como nulo.

Resposta:

- `200 OK` quando atualizado;
- `404 Not Found` quando o colaborador não existe.

### Excluir colaborador

```http
DELETE /api/Colaborador/{id}
```

Resposta:

- `204 No Content` quando excluído;
- `404 Not Found` quando não encontrado.
- `400 Bad Request` quando o colaborador tem acesso ativo ao sistema (desative o usuário antes; um usuário já desativado é excluído junto);
- `409 Conflict` quando ainda há períodos, solicitações ou decisões vinculados.

### Tornar colaborador supervisor

```http
PUT /api/Colaborador/{id}/supervisor
```

O controller recebe `ColaboradorUpdateDto`, portanto o corpo esperado atualmente é:

```json
{
  "nome": "Maria Silva",
  "respondeAId": 2
}
```

O valor de `nome` é recebido, mas a operação utiliza apenas o identificador para marcar o colaborador como supervisor.

Resposta:

- `200 OK` quando atualizado;
- `404 Not Found` quando não encontrado;
- `400 Bad Request` quando a atualização falha.

---

## Períodos

### Listar períodos

```http
GET /api/Periodo
```

Resposta: `200 OK` com uma lista de períodos.

### Buscar período

```http
GET /api/Periodo/{id}
```

Resposta:

- `200 OK` quando encontrado;
- `404 Not Found` quando não encontrado.

### Criar período

```http
POST /api/Periodo
```

Corpo:

```json
{
  "dataInicio": "2026-10-15T00:00:00",
  "dataFim": "2026-10-25T00:00:00",
  "idColaborador": 1
}
```

Campos:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---:|---|
| `dataInicio` | `DateTime` | Sim | Deve ser anterior a `dataFim` |
| `dataFim` | `DateTime` | Sim | Retorno: de 5 a 30 dias após o início. O início não pode cair nos 2 dias antes de domingo ou feriado (nacional ou de BH) |
| `idColaborador` | `int` | Sim | Colaborador dono do período |

Resposta:

- `201 Created` quando criado;
- `400 Bad Request` quando as datas são inválidas.

### Atualizar período

```http
PUT /api/Periodo/{id}
```

Corpo:

```json
{
  "dataInicio": "2026-10-16T00:00:00",
  "dataFim": "2026-10-26T00:00:00",
  "idColaborador": 1
}
```

O `id` da rota identifica o período. O `idColaborador` é atualizado quando informado (maior que zero).

Resposta:

- `200 OK` quando atualizado;
- `404 Not Found` quando não encontrado;
- `400 Bad Request` quando o intervalo é inválido, quando o período faz parte de uma solicitação já decidida, ou quando a solicitação em aberto ficaria fora das regras da CLT para o ano.

### Excluir período

```http
DELETE /api/Periodo/{id}
```

Resposta:

- `204 No Content` quando excluído;
- `404 Not Found` quando não encontrado;
- `400 Bad Request` quando o período faz parte de uma solicitação.

### Listar períodos por colaborador

```http
GET /api/Periodo/colaborador/{colaboradorId}
```

Resposta: `200 OK` com os períodos associados ao colaborador.

---

## Projetos

### Listar projetos

```http
GET /api/Projeto
```

Resposta: `200 OK` com uma lista de projetos.

### Buscar projeto

```http
GET /api/Projeto/{id}
```

Resposta:

- `200 OK` quando encontrado;
- `404 Not Found` quando não encontrado.

### Criar projeto

```http
POST /api/Projeto
```

Corpo:

```json
{
  "nome": "Projeto Alfa",
  "pessoasCriticas": [
    {
      "id": 2,
      "nome": "João Santos",
      "isSupervisor": false
    }
  ],
  "colaboradores": [
    {
      "id": 1,
      "nome": "Maria Silva",
      "isSupervisor": true
    }
  ]
}
```

Campos:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---:|---|
| `nome` | `string` | Sim | Nome do projeto |
| `pessoasCriticas` | `array<Colaborador>` | Sim | Objetos completos de colaboradores |
| `colaboradores` | `array<Colaborador>` | Sim | Objetos completos de colaboradores |

Objeto `Colaborador`:

| Campo | Tipo |
|---|---|
| `id` | `int` |
| `nome` | `string` |
| `isSupervisor` | `bool` |

Resposta: `201 Created`.

### Atualizar projeto

```http
PUT /api/Projeto/{id}
```

O corpo possui o mesmo formato da criação:

```json
{
  "nome": "Projeto Alfa Atualizado",
  "pessoasCriticas": [],
  "colaboradores": [
    {
      "id": 1,
      "nome": "Maria Silva",
      "isSupervisor": true
    }
  ]
}
```

Resposta:

- `200 OK` quando atualizado;
- `404 Not Found` quando o projeto não existe.

### Excluir projeto

```http
DELETE /api/Projeto/{id}
```

Resposta:

- `204 No Content` quando excluído;
- `404 Not Found` quando não encontrado;
- `400 Bad Request` quando a exclusão falha.

### Listar colaboradores de um projeto

```http
GET /api/Projeto/{id}/colaboradores
```

Resposta:

- `200 OK` com os colaboradores;
- `404 Not Found` quando o projeto não existe.

---

## Solicitações

### Listar solicitações

```http
GET /api/Solicitacao
```

Resposta: `200 OK` com uma lista de solicitações.

### Buscar solicitação

```http
GET /api/Solicitacao/{id}
```

Resposta:

- `200 OK` quando encontrada;
- `404 Not Found` quando não encontrada.

### Listar solicitações por colaborador

```http
GET /api/Solicitacao/colaborador/{colaboradorId}
```

Resposta:

- `200 OK` com as solicitações;
- `404 Not Found` quando não houver solicitações.

### Listar solicitações por período

```http
GET /api/Solicitacao/periodo/{periodoId}
```

Resposta:

- `200 OK` com as solicitações associadas;
- `404 Not Found` quando não houver solicitações.

### Listar solicitações por status

```http
GET /api/Solicitacao/status/{status}
```

Exemplo:

```http
GET /api/Solicitacao/status/1
```

Valores aceitos:

| Valor | Status |
|---:|---|
| `1` | `Em_Analise` |
| `2` | `Aprovada` |
| `3` | `Recusada` |
| `4` | `Conflito_Encontrado` |

Resposta:

- `200 OK` com as solicitações;
- `404 Not Found` quando não houver solicitações.

### Criar solicitação

```http
POST /api/Solicitacao
```

Corpo:

```json
{
  "colaborador": {
    "id": 1,
    "nome": "Maria Silva",
    "isSupervisor": false
  },
  "periodos": [
    {
      "id": 10,
      "dataInicio": "2026-10-15T00:00:00",
      "dataFim": "2026-10-25T00:00:00",
      "idColaborador": 1
    }
  ],
  "criadaEm": "2026-10-14T11:00:00-03:00",
  "observacao": "Solicitação de ausência.",
  "abono": false,
  "isPessoaCritica": false
}
```

Campos:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---:|---|
| `colaborador` | `Colaborador` | Sim | Objeto completo |
| `periodos` | `array<Periodo>` | Sim | Entre 1 e 3 períodos |
| `criadaEm` | `DateTimeOffset` | Sim | Data de criação |
| `observacao` | `string` | Não | Observação opcional |
| `abono` | `bool` | Sim | Abono pecuniário: quando `true`, os períodos somam 20 dias em vez de 30 |
| `isPessoaCritica` | `bool` | Sim | Indica se o solicitante é pessoa crítica |

Regras aplicadas pelo service (CLT, art. 134 e 143):

- entre 1 e 3 períodos, cada um com pelo menos 5 dias;
- a solicitação pode ser só uma parte das férias. Somando as solicitações não recusadas do colaborador no mesmo ano civil (o do primeiro dia de ausência de cada uma): no máximo 3 períodos e 30 dias, ou 20 se alguma tiver `abono`;
- um dos períodos do ano precisa ter pelo menos 14 dias: sem nenhum até ali, o pedido é recusado se não sobrar espaço (dias e períodos) para ele;
- o supervisor não vem no corpo: é quem o colaborador responde (`respondeA`), e não muda depois. Sem `respondeA`, a criação falha, exceto para o Coordenador, cuja solicitação já nasce **Aprovada** com a Decisão registrada;
- `status` e `totalDias` são definidos pela API (`Em_Analise` e a soma dos períodos).

Resposta: `201 Created`.

### Atualizar solicitação

```http
PUT /api/Solicitacao/{id}
```

Corpo:

```json
{
  "colaborador": {
    "id": 1,
    "nome": "Maria Silva",
    "isSupervisor": false
  },
  "periodos": [
    {
      "id": 10,
      "dataInicio": "2026-10-16T00:00:00",
      "dataFim": "2026-10-26T00:00:00",
      "idColaborador": 1
    }
  ],
  "status": 1,
  "criadaEm": "2026-10-14T11:00:00-03:00",
  "observacao": "Período atualizado."
}
```

O `id` da rota identifica a solicitação. As regras da CLT para o ano são reaplicadas antes da persistência; o supervisor encaminhado é mantido.

Resposta:

- `200 OK` quando atualizada;
- `404 Not Found` quando não encontrada.

### Excluir solicitação

```http
DELETE /api/Solicitacao/{id}
```

Resposta:

- `204 No Content` quando excluída;
- `404 Not Found` quando não encontrada.

### Validar conflitos da solicitação

```http
PUT /api/Solicitacao/{id}/validate
```

Não exige corpo.

A operação verifica se os períodos da solicitação entram em conflito com períodos de outras pessoas críticas nos projetos relevantes.

Resposta:

- `200 OK` com `true` quando não há conflito;
- `400 Bad Request` com a mensagem de falha quando há conflito;
- erro de validação quando a solicitação não possui períodos ou colaborador válido;
- `404 Not Found` quando a solicitação não existe.

## Divergências atuais documentadas

1. O endpoint `PUT /api/Colaborador/{id}/supervisor` recebe `nome`, embora use apenas o ID para tornar o colaborador supervisor.
2. Projetos e solicitações recebem objetos completos nos payloads, embora só o `id` seja usado.
3. `PUT /api/Solicitacao/{id}/validate` retorna apenas um booleano e não altera o status da solicitação.
4. Cada período pertence a no máximo uma solicitação no banco. Por isso a API recusa períodos de outra pessoa numa solicitação, e não deixa alterar nem excluir um período que já faz parte de uma.
