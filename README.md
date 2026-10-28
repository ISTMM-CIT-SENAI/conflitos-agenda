# Conflitos de Agenda

Sistema para organizar os períodos de ausência dos colaboradores e analisar as solicitações, com detecção de conflito quando pessoas críticas de um mesmo projeto se ausentam ao mesmo tempo. O acesso é feito com usuário e senha, em três níveis: Coordenador, Supervisor e Colaborador. As solicitações seguem as regras de férias da CLT e vão automaticamente para o supervisor de cada pessoa.

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

Na primeira execução, com o banco vazio, a API cadastra as pessoas, a hierarquia e os projetos do ISTMM, com um usuário para cada pessoa, e grava as senhas temporárias em `Backend/ConflitosAgendaApi/credenciais-iniciais.csv` (fora do git). Entregue cada senha individualmente e apague o arquivo; no primeiro login, cada pessoa define a própria senha. Detalhes em `Backend/README.MD`.

Para usar só o frontend, com dados de demonstração salvos no navegador, rode `npm run dev` no lugar de `npm run dev:api`. A tela de login mostra os usuários fictícios (`coordenador`, `supervisor` e `colaborador`, senha `demo123`). A versão de demonstração também está publicada em https://conflitos-agenda.vercel.app.

## Testes

```bash
cd Backend && dotnet test ConflitosAgendaApi.Tests
cd Frontend && npm test
```
