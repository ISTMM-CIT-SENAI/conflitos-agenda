import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';
import { useState, type ReactNode } from 'react';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { criarServicosConfigurados } from '@/services';
import { ErroAcessoNegado, ErroNaoAutenticado, ErroTrocaSenhaObrigatoria } from '@/services/erros';
import { tema } from '@/styles/tema';
import { ServicosProvider } from './ServicosProvider';
import { SessaoProvider } from './SessaoProvider';
import { CHAVE_SESSAO } from './useSessao';

function criarQueryClient(): QueryClient {
  /**
   * Erros de sessão em qualquer consulta ou mutação atualizam a sessão: 401 leva de
   * volta ao login e 403 de troca obrigatória leva à tela de nova senha.
   */
  const tratarErroDeSessao = (erro: unknown) => {
    if (erro instanceof ErroNaoAutenticado) cliente.setQueryData(CHAVE_SESSAO, null);
    if (erro instanceof ErroTrocaSenhaObrigatoria) void cliente.invalidateQueries({ queryKey: CHAVE_SESSAO });
  };
  const cliente: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: tratarErroDeSessao }),
    mutationCache: new MutationCache({ onError: tratarErroDeSessao }),
    defaultOptions: {
      queries: {
        // Não insiste em erros de acesso: repetir não muda a resposta.
        retry: (tentativas, erro) =>
          tentativas < 1 &&
          !(erro instanceof ErroNaoAutenticado || erro instanceof ErroAcessoNegado || erro instanceof ErroTrocaSenhaObrigatoria),
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
      mutations: { retry: false },
    },
  });
  return cliente;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [servicos] = useState(criarServicosConfigurados);
  const [queryClient] = useState(criarQueryClient);

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <QueryClientProvider client={queryClient}>
          <ServicosProvider servicos={servicos}>
            <FeedbackProvider>
              <SessaoProvider>{children}</SessaoProvider>
            </FeedbackProvider>
          </ServicosProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
