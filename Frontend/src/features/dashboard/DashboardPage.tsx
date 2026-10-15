import AddIcon from '@mui/icons-material/Add';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactElement, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { solicitacaoDoPeriodo } from '@/domain/consultas';
import { StatusSolicitacao, isStatusFinal } from '@/domain/enums/statusSolicitacao';
import { intervaloDoPeriodo } from '@/domain/validation/periodo';
import { useColaboradores, usePeriodos, useProjetos, useSolicitacoes } from '@/hooks/useDados';
import { formatarDataHora, hojeISO } from '@/lib/datas';
import { descreverPeriodo } from '../periodos/formatacao';

interface Indicador {
  rotulo: string;
  valor: number;
  icone: ReactElement;
  cor: string;
  destino: string;
}

function CartaoIndicador({ rotulo, valor, icone, cor, destino }: Indicador) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardActionArea component={RouterLink} to={destino} sx={{ p: 2, height: '100%' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: cor,
              bgcolor: `${cor}1a`,
              flexShrink: 0,
            }}
          >
            {icone}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="p" sx={{ lineHeight: 1.1 }}>
              {valor}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {rotulo}
            </Typography>
          </Box>
        </Stack>
      </CardActionArea>
    </Card>
  );
}

function Painel({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" component="h2">
          {titulo}
        </Typography>
        {acao}
      </Stack>
      {children}
    </Paper>
  );
}

export function DashboardPage() {
  const colaboradores = useColaboradores();
  const projetos = useProjetos();
  const periodos = usePeriodos();
  const solicitacoes = useSolicitacoes();
  const consultas = [colaboradores, projetos, periodos, solicitacoes];

  const lista = solicitacoes.data ?? [];
  const contar = (status: StatusSolicitacao) => lista.filter((s) => s.status === status).length;

  const indicadores: Indicador[] = [
    { rotulo: 'Colaboradores', valor: colaboradores.data?.length ?? 0, icone: <PeopleAltOutlinedIcon />, cor: '#1d4f91', destino: '/colaboradores' },
    { rotulo: 'Projetos', valor: projetos.data?.length ?? 0, icone: <FolderOutlinedIcon />, cor: '#5e35b1', destino: '/projetos' },
    { rotulo: 'Em análise', valor: contar(StatusSolicitacao.EmAnalise), icone: <HourglassEmptyIcon />, cor: '#0277bd', destino: `/solicitacoes?status=${StatusSolicitacao.EmAnalise}` },
    { rotulo: 'Com conflito', valor: contar(StatusSolicitacao.ConflitoEncontrado), icone: <WarningAmberIcon />, cor: '#e65100', destino: `/solicitacoes?status=${StatusSolicitacao.ConflitoEncontrado}` },
    { rotulo: 'Aprovadas', valor: contar(StatusSolicitacao.Aprovada), icone: <CheckCircleOutlineIcon />, cor: '#2e7d32', destino: `/solicitacoes?status=${StatusSolicitacao.Aprovada}` },
    { rotulo: 'Recusadas', valor: contar(StatusSolicitacao.Recusada), icone: <CancelOutlinedIcon />, cor: '#c62828', destino: `/solicitacoes?status=${StatusSolicitacao.Recusada}` },
  ];

  const hoje = hojeISO();
  const nomeDe = (id: number) => colaboradores.data?.find((c) => c.id === id)?.nome ?? `Colaborador #${id}`;

  // Ausências em andamento ou futuras, ignorando as recusadas.
  const proximasAusencias = (periodos.data ?? [])
    .map((p) => ({ periodo: p, intervalo: intervaloDoPeriodo(p), solicitacao: solicitacaoDoPeriodo(p.id, lista) }))
    .filter(({ intervalo, solicitacao }) => intervalo.retorno > hoje && solicitacao?.status !== StatusSolicitacao.Recusada)
    .sort((a, b) => a.intervalo.inicio.localeCompare(b.intervalo.inicio))
    .slice(0, 6);

  const aguardando = lista
    .filter((s) => !isStatusFinal(s.status))
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm))
    .slice(0, 6);

  return (
    <>
      <PageHeader
        titulo="Dashboard"
        subtitulo="Visão geral das ausências e solicitações."
        acoes={
          <Button component={RouterLink} to="/solicitacoes/nova" variant="contained" startIcon={<AddIcon />}>
            Nova solicitação
          </Button>
        }
      />

      <EstadoConsulta
        carregando={consultas.some((c) => c.isPending)}
        erro={consultas.find((c) => c.error)?.error}
        onTentarNovamente={() => consultas.forEach((c) => void c.refetch())}
      >
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {indicadores.map((indicador) => (
            <Grid key={indicador.rotulo} size={{ xs: 6, sm: 4, xl: 2 }}>
              <CartaoIndicador {...indicador} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 7 }}>
            <Painel
              titulo="Próximas ausências"
              acao={
                <Button size="small" component={RouterLink} to="/calendario">
                  Ver calendário
                </Button>
              }
            >
              {proximasAusencias.length === 0 ? (
                <Typography color="text.secondary">Nenhuma ausência futura cadastrada.</Typography>
              ) : (
                <List dense disablePadding>
                  {proximasAusencias.map(({ periodo, intervalo, solicitacao }) => (
                    <ListItem
                      key={periodo.id}
                      disableGutters
                      divider
                      secondaryAction={
                        solicitacao ? <StatusChip status={solicitacao.status} /> : <Chip label="Sem solicitação" size="small" variant="outlined" />
                      }
                    >
                      <ListItemText
                        sx={{ pr: 18 }}
                        primary={
                          <Link component={RouterLink} to={`/colaboradores/${periodo.idColaborador}`} underline="hover">
                            {nomeDe(periodo.idColaborador)}
                          </Link>
                        }
                        secondary={`${intervalo.inicio <= hoje ? 'Em andamento · ' : ''}${descreverPeriodo(periodo)}`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Painel>
          </Grid>

          <Grid size={{ xs: 12, lg: 5 }}>
            <Painel
              titulo="Aguardando decisão"
              acao={
                <Button size="small" component={RouterLink} to="/solicitacoes">
                  Ver todas
                </Button>
              }
            >
              {aguardando.length === 0 ? (
                <Typography color="text.secondary">Nenhuma solicitação pendente.</Typography>
              ) : (
                <List dense disablePadding>
                  {aguardando.map((s) => (
                    <ListItem key={s.id} disableGutters divider secondaryAction={<StatusChip status={s.status} />}>
                      <ListItemText
                        sx={{ pr: 18 }}
                        primary={
                          <Link component={RouterLink} to={`/solicitacoes/${s.id}`} underline="hover">
                            #{s.id} · {s.colaborador.nome}
                          </Link>
                        }
                        secondary={`Criada em ${formatarDataHora(s.criadaEm)} · ${s.totalDias} dias`}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Painel>
          </Grid>
        </Grid>
      </EstadoConsulta>
    </>
  );
}
