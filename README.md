# Conflitos de Agenda

Sistema para organizar os períodos de ausência dos colaboradores e analisar as solicitações, com detecção de conflito quando pessoas críticas de um mesmo projeto se ausentam ao mesmo tempo. O acesso é feito com usuário e senha, em três níveis: Administrador, Coordenador e Colaborador.

| Pasta | Conteúdo |
|---|---|
| [`Backend/`](Backend/) | API REST em ASP.NET Core (.NET 10) com EF Core e SQLite. Endpoints em [`Backend/README.MD`](Backend/README.MD). |
| [`Frontend/`](Frontend/) | Painel administrativo em React + TypeScript + Vite + MUI. Detalhes em [`Frontend/README.md`](Frontend/README.md). |
| [`docs/manual/`](docs/manual/MANUAL_DE_USO.md) | Manual de uso, com capturas de tela. |
| [`docs/adr/`](docs/adr/) | Decisões de arquitetura. |
| [`CONTEXT.md`](CONTEXT.md) | Glossário do domínio. |

## Como rodar

Pré-requisitos: [.NET SDK 10](https://dotnet.microsoft.com/download) e [Node.js 24](https://nodejs.org/).

```bash
# API: http://localhost:5165 (cria o banco SQLite na primeira execução)
cd Backend/ConflitosAgendaApi
dotnet run --launch-profile http

# Frontend conectado à API: http://localhost:5173
cd Frontend
npm install
npm run dev:api
```

No primeiro acesso, entre com `admin` / `admin` (configuração de desenvolvimento) e defina uma nova senha. A partir daí, o administrador cadastra os colaboradores e cria o acesso de cada um. Em produção, o primeiro administrador vem das variáveis `Admin__Usuario`, `Admin__SenhaInicial` e `Admin__NomeCompleto` (ver `Backend/README.MD`).

Para usar só o frontend, com dados de demonstração salvos no navegador, rode `npm run dev` no lugar de `npm run dev:api`. A tela de login mostra os usuários fictícios (`admin`, `coordenador` e `colaborador`, senha `demo123`).

## Testes

```bash
cd Backend && dotnet test ConflitosAgendaApi.Tests
cd Frontend && npm test
```
