# Conflitos de Agenda

Sistema para organizar os períodos de ausência dos colaboradores e analisar as solicitações, com detecção de conflito quando pessoas críticas de um mesmo projeto se ausentam ao mesmo tempo.

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

Para usar só o frontend, com dados de demonstração salvos no navegador, rode `npm run dev` no lugar de `npm run dev:api`.

## Testes

```bash
cd Backend && dotnet test ConflitosAgendaApi.Tests
cd Frontend && npm test
```
