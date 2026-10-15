import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { mensagemDeErro } from '@/services/erros';

interface EstadoConsultaProps {
  carregando: boolean;
  erro: unknown;
  vazio?: boolean;
  onTentarNovamente?: () => void;
  mensagemVazia?: string;
  /** Ação primária oferecida no estado vazio. */
  acaoVazia?: ReactNode;
  children: ReactNode;
}

/** Estados centralizados de carregamento, erro e lista vazia. */
export function EstadoConsulta({
  carregando,
  erro,
  vazio = false,
  onTentarNovamente,
  mensagemVazia = 'Nenhum registro encontrado.',
  acaoVazia,
  children,
}: EstadoConsultaProps) {
  if (carregando) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, py: 8 }} role="status">
        <CircularProgress size={28} />
        <Typography color="text.secondary">Carregando…</Typography>
      </Box>
    );
  }

  if (erro) {
    return (
      <Alert
        severity="error"
        action={
          onTentarNovamente && (
            <Button color="inherit" size="small" onClick={onTentarNovamente}>
              Tentar novamente
            </Button>
          )
        }
      >
        {mensagemDeErro(erro)}
      </Alert>
    );
  }

  if (vazio) {
    return (
      <Paper sx={{ py: 6, px: 2, textAlign: 'center' }}>
        <InboxOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        <Typography color="text.secondary" sx={{ mt: 1, mb: acaoVazia ? 2 : 0 }}>
          {mensagemVazia}
        </Typography>
        {acaoVazia}
      </Paper>
    );
  }

  return <>{children}</>;
}
