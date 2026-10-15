import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import {
  Alert,
  Box,
  Button,
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
import { useMemo, useState, type ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { solicitacaoDoPeriodo } from '@/domain/consultas';
import { intervaloDoPeriodo } from '@/domain/validation/periodo';
import { useColaboradores, useMutacao, usePeriodos, useProjetos, useSolicitacoes } from '@/hooks/useDados';
import { formatarData, formatarDataHora } from '@/lib/datas';
import { descreverPeriodo } from '../periodos/formatacao';
import { PeriodoFormDialog } from '../periodos/PeriodoFormDialog';
import { ColaboradorFormDialog } from './ColaboradorFormDialog';

function Secao({ titulo, acao, children }: { titulo: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6" component="h2">
          {titulo}
        </Typography>
        {acao}
      </Box>
      {children}
    </Paper>
  );
}

export function ColaboradorDetalhePage() {
  const id = Number(useParams().id);
  const servicos = useServicos();
  const colaboradores = useColaboradores();
  const periodos = usePeriodos();
  const solicitacoes = useSolicitacoes();
  const projetos = useProjetos();

  const [editando, setEditando] = useState(false);
  const [novoPeriodo, setNovoPeriodo] = useState(false);
  const [promovendo, setPromovendo] = useState(false);
  const tornarCoordenador = useMutacao(() => servicos.colaboradores.tornarCoordenador(id), {
    sucesso: (c) => `${c.nome} agora é coordenador.`,
  });

  const colaborador = colaboradores.data?.find((c) => c.id === id) ?? null;
  const seus = useMemo(
    () => ({
      periodos: (periodos.data ?? [])
        .filter((p) => p.idColaborador === id)
        .sort((a, b) => a.dataInicio.localeCompare(b.dataInicio)),
      solicitacoes: (solicitacoes.data ?? [])
        .filter((s) => s.colaborador.id === id)
        .sort((a, b) => b.criadaEm.localeCompare(a.criadaEm)),
      analisando: (solicitacoes.data ?? []).filter((s) => s.coordenador.id === id),
      projetos: (projetos.data ?? []).filter((p) => p.colaboradores.some((c) => c.id === id)),
    }),
    [periodos.data, solicitacoes.data, projetos.data, id],
  );

  const consultas = [colaboradores, periodos, solicitacoes, projetos];
  const carregando = consultas.some((c) => c.isPending);

  return (
    <>
      <Button component={RouterLink} to="/colaboradores" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Colaboradores
      </Button>

      <EstadoConsulta
        carregando={carregando}
        erro={consultas.find((c) => c.error)?.error}
        onTentarNovamente={() => consultas.forEach((c) => void c.refetch())}
      >
        {!colaborador ? (
          <Alert severity="warning">Colaborador não encontrado.</Alert>
        ) : (
          <>
            <PageHeader
              titulo={colaborador.nome}
              subtitulo={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <span>{colaborador.email}</span>
                  {colaborador.isCoordenador && (
                    <Chip icon={<VerifiedUserOutlinedIcon />} label="Coordenador" size="small" color="primary" variant="outlined" />
                  )}
                </Stack>
              }
              acoes={
                <>
                  {!colaborador.isCoordenador && (
                    <Button startIcon={<VerifiedUserOutlinedIcon />} onClick={() => setPromovendo(true)}>
                      Tornar coordenador
                    </Button>
                  )}
                  <Button startIcon={<EditOutlinedIcon />} variant="outlined" onClick={() => setEditando(true)}>
                    Editar
                  </Button>
                  <Button component={RouterLink} to={`/solicitacoes/nova?colaborador=${id}`} variant="contained" startIcon={<AddIcon />}>
                    Nova solicitação
                  </Button>
                </>
              }
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 6 }}>
                <Secao
                  titulo="Períodos"
                  acao={
                    <Stack direction="row" spacing={1}>
                      <Button size="small" component={RouterLink} to={`/calendario?colaborador=${id}`} startIcon={<CalendarMonthOutlinedIcon />}>
                        Calendário
                      </Button>
                      <Button size="small" startIcon={<AddIcon />} onClick={() => setNovoPeriodo(true)}>
                        Novo
                      </Button>
                    </Stack>
                  }
                >
                  {seus.periodos.length === 0 ? (
                    <Typography color="text.secondary">Nenhum período cadastrado.</Typography>
                  ) : (
                    <List dense disablePadding>
                      {seus.periodos.map((p) => {
                        const vinculada = solicitacaoDoPeriodo(p.id, solicitacoes.data ?? []);
                        return (
                          <ListItem key={p.id} disableGutters divider secondaryAction={vinculada && <StatusChip status={vinculada.status} />}>
                            <ListItemText
                              primary={descreverPeriodo(p)}
                              secondary={
                                vinculada ? (
                                  <Link component={RouterLink} to={`/solicitacoes/${vinculada.id}`}>
                                    Solicitação #{vinculada.id}
                                  </Link>
                                ) : (
                                  `Retorno em ${formatarData(intervaloDoPeriodo(p).retorno)} · sem solicitação`
                                )
                              }
                            />
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </Secao>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Secao
                  titulo="Solicitações"
                  acao={
                    <Button size="small" component={RouterLink} to={`/solicitacoes?colaborador=${id}`}>
                      Ver todas
                    </Button>
                  }
                >
                  {seus.solicitacoes.length === 0 ? (
                    <Typography color="text.secondary">Nenhuma solicitação.</Typography>
                  ) : (
                    <List dense disablePadding>
                      {seus.solicitacoes.map((s) => (
                        <ListItem key={s.id} disableGutters divider secondaryAction={<StatusChip status={s.status} />}>
                          <ListItemText
                            primary={
                              <Link component={RouterLink} to={`/solicitacoes/${s.id}`} underline="hover">
                                Solicitação #{s.id} · {s.totalDias} dias{s.abono ? ' · abono' : ''}
                              </Link>
                            }
                            secondary={`Criada em ${formatarDataHora(s.criadaEm)} · coordenador ${s.coordenador.nome}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Secao>
              </Grid>

              <Grid size={{ xs: 12, lg: 6 }}>
                <Secao titulo="Projetos">
                  {seus.projetos.length === 0 ? (
                    <Typography color="text.secondary">Não participa de nenhum projeto.</Typography>
                  ) : (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {seus.projetos.map((p) => {
                        const critico = p.pessoasCriticas.some((c) => c.id === id);
                        return (
                          <Chip
                            key={p.id}
                            label={critico ? `${p.nome} · pessoa crítica` : p.nome}
                            color={critico ? 'warning' : 'default'}
                            variant="outlined"
                          />
                        );
                      })}
                    </Stack>
                  )}
                </Secao>
              </Grid>

              {colaborador.isCoordenador && (
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Secao titulo="Solicitações sob sua análise">
                    {seus.analisando.length === 0 ? (
                      <Typography color="text.secondary">Nenhuma solicitação atribuída.</Typography>
                    ) : (
                      <List dense disablePadding>
                        {seus.analisando.map((s) => (
                          <ListItem key={s.id} disableGutters divider secondaryAction={<StatusChip status={s.status} />}>
                            <ListItemText
                              primary={
                                <Link component={RouterLink} to={`/solicitacoes/${s.id}`} underline="hover">
                                  #{s.id} · {s.colaborador.nome}
                                </Link>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Secao>
                </Grid>
              )}
            </Grid>

            <ColaboradorFormDialog aberto={editando} colaborador={colaborador} onFechar={() => setEditando(false)} />
            <PeriodoFormDialog aberto={novoPeriodo} colaboradorIdInicial={id} onFechar={() => setNovoPeriodo(false)} />
            <ConfirmDialog
              aberto={promovendo}
              titulo="Tornar coordenador?"
              mensagem={`${colaborador.nome} poderá analisar solicitações de outros colaboradores.`}
              rotuloConfirmar="Tornar coordenador"
              processando={tornarCoordenador.isPending}
              onFechar={() => setPromovendo(false)}
              onConfirmar={() => tornarCoordenador.mutate(undefined, { onSettled: () => setPromovendo(false) })}
            />
          </>
        )}
      </EstadoConsulta>
    </>
  );
}
