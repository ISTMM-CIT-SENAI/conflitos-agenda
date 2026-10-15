# SPA com React + Vite em vez de Next.js

O frontend é uma SPA (React + TypeScript + Vite) que consome diretamente a API ASP.NET Core. Next.js foi considerado e rejeitado: o backend já existe em .NET, o painel é interno (sem SEO e, por enquanto, sem autenticação), os mocks vivem em `localStorage` (só existe no navegador) e as datas sem horário ficariam sujeitas a divergência de fuso entre servidor e navegador com SSR.

## Consequências

- O navegador acessa a API diretamente, então o backend precisará de CORS para a origem do frontend. Em desenvolvimento, o `server.proxy` do Vite pode evitar isso.
- Reavaliar esta decisão se surgir autenticação com sessão no servidor, necessidade de esconder a API atrás de um BFF ou páginas públicas indexáveis.
