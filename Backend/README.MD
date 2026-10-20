# Conflitos de Agenda API

API REST para gerenciamento de colaboradores, períodos, projetos e solicitações de agenda.

## Execução local

```bash
cd Backend/ConflitosAgendaApi
dotnet run --launch-profile http
```

O banco é **SQLite**: o arquivo `conflitos-agenda.db` é criado na pasta da API e as migrations pendentes são aplicadas automaticamente na inicialização. Para usar outro arquivo ou caminho (por exemplo, um volume persistente no servidor), defina a variável `ConnectionStrings__DefaultConnection`, por exemplo `Data Source=/dados/conflitos-agenda.db`. Para recomeçar do zero, pare a API e apague os arquivos `conflitos-agenda.db*`.

### Primeiro administrador

Num banco sem usuários, a API cria na inicialização o primeiro **Administrador** e o Colaborador dele, a partir da configuração:

| Chave | Variável de ambiente | Desenvolvimento |
|---|---|---|
| `Admin:Usuario` | `Admin__Usuario` | `admin` |
| `Admin:SenhaInicial` | `Admin__SenhaInicial` | `admin` |
| `Admin:NomeCompleto` | `Admin__NomeCompleto` | `Administrador do Setor` |

Os valores de desenvolvimento estão em `appsettings.Development.json`. A senha inicial é temporária: no primeiro login é obrigatório defini-la de novo. Em produção, defina as variáveis de ambiente; sem elas, ninguém consegue entrar.

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

**Níveis de acesso.** O nível é **Administrador** quando marcado no Usuário; senão, é derivado do Colaborador ligado: **Coordenador** se ele for coordenador, **Colaborador** caso contrário.

| Ação | Administrador | Coordenador | Colaborador |
|---|:---:|:---:|:---:|
| Criar/alterar/excluir colaboradores e projetos; tornar coordenador; gerenciar usuários | ✅ | ❌ | ❌ |
| Listar colaboradores e projetos | ✅ | ✅ | ✅ |
| Ver solicitações | todas | próprias e atribuídas a ele | próprias |
| Ver períodos | todos | próprios + ausências planejadas dos colegas de projeto | idem |
| Criar/alterar períodos e solicitações | de qualquer colaborador | próprios | próprios |
| Aprovar/recusar (status 2 e 3) | qualquer uma, exceto a própria | atribuídas a ele, exceto a própria | ❌ |
| Excluir solicitação | qualquer uma | própria, antes da decisão | própria, antes da decisão |

O Coordenador que não é dono da solicitação só pode mudar o status (validar, aprovar, recusar), não o conteúdo. Ao aprovar ou recusar, a solicitação registra quem decidiu (`decididaPor`) e quando (`decididaEm`).

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
  "nomeUsuario": "admin",
  "nivel": "administrador",
  "precisaTrocarSenha": false,
  "colaborador": { "id": 1, "nome": "Administrador do Setor", "isCoordenador": true }
}
```

### Endpoints de usuários (somente Administrador)

| Método | Rota | Corpo | Observação |
|---|---|---|---|
| `GET` | `/api/Usuario` | — | Lista as contas, com situação (`ativo`, `bloqueado`, `precisaTrocarSenha`) |
| `POST` | `/api/Usuario` | `{ "colaboradorId", "nomeUsuario", "senhaTemporaria", "isAdministrador" }` | Cada colaborador tem no máximo um usuário |
| `PUT` | `/api/Usuario/{id}/administrador` | `{ "isAdministrador" }` | Ninguém remove o próprio acesso de administrador |
| `POST` | `/api/Usuario/{id}/redefinir-senha` | `{ "senhaTemporaria" }` | Obriga a troca no próximo login |
| `POST` | `/api/Usuario/{id}/desativar` | — | Não é possível desativar a si mesmo nem o último administrador ativo |
| `POST` | `/api/Usuario/{id}/reativar` | — | |

## Resumo dos endpoints

| Recurso | Método | Rota | Finalidade |
|---|---:|---|---|
| Colaborador | `GET` | `/api/Colaborador` | Listar colaboradores |
| Colaborador | `GET` | `/api/Colaborador/{id}` | Buscar colaborador |
| Colaborador | `POST` | `/api/Colaborador` | Criar colaborador |
| Colaborador | `PUT` | `/api/Colaborador/{id}` | Atualizar colaborador |
| Colaborador | `DELETE` | `/api/Colaborador/{id}` | Excluir colaborador |
| Colaborador | `PUT` | `/api/Colaborador/{id}/coordinator` | Tornar colaborador coordenador |
| Período | `GET` | `/api/Periodo` | Listar períodos |
| Período | `GET` | `/api/Periodo/{id}` | Buscar período |
| Período | `POST` | `/api/Periodo` | Criar período |
| Período | `PUT` | `/api/Periodo/{id}` | Atualizar período |
| Período | `DELETE` | `/api/Periodo/{id}` | Excluir período |
| Período | `GET` | `/api/Periodo/colaborador/{colaboradorId}` | Listar períodos de um colaborador |
| Período | `GET` | `/api/Periodo/validar/{periodoId}` | Verificar existência de período |
| Período | `GET` | `/api/Periodo/validar` | Validar intervalo de datas |
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
| Solicitação | `GET` | `/api/Solicitacao/projeto/{projetoId}` | Rota legada; atualmente filtra por período |
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
  "nome": "Maria Silva"
}
```

Campos:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---:|---|
| `nome` | `string` | Sim | Nome completo; único, sem diferenciar maiúsculas. O sistema não guarda e-mail (ver ADR 0003) |

Resposta: `201 Created`.

### Atualizar colaborador

```http
PUT /api/Colaborador/{id}
```

Corpo:

```json
{
  "nome": "Maria Souza"
}
```

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

### Tornar colaborador coordenador

```http
PUT /api/Colaborador/{id}/coordinator
```

O controller recebe `ColaboradorUpdateDto`, portanto o corpo esperado atualmente é:

```json
{
  "nome": "Maria Silva"
}
```

O valor de `nome` é recebido, mas a operação utiliza apenas o identificador para marcar o colaborador como coordenador.

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
| `dataFim` | `DateTime` | Sim | Intervalo deve ter entre 10 e 30 dias |
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
- `400 Bad Request` quando o intervalo é inválido.

### Excluir período

```http
DELETE /api/Periodo/{id}
```

Resposta:

- `204 No Content` quando excluído;
- `404 Not Found` quando não encontrado.

### Listar períodos por colaborador

```http
GET /api/Periodo/colaborador/{colaboradorId}
```

Resposta: `200 OK` com os períodos associados ao colaborador.

### Validar existência de período

```http
GET /api/Periodo/validar/{periodoId}
```

Resposta:

- `200 OK` quando o período existe;
- `400 Bad Request` quando o período não existe.

### Validar intervalo de datas

```http
GET /api/Periodo/validar?dataInicio=2026-10-15T00:00:00&dataFim=2026-10-25T00:00:00
```

Parâmetros query:

| Parâmetro | Tipo | Obrigatório | Regra |
|---|---|---:|---|
| `dataInicio` | `DateTime` | Sim | Deve ser anterior a `dataFim` |
| `dataFim` | `DateTime` | Sim | Intervalo mínimo de 10 dias e máximo de 30 dias |

Resposta:

- `200 OK` quando válido;
- `400 Bad Request` quando inválido.

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
      "isCoordenador": false
    }
  ],
  "colaboradores": [
    {
      "id": 1,
      "nome": "Maria Silva",
      "isCoordenador": true
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
| `isCoordenador` | `bool` |

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
      "isCoordenador": true
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

### Rota legada `projeto`

```http
GET /api/Solicitacao/projeto/{projetoId}
```

Esta rota é mantida por compatibilidade. Apesar do nome e do parâmetro `projetoId`, a implementação atual encaminha a chamada para a consulta por período e filtra pelo ID informado como se fosse um `periodoId`.

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
    "isCoordenador": false
  },
  "periodos": [
    {
      "id": 10,
      "dataInicio": "2026-10-15T00:00:00",
      "dataFim": "2026-10-25T00:00:00",
      "idColaborador": 1
    }
  ],
  "status": 1,
  "criadaEm": "2026-10-14T11:00:00-03:00",
  "coordenador": {
    "id": 2,
    "nome": "João Santos",
    "isCoordenador": true
  },
  "observacao": "Solicitação de ausência.",
  "totalDias": 10,
  "abono": false,
  "isPessoaCritica": false
}
```

Campos:

| Campo | Tipo | Obrigatório | Observação |
|---|---|---:|---|
| `colaborador` | `Colaborador` | Sim | Objeto completo |
| `periodos` | `array<Periodo>` | Sim | Entre 1 e 3 períodos |
| `status` | `int` | Sim | Use os valores do enum |
| `criadaEm` | `DateTimeOffset` | Sim | Data de criação |
| `coordenador` | `Colaborador` | Sim | Objeto completo |
| `observacao` | `string` | Não | Observação opcional |
| `totalDias` | `int` | Sim | Total de dias informado |
| `abono` | `bool` | Sim | Quando `true`, permite no máximo 2 períodos e 20 dias |
| `isPessoaCritica` | `bool` | Sim | Indica se o solicitante é pessoa crítica |

Regras adicionais aplicadas pelo service:

- a solicitação deve conter entre 1 e 3 períodos;
- quando `abono` for `true`, deve conter no máximo 2 períodos;
- quando `abono` for `true`, `totalDias` não pode ser maior que 20.

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
    "isCoordenador": false
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
  "coordenador": {
    "id": 2,
    "nome": "João Santos",
    "isCoordenador": true
  },
  "observacao": "Período atualizado.",
  "totalDias": 10
}
```

O `id` da rota identifica a solicitação. As regras de quantidade de períodos e abono são reaplicadas antes da persistência.

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

1. `GET /api/Solicitacao/projeto/{projetoId}` possui nome de projeto, mas atualmente filtra por período.
2. O endpoint `PUT /api/Colaborador/{id}/coordinator` recebe `nome`, embora use apenas o ID para tornar o colaborador coordenador.
3. Projetos e solicitações recebem objetos completos nos payloads, embora só o `id` seja usado.
4. `PUT /api/Solicitacao/{id}/validate` retorna apenas um booleano e não altera o status da solicitação.
5. A validação de conflito só considera solicitantes que são pessoas críticas e compara com todos os períodos das outras pessoas críticas, inclusive os de solicitações recusadas.
6. Cada período pertence a no máximo uma solicitação no banco: usar um período em outra solicitação o remove da anterior.
