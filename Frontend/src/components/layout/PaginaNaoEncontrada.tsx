import { Alert, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function PaginaNaoEncontrada() {
  return (
    <Alert
      severity="warning"
      action={
        <Button component={RouterLink} to="/" color="inherit" size="small">
          Ir para o início
        </Button>
      }
    >
      Página não encontrada.
    </Alert>
  );
}
