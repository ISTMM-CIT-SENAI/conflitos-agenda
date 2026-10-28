import { Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useSessao } from '@/app/providers/useSessao';
import { ehCoordenador } from '@/domain/acesso';

/** Nome do Colaborador; vira link para a página dele só para o Coordenador. */
export function LinkColaborador({ id, nome, underline = 'hover' }: { id: number; nome: string; underline?: 'hover' | 'always' }) {
  const { usuario } = useSessao();
  if (!usuario || !ehCoordenador(usuario)) return <>{nome}</>;
  return (
    <Link component={RouterLink} to={`/colaboradores/${id}`} underline={underline}>
      {nome}
    </Link>
  );
}
