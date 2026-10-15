import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import type { ReactNode } from 'react';

interface ConfirmDialogProps {
  aberto: boolean;
  titulo: string;
  mensagem: ReactNode;
  rotuloConfirmar?: string;
  cor?: 'primary' | 'error' | 'success' | 'warning';
  /** Enquanto `true`, os botões ficam desabilitados para evitar submissão duplicada. */
  processando?: boolean;
  onConfirmar: () => void;
  onFechar: () => void;
}

export function ConfirmDialog({
  aberto,
  titulo,
  mensagem,
  rotuloConfirmar = 'Confirmar',
  cor = 'primary',
  processando = false,
  onConfirmar,
  onFechar,
}: ConfirmDialogProps) {
  return (
    <Dialog open={aberto} onClose={processando ? undefined : onFechar} maxWidth="xs" fullWidth>
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText component="div">{mensagem}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={processando}>
          Cancelar
        </Button>
        <Button onClick={onConfirmar} color={cor} variant="contained" loading={processando}>
          {rotuloConfirmar}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
