import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PaginaNaoEncontrada } from '@/components/layout/PaginaNaoEncontrada';
import { RotaComSessao, RotaProtegida, SomenteAdministrador } from '@/components/layout/RotaProtegida';

// Cada página é carregada sob demanda; o calendário, em especial, é pesado.
export const router = createBrowserRouter([
  { path: '/login', lazy: async () => ({ Component: (await import('@/features/acesso/LoginPage')).LoginPage }) },
  {
    element: <RotaComSessao />,
    children: [
      { path: '/trocar-senha', lazy: async () => ({ Component: (await import('@/features/acesso/TrocarSenhaPage')).TrocarSenhaPage }) },
    ],
  },
  {
    element: <RotaProtegida />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { index: true, lazy: async () => ({ Component: (await import('@/features/dashboard/DashboardPage')).DashboardPage }) },
          { path: 'periodos', lazy: async () => ({ Component: (await import('@/features/periodos/PeriodosPage')).PeriodosPage }) },
          { path: 'solicitacoes', lazy: async () => ({ Component: (await import('@/features/solicitacoes/SolicitacoesPage')).SolicitacoesPage }) },
          { path: 'solicitacoes/nova', lazy: async () => ({ Component: (await import('@/features/solicitacoes/SolicitacaoFormPage')).SolicitacaoFormPage }) },
          { path: 'solicitacoes/:id', lazy: async () => ({ Component: (await import('@/features/solicitacoes/SolicitacaoDetalhePage')).SolicitacaoDetalhePage }) },
          { path: 'solicitacoes/:id/editar', lazy: async () => ({ Component: (await import('@/features/solicitacoes/SolicitacaoFormPage')).SolicitacaoFormPage }) },
          { path: 'calendario', lazy: async () => ({ Component: (await import('@/features/calendario/CalendarioPage')).CalendarioPage }) },
          {
            // Exclusivo do Administrador.
            element: <SomenteAdministrador />,
            children: [
              { path: 'colaboradores', lazy: async () => ({ Component: (await import('@/features/colaboradores/ColaboradoresPage')).ColaboradoresPage }) },
              { path: 'colaboradores/:id', lazy: async () => ({ Component: (await import('@/features/colaboradores/ColaboradorDetalhePage')).ColaboradorDetalhePage }) },
              { path: 'projetos', lazy: async () => ({ Component: (await import('@/features/projetos/ProjetosPage')).ProjetosPage }) },
              { path: 'usuarios', lazy: async () => ({ Component: (await import('@/features/usuarios/UsuariosPage')).UsuariosPage }) },
            ],
          },
          { path: '*', element: <PaginaNaoEncontrada /> },
        ],
      },
    ],
  },
]);
