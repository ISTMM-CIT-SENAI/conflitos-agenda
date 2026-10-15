# Contexto do frontend — Conflitos de Agenda

## 1. Objetivo deste documento

Este documento fornece ao Claude Code o contexto funcional e técnico para
desenvolver o frontend do projeto **Conflitos de Agenda**.

O repositório atual contém uma API ASP.NET Core em
`Backend/ConflitosAgendaApi`. A primeira versão do frontend deve funcionar com
dados mockados, mas a arquitetura precisa manter uma camada de serviços com os
mesmos contratos da API para permitir a substituição posterior dos mocks por
requisições HTTP sem reescrever as telas.

Não alterar o backend como parte da implementação inicial do frontend, salvo
se isso for explicitamente solicitado. A configuração de CORS descrita neste
documento é um requisito futuro da integração real.

---

## 2. Decisões confirmadas

- Stack: **React + TypeScript + Vite**.
- Idioma da interface: **Português do Brasil**.
- Tipo de aplicação: painel administrativo completo.
- Público inicial: usuários administrativos, sem autenticação.
- A primeira versão usa dados mockados.
- Os mocks devem ficar atrás de uma camada de serviços/repositórios
  substituível por um cliente HTTP.
- A interface deve ter aparência de dashboard corporativo responsivo, com:
  - sidebar;
  - tabelas;
  - filtros;
  - formulários;
  - indicadores;
  - calendário.
- Períodos são exibidos e editados como **datas**, sem necessidade de seleção
  de horário.
- Aprovação e recusa usam o `PUT /api/Solicitacao/{id}` alterando o campo
  `Status`, pois a API não possui endpoints específicos para essas ações.
- A rota legada
  `GET /api/Solicitacao/projeto/{projetoId}` não deve ser usada.
- O frontend não deve criar filtro de solicitações por projeto baseado nessa
  rota legada.
- A decisão sobre persistir mocks em memória ou em `localStorage` fica a
  critério do Claude Code. A recomendação é usar `localStorage` para tornar a
  demonstração funcional após recarregar a página.

---

## 3. Visão funcional

O sistema organiza períodos de indisponibilidade de colaboradores e permite
que solicitações sejam criadas, validadas e analisadas.

Entidades principais:

### Colaborador

- `id`: inteiro gerado pela API.
- `nome`: obrigatório.
- `email`: obrigatório e deve ser válido.
- `isCoordenador`: indica se pode atuar como coordenador.
- `projetos`: lista de projetos relacionados.

### Período

- `id`: inteiro.
- `dataInicio`: data inicial.
- `dataFim`: data final.
- `idColaborador`: colaborador relacionado.

Regras conhecidas:

- A data inicial deve ser anterior à data final.
- A API possui validações de duração mínima e máxima no serviço.
- O frontend deve impedir, sempre que possível, intervalos obviamente inválidos
  antes do envio.

### Projeto

- `id`: inteiro.
- `nome`: obrigatório.
- `pessoasCriticas`: lista de colaboradores.
- `colaboradores`: lista de colaboradores.

Os DTOs atuais recebem objetos completos de `Colaborador`, não apenas IDs.
Enquanto a integração real não for implementada, a camada de dados do frontend
deve trabalhar com IDs na experiência da interface e converter os selecionados
para objetos completos na borda do serviço.

### Solicitação

- `id`: inteiro.
- `colaborador`: colaborador solicitante.
- `periodos`: entre 1 e 3 períodos.
- `status`: estado da solicitação.
- `criadaEm`: data/hora de criação.
- `coordenador`: colaborador responsável pela análise.
- `totalDias`: total informado.
- `observacao`: texto opcional.
- `abono`: indica solicitação de abono.
- `isPessoaCritica`: indica pessoa crítica.

Enumeração `StatusSolicitacao`:

| Valor | Nome | Texto sugerido na interface |
|---:|---|---|
| 1 | `Em_Analise` | Em análise |
| 2 | `Aprovada` | Aprovada |
| 3 | `Recusada` | Recusada |
| 4 | `Conflito_Encontrado` | Conflito encontrado |

Regras conhecidas:

- Uma solicitação deve conter de 1 a 3 períodos.
- Se `abono` for verdadeiro, a solicitação pode conter no máximo 2 períodos.
- Se `abono` for verdadeiro, `totalDias` não pode ser maior que 20.
- A validação de conflito verifica sobreposição de períodos.
- Períodos adjacentes não são considerados conflito.
- A validação de conflito retorna um booleano, mas atualmente não altera
  automaticamente o status da solicitação.

---

## 4. Escopo de telas

### 4.1 Dashboard inicial

Criar uma visão resumida com:

- quantidade de colaboradores;
- quantidade de projetos;
- quantidade de solicitações em análise;
- quantidade de solicitações aprovadas;
- quantidade de solicitações recusadas;
- quantidade de solicitações com conflito;
- próximas solicitações ou períodos relevantes;
- acesso rápido para criar uma solicitação.

Os indicadores devem ser calculados a partir do estado dos serviços mockados,
não hardcoded na tela.

### 4.2 Colaboradores

Criar:

- listagem paginada ou com paginação visual;
- busca por nome e e-mail;
- criação;
- edição;
- exclusão com confirmação;
- indicação visual de coordenador;
- ação para tornar um colaborador coordenador;
- acesso aos períodos do colaborador;
- acesso às solicitações do colaborador.

Formulário:

- nome;
- e-mail.

### 4.3 Projetos

Criar:

- listagem;
- busca por nome;
- criação;
- edição;
- exclusão com confirmação;
- visualização dos colaboradores;
- gerenciamento de colaboradores do projeto;
- gerenciamento de pessoas críticas.

Como a API recebe listas de objetos completos, usar seletores por ID na UI e
fazer a conversão no serviço.

### 4.4 Períodos

Criar:

- listagem;
- filtro por colaborador;
- formulário de criação;
- edição;
- exclusão com confirmação;
- validação visual do intervalo;
- visualização em calendário.

O usuário deve selecionar:

- colaborador;
- data inicial;
- data final.

Enviar datas em formato ISO compatível com a API. A UI deve exibir datas no
formato brasileiro, mas não deve enviar strings localizadas como
`15/10/2026` para a camada de API.

### 4.5 Solicitações

Criar:

- listagem;
- busca;
- filtros por status, colaborador e período;
- ordenação por criação;
- visualização detalhada;
- criação;
- edição;
- exclusão;
- validação de conflito;
- aprovação;
- recusa;
- indicação de abono;
- indicação de pessoa crítica;
- edição de observação.

Fluxo sugerido:

1. Usuário seleciona o colaborador.
2. Usuário escolhe o coordenador.
3. Usuário adiciona de 1 a 3 períodos.
4. Usuário informa total de dias.
5. Usuário informa se é abono.
6. Usuário informa se é pessoa crítica.
7. Frontend valida os campos básicos.
8. Frontend salva a solicitação.
9. Usuário pode executar a validação de conflitos.
10. Usuário pode aprovar ou recusar pelo fluxo de atualização de status.

Ao recusar, exigir uma observação antes de confirmar a ação.

### 4.6 Calendário

O calendário deve permitir visualizar:

- períodos dos colaboradores;
- solicitações relacionadas;
- conflitos identificados;
- filtros por colaborador;
- filtros por status;
- navegação por mês.

Como a API trabalha com `DateTime`, tratar os períodos como eventos de data
sem horário na primeira versão. Evitar conversões que façam o evento mudar de
dia por causa de UTC.

---

## 5. Arquitetura esperada do frontend

Usar uma separação que facilite a troca de mock por API:

```text
src/
  app/
    routes/
    providers/
  components/
    layout/
    common/
    forms/
    tables/
    feedback/
  features/
    colaboradores/
    projetos/
    periodos/
    solicitacoes/
    dashboard/
    calendario/
  domain/
    entities/
    enums/
    validation/
  services/
    contracts/
    mocks/
    http/
  hooks/
  lib/
  styles/
  types/
```

Regras:

- Componentes de tela não devem conhecer detalhes de `fetch` ou do mock.
- Usar contratos tipados para cada recurso.
- Criar uma implementação mockada dos serviços.
- Criar uma implementação HTTP preparada, mesmo que inicialmente não seja
  ativada.
- Selecionar a implementação por configuração, por exemplo:
  `VITE_DATA_SOURCE=mock` ou `VITE_DATA_SOURCE=api`.
- Centralizar tratamento de loading, erro, vazio e sucesso.
- Não duplicar regras de status ou conversão de datas em vários componentes.
- Não usar `any` para contornar incompatibilidades de tipos.

Uma organização possível para os serviços:

```ts
interface ColaboradorService {
  listar(): Promise<Colaborador[]>;
  buscarPorId(id: number): Promise<Colaborador | null>;
  criar(input: ColaboradorInput): Promise<Colaborador>;
  atualizar(id: number, input: ColaboradorInput): Promise<Colaborador>;
  excluir(id: number): Promise<void>;
  tornarCoordenador(id: number, input: ColaboradorInput): Promise<Colaborador>;
}
```

Criar contratos equivalentes para `Projeto`, `Periodo` e `Solicitacao`.

---

## 6. Contrato da API para integração futura

Base HTTP local:

```text
http://localhost:5165
```

Base HTTPS local:

```text
https://localhost:7098
```

Todas as requisições com corpo usam:

```http
Content-Type: application/json
```

### Colaborador

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/Colaborador` | listar |
| GET | `/api/Colaborador/{id}` | buscar |
| POST | `/api/Colaborador` | criar |
| PUT | `/api/Colaborador/{id}` | atualizar |
| DELETE | `/api/Colaborador/{id}` | excluir |
| PUT | `/api/Colaborador/{id}/coordinator` | tornar coordenador |

Payload de criação/edição:

```json
{
  "nome": "Maria Silva",
  "email": "maria.silva@example.com"
}
```

O endpoint de coordenador atualmente também recebe esse payload, embora use
principalmente o ID.

### Período

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/Periodo` | listar |
| GET | `/api/Periodo/{id}` | buscar |
| POST | `/api/Periodo` | criar |
| PUT | `/api/Periodo/{id}` | atualizar |
| DELETE | `/api/Periodo/{id}` | excluir |
| GET | `/api/Periodo/colaborador/{colaboradorId}` | filtrar por colaborador |
| GET | `/api/Periodo/validar/{periodoId}` | validar período existente |
| GET | `/api/Periodo/validar?dataInicio=...&dataFim=...` | validar intervalo |

Payload:

```json
{
  "dataInicio": "2026-10-15T00:00:00",
  "dataFim": "2026-10-20T00:00:00",
  "idColaborador": 1
}
```

### Projeto

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/Projeto` | listar |
| GET | `/api/Projeto/{id}` | buscar |
| POST | `/api/Projeto` | criar |
| PUT | `/api/Projeto/{id}` | atualizar |
| DELETE | `/api/Projeto/{id}` | excluir |
| GET | `/api/Projeto/{id}/colaboradores` | listar colaboradores |

Payload conceitual:

```json
{
  "nome": "Projeto A",
  "pessoasCriticas": [
    {
      "id": 1,
      "nome": "Maria Silva",
      "email": "maria.silva@example.com",
      "isCoordenador": false,
      "projetos": []
    }
  ],
  "colaboradores": [
    {
      "id": 1,
      "nome": "Maria Silva",
      "email": "maria.silva@example.com",
      "isCoordenador": false,
      "projetos": []
    }
  ]
}
```

O cliente deve usar os dados reais retornados pelo endpoint, sem inventar
campos adicionais.

### Solicitação

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/Solicitacao` | listar |
| GET | `/api/Solicitacao/{id}` | buscar |
| GET | `/api/Solicitacao/colaborador/{colaboradorId}` | filtrar por colaborador |
| GET | `/api/Solicitacao/periodo/{periodoId}` | filtrar por período |
| GET | `/api/Solicitacao/status/{status}` | filtrar por status numérico |
| POST | `/api/Solicitacao` | criar |
| PUT | `/api/Solicitacao/{id}` | atualizar/status |
| DELETE | `/api/Solicitacao/{id}` | excluir |
| PUT | `/api/Solicitacao/{id}/validate` | validar conflito |

Não usar:

```text
GET /api/Solicitacao/projeto/{projetoId}
```

Essa rota é legada e atualmente executa uma busca por período, apesar do nome.

Payload conceitual:

```json
{
  "colaborador": {
    "id": 1,
    "nome": "Maria Silva",
    "email": "maria.silva@example.com",
    "isCoordenador": false,
    "projetos": []
  },
  "periodos": [
    {
      "id": 10,
      "dataInicio": "2026-10-15T00:00:00",
      "dataFim": "2026-10-20T00:00:00",
      "idColaborador": 1
    }
  ],
  "status": 1,
  "criadaEm": "2026-10-14T17:00:00-03:00",
  "coordenador": {
    "id": 2,
    "nome": "João Souza",
    "email": "joao.souza@example.com",
    "isCoordenador": true,
    "projetos": []
  },
  "observacao": null,
  "totalDias": 5,
  "abono": false,
  "isPessoaCritica": false
}
```

Para aprovar, enviar `status: 2`. Para recusar, enviar `status: 3` e uma
`observacao`.

---

## 7. Estados de interface

Toda listagem e operação assíncrona deve possuir estados explícitos:

- carregando;
- sucesso;
- lista vazia;
- erro;
- salvando;
- excluindo;
- validando;
- operação concluída.

Mensagens para o usuário devem ser claras e em português. Erros de validação
devem aparecer próximos aos campos; erros de operação devem aparecer também
por meio de um feedback global, como toast ou alert.

Comportamentos recomendados:

- confirmar exclusões;
- desabilitar botões durante uma operação;
- evitar submissão duplicada;
- preservar filtros ao retornar de uma tela de detalhe;
- atualizar a listagem após mutações;
- mostrar status com cores e texto, nunca apenas com cor;
- oferecer estado vazio com ação primária.

---

## 8. Mock inicial

Os mocks devem conter dados coerentes e relacionados:

- colaboradores com pelo menos um coordenador;
- projetos com colaboradores e pessoas críticas;
- períodos vinculados a colaboradores;
- solicitações nos quatro status;
- ao menos uma solicitação com períodos sobrepostos para demonstrar conflito;
- ao menos uma solicitação de abono válida;
- ao menos uma solicitação inválida para testar mensagens.

O mock deve simular latência curta nas operações assíncronas para que os
estados de carregamento sejam exercitados.

Recomendação para persistência:

- inicializar `localStorage` com uma massa padrão quando não houver dados;
- persistir mutações em `localStorage`;
- disponibilizar uma ação de “restaurar dados de demonstração”;
- manter a persistência encapsulada no adaptador mock.

---

## 9. CORS e integração futura

O backend atualmente não registra CORS. Quando a integração HTTP for ativada,
deve ser adicionada uma política permitindo o frontend local:

```text
http://localhost:5173
```

Esse ajuste ainda não foi aplicado nesta etapa.

O frontend deve usar uma variável de ambiente para a base da API:

```text
VITE_API_URL=http://localhost:5165
```

Não fixar a URL diretamente em componentes.

---

## 10. Critérios de aceite da primeira versão

- A aplicação inicia com Vite e TypeScript.
- O layout é responsivo e possui navegação clara.
- O dashboard apresenta dados derivados dos mocks.
- As quatro áreas de negócio possuem listagem e formulário.
- É possível criar, editar e excluir dados mockados.
- É possível tornar colaborador coordenador.
- É possível criar e editar projetos com colaboradores e pessoas críticas.
- É possível criar períodos e visualizá-los no calendário.
- É possível criar, editar e excluir solicitações.
- É possível validar conflitos.
- É possível aprovar e recusar solicitações pelo fluxo de status.
- A recusa exige observação.
- A validação impede solicitações com quantidade inválida de períodos.
- A validação trata as regras de abono.
- A aplicação apresenta estados de carregamento, vazio, erro e sucesso.
- Os serviços mockados não ficam acoplados aos componentes.
- A troca futura para a API pode ser feita alterando a implementação do
  serviço/configuração, sem reescrever as telas.
- Nenhuma tela usa a rota legada de solicitação por projeto.

---

## 11. Referências do backend

- Documentação atual dos endpoints: `README.MD`.
- API: `Backend/ConflitosAgendaApi`.
- Configuração de conexão da API:
  `Backend/ConflitosAgendaApi/appsettings.json`.
- Controllers:
  `Backend/ConflitosAgendaApi/controllers`.
- DTOs:
  `Backend/ConflitosAgendaApi/dtos`.
- Modelos:
  `Backend/ConflitosAgendaApi/models`.

