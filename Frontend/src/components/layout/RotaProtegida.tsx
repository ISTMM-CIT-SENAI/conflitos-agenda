import { Alert, Box, Button, CircularProgress } from '@mui/material';
import type { ReactNode } from 'react';
import { Navigate, Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useSessao } from '@/app/providers/useSessao';
import { ehCoordenador } from '@/domain/acesso';

function Carregando() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }} role="status" aria-label="Carregando sessão">
      <CircularProgress />
    </Box>
  );
}

/**
 * Exige login. Enquanto a senha for temporária, só a tela de troca de senha é liberada.
 */
export function RotaProtegida() {
  const { usuario, carregando } = useSessao();
  const location = useLocation();

  if (carregando) return <Carregando />;
  if (!usuario) return <Navigate to="/login" replace state={{ voltarPara: location.pathname + location.search }} />;
  if (usuario.precisaTrocarSenha) return <Navigate to="/trocar-senha" replace />;
  return <Outlet />;
}

/** Exige sessão, mas sem barrar quem precisa trocar a senha (usada pela própria tela de troca). */
export function RotaComSessao() {
  const { usuario, carregando } = useSessao();
  if (carregando) return <Carregando />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Outlet />;
}

/** Conteúdo exclusivo do Coordenador. */
export function SomenteCoordenador({ children }: { children?: ReactNode }) {
  const { usuario } = useSessao();
  if (!usuario || !ehCoordenador(usuario)) {
    return (
      <Alert
        severity="warning"
        action={
          <Button component={RouterLink} to="/" color="inherit" size="small">
            Ir para o início
          </Button>
        }
      >
        Esta área é exclusiva do coordenador.
      </Alert>
    );
  }
  return <>{children ?? <Outlet />}</>;
}
