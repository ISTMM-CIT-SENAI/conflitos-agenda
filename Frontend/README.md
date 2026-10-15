# Conflitos de Agenda — Frontend

Painel administrativo (React + TypeScript + Vite + MUI) para colaboradores, projetos, períodos e solicitações de ausência. A linguagem do domínio está em [`../CONTEXT.md`](../CONTEXT.md), e as decisões de arquitetura estão em [`../docs/adr/`](../docs/adr/).

## Executar

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # testes das regras de domínio e dos serviços (Vitest)
npm run build      # checagem de tipos + build de produção
npm run lint
```

## Fonte de dados

Configurada em `.env` (modelo em `.env.example`):

| Variável | Valores | Uso |
|---|---|---|
| `VITE_DATA_SOURCE` | `mock` (padrão) ou `api` | `mock` persiste em `localStorage`; `api` usa a API ASP.NET Core |
| `VITE_API_URL` | ex.: `http://localhost:5165` | Base da API quando `VITE_DATA_SOURCE=api` |

No modo mock, o menu lateral exibe o botão **Restaurar dados**, que recarrega a massa de demonstração (as datas são relativas ao dia atual).

## Arquitetura

```text
telas (features/*)  →  useServicos()  →  criarServicos(gateway)  →  ApiGateway
                                          regras de negócio          ├─ http/gatewayHttp.ts  (fetch, 1:1 com o README da API)
                                          IDs → objetos completos    └─ mocks/gatewayMock.ts (localStorage, mesmas respostas 400/404)
                                          DataISO → DateTime
```

- `src/domain`: entidades, enum de status, regras puras (duração do período, abono, detecção de conflito). Não depende de React.
- `src/services/criarServicos.ts`: aplica as regras (bloqueio de exclusões com vínculos, transições de status, Total de Dias e Pessoa Crítica derivados) sobre qualquer `ApiGateway`. Trocar o mock pela API não exige mudar nenhuma tela.
- `src/lib/datas.ts`: na interface, as datas circulam como `"AAAA-MM-DD"`, sem horário nem fuso. A conversão para `DateTime` acontece só na borda do serviço.
- Os filtros das listagens ficam na URL e são preservados ao voltar de uma tela de detalhe.

## Rodando com a API real

1. Suba a API (veja `../Backend/README.MD`): `dotnet run --launch-profile http` em `Backend/ConflitosAgendaApi`.
2. Rode `npm run dev:api`. O modo `api` (arquivo `.env.api`) faz o frontend chamar `/api` no próprio Vite, que repassa para `http://localhost:5165`. Assim, em desenvolvimento, não é preciso CORS.

Em produção, sirva o build do frontend no mesmo domínio da API (ou configure CORS no backend) e defina `VITE_API_URL` se a API estiver em outro endereço.

Diferenças de regra conhecidas entre a API e o modo demonstração estão na seção "Divergências atuais" do README do backend.
