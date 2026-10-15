import { CssBaseline, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';
import { useState, type ReactNode } from 'react';
import { FeedbackProvider } from '@/components/feedback/FeedbackProvider';
import { criarServicosConfigurados } from '@/services';
import { tema } from '@/styles/tema';
import { ServicosProvider } from './ServicosProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [servicos] = useState(criarServicosConfigurados);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ptBR}>
        <QueryClientProvider client={queryClient}>
          <ServicosProvider servicos={servicos}>
            <FeedbackProvider>{children}</FeedbackProvider>
          </ServicosProvider>
        </QueryClientProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
