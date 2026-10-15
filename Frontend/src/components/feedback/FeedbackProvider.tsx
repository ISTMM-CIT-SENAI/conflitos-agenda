import { Alert, Snackbar } from '@mui/material';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { FeedbackContext, type Feedback } from './useFeedback';

type Severidade = 'success' | 'error' | 'info' | 'warning';

interface Mensagem {
  id: number;
  texto: string;
  severidade: Severidade;
}

/** Feedback global (toast) para o resultado das operações. */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [fila, setFila] = useState<Mensagem[]>([]);
  const atual = fila[0];

  const notificar = useCallback((texto: string, severidade: Severidade) => {
    setFila((anterior) => [...anterior, { id: Date.now() + Math.random(), texto, severidade }]);
  }, []);

  const feedback = useMemo<Feedback>(
    () => ({
      sucesso: (t) => notificar(t, 'success'),
      erro: (t) => notificar(t, 'error'),
      aviso: (t) => notificar(t, 'warning'),
      info: (t) => notificar(t, 'info'),
    }),
    [notificar],
  );

  const fechar = () => setFila((anterior) => anterior.slice(1));

  return (
    <FeedbackContext.Provider value={feedback}>
      {children}
      <Snackbar
        key={atual?.id}
        open={atual !== undefined}
        autoHideDuration={atual?.severidade === 'error' ? 8000 : 4000}
        onClose={(_, motivo) => motivo !== 'clickaway' && fechar()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={fechar} severity={atual?.severidade ?? 'info'} variant="filled" sx={{ width: '100%' }}>
          {atual?.texto}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
}

