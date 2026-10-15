import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import { useState } from 'react';

interface RecusaDialogProps {
  aberto: boolean;
  processando: boolean;
  onConfirmar: (observacao: string) => void;
  onFechar: () => void;
}

/** Recusar exige uma observação justificando a decisão. */
export function RecusaDialog({ aberto, processando, onConfirmar, onFechar }: RecusaDialogProps) {
  return (
    <Dialog open={aberto} onClose={processando ? undefined : onFechar} maxWidth="sm" fullWidth>
      {/* O Dialog desmonta o conteúdo ao fechar, então o formulário sempre reabre vazio. */}
      <FormularioRecusa processando={processando} onConfirmar={onConfirmar} onFechar={onFechar} />
    </Dialog>
  );
}

function FormularioRecusa({ processando, onConfirmar, onFechar }: Omit<RecusaDialogProps, 'aberto'>) {
  const [observacao, setObservacao] = useState('');
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const vazia = observacao.trim() === '';

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTentouEnviar(true);
        if (!vazia) onConfirmar(observacao.trim());
      }}
    >
      <DialogTitle>Recusar solicitação</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Informe o motivo da recusa. A observação ficará registrada na solicitação.
        </DialogContentText>
        <TextField
          label="Observação"
          autoFocus
          required
          multiline
          minRows={3}
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
          error={tentouEnviar && vazia}
          helperText={tentouEnviar && vazia ? 'A observação é obrigatória para recusar.' : undefined}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar} disabled={processando}>
          Cancelar
        </Button>
        <Button type="submit" color="error" variant="contained" loading={processando}>
          Recusar
        </Button>
      </DialogActions>
    </form>
  );
}
