import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RuleIcon from '@mui/icons-material/Rule';
import {
  Alert,
  AlertTitle,
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
import { useState, type ReactNode } from 'react';
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { useFeedback } from '@/components/feedback/useFeedback';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { StatusSolicitacao, isStatusFinal } from '@/domain/enums/statusSolicitacao';
import { useUsuarioLogado } from '@/app/providers/useSessao';
import { LinkColaborador } from '@/components/common/LinkColaborador';
import {
  ehCoordenador,
  podeDecidir,
  podeEditarSolicitacao,
  podeExcluirSolicitacao,
  podeValidarConflito,
} from '@/domain/acesso';
import { detectarConflitos } from '@/domain/validation/conflito';
import { violacoesDaSolicitacao } from '@/domain/validation/solicitacao';
import { useMutacao, useProjetos, useSolicitacao, useSolicitacoes } from '@/hooks/useDados';
import { formatarDataHora } from '@/lib/datas';
import { descreverPeriodo } from '../periodos/formatacao';
import { RecusaDialog } from './RecusaDialog';

function Campo({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" component="div">
        {rotulo}
      </Typography>
      <Typography component="div">{children}</Typography>
    </Box>
  );
}

type Acao = 'aprovar' | 'recusar' | 'excluir' | null;

export function SolicitacaoDetalhePage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const location = useLocation();
  const voltarPara = (location.state as { voltarPara?: string } | null)?.voltarPara ?? '';
  const servicos = useServicos();
  const feedback = useFeedback();
  const usuario = useUsuarioLogado();
  const admin = ehCoordenador(usuario);

  const consulta = useSolicitacao(id);
  const todas = useSolicitacoes();
  const projetos = useProjetos();
  const [acao, setAcao] = useState<Acao>(null);

  const validar = useMutacao(() => servicos.solicitacoes.validarConflitos(id));
  const aprovar = useMutacao(() => servicos.solicitacoes.aprovar(id), { sucesso: 'Solicitação aprovada.' });
  const recusar = useMutacao((observacao: string) => servicos.solicitacoes.recusar(id, observacao), {
    sucesso: 'Solicitação recusada.',
  });
  const excluir = useMutacao(() => servicos.solicitacoes.excluir(id), { sucesso: 'Solicitação excluída.' });

  const solicitacao = consulta.data ?? null;
  const conflitos =
    solicitacao && todas.data && projetos.data ? detectarConflitos(solicitacao, todas.data, projetos.data) : [];
  const violacoes = solicitacao ? violacoesDaSolicitacao(solicitacao) : [];
  const processando = validar.isPending || aprovar.isPending || recusar.isPending || excluir.isPending;

  const executarValidacao = () =>
    validar.mutate(undefined, {
      onSuccess: (resultado) =>
        resultado.conflito
          ? feedback.aviso(`Conflito encontrado. ${resultado.mensagem}`)
          : feedback.sucesso('Nenhum conflito encontrado.'),
    });

  return (
    <>
      <Button component={RouterLink} to={`/solicitacoes${voltarPara}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Solicitações
      </Button>

      <EstadoConsulta
        carregando={consulta.isPending}
        erro={consulta.error}
        onTentarNovamente={() => void consulta.refetch()}
      >
        {!solicitacao ? (
          <Alert severity="warning">Solicitação não encontrada.</Alert>
        ) : (
          <>
            <PageHeader
              titulo={`Solicitação #${solicitacao.id}`}
              subtitulo={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                  <StatusChip status={solicitacao.status} size="medium" />
                  <span>Criada em {formatarDataHora(solicitacao.criadaEm)}</span>
                  {solicitacao.decididaPor && solicitacao.decididaEm && (
                    <span>
                      · {solicitacao.status === StatusSolicitacao.Aprovada ? 'Aprovada' : 'Recusada'} por{' '}
                      <strong>{solicitacao.decididaPor.nomeColaborador}</strong>
                      {solicitacao.decididaPor.isCoordenador ? ' (coordenador)' : ''} em{' '}
                      {formatarDataHora(solicitacao.decididaEm)}
                    </span>
                  )}
                </Stack>
              }
              acoes={
                <>
                  {podeValidarConflito(usuario, solicitacao) && (
                    <Button variant="outlined" startIcon={<RuleIcon />} onClick={executarValidacao} loading={validar.isPending} disabled={processando}>
                      Validar conflitos
                    </Button>
                  )}
                  {podeDecidir(usuario, solicitacao) && (
                    <>
                      <Button variant="contained" color="success" startIcon={<CheckCircleOutlineIcon />} onClick={() => setAcao('aprovar')} disabled={processando}>
                        Aprovar
                      </Button>
                      <Button variant="contained" color="error" startIcon={<CancelOutlinedIcon />} onClick={() => setAcao('recusar')} disabled={processando}>
                        Recusar
                      </Button>
                    </>
                  )}
                </>
              }
            />

            <Stack spacing={2} sx={{ mb: 2 }}>
              {violacoes.length > 0 && (
                <Alert severity="error">
                  <AlertTitle>Esta solicitação viola regras de negócio</AlertTitle>
                  {violacoes.map((v) => v.mensagem).join(' ')} Edite-a para corrigir antes de aprovar ou recusar.
                </Alert>
              )}
              {solicitacao.status === StatusSolicitacao.ConflitoEncontrado && (
                <Alert severity="warning">
                  <AlertTitle>Conflito encontrado</AlertTitle>
                  A ausência coincide com a de outra pessoa crítica. A solicitação ainda pode ser aprovada, recusada ou
                  editada; após a edição ela volta para análise.
                </Alert>
              )}
            </Stack>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Paper sx={{ p: 2.5 }}>
                  <Grid container spacing={2.5}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Campo rotulo="Colaborador">
                        <LinkColaborador id={solicitacao.colaborador.id} nome={solicitacao.colaborador.nome} underline="always" />
                      </Campo>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Campo rotulo="Supervisor">
                        <LinkColaborador id={solicitacao.supervisor.id} nome={solicitacao.supervisor.nome} underline="always" />
                      </Campo>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Campo rotulo="Total de dias">{solicitacao.totalDias}</Campo>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <Campo rotulo="Abono">
                        {solicitacao.abono ? <Chip label="Sim" size="small" color="secondary" variant="outlined" /> : 'Não'}
                      </Campo>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Campo rotulo="Pessoa crítica">
                        {solicitacao.isPessoaCritica ? <Chip label="Sim" size="small" color="warning" variant="outlined" /> : 'Não'}
                      </Campo>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Campo rotulo="Períodos">
                        <List dense disablePadding>
                          {solicitacao.periodos.map((p) => (
                            <ListItem key={p.id} disableGutters>
                              <ListItemText primary={descreverPeriodo(p)} />
                            </ListItem>
                          ))}
                        </List>
                      </Campo>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Campo rotulo="Observação">
                        {solicitacao.observacao ?? (
                          <Typography component="span" color="text.secondary">
                            Sem observação
                          </Typography>
                        )}
                      </Campo>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2}>
                  {admin && (
                  <Paper sx={{ p: 2.5 }}>
                    <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
                      Sobreposições com pessoas críticas
                    </Typography>
                    {conflitos.length === 0 ? (
                      <Typography color="text.secondary">Nenhuma sobreposição identificada no momento.</Typography>
                    ) : (
                      <List dense disablePadding>
                        {conflitos.map((c) => (
                          <ListItem key={`${c.periodo.id}-${c.outroPeriodo.id}-${c.projeto.id}`} disableGutters divider>
                            <ListItemText
                              primary={
                                <>
                                  {c.pessoaCritica.nome} ·{' '}
                                  <Link component={RouterLink} to={`/solicitacoes/${c.outraSolicitacaoId}`}>
                                    solicitação #{c.outraSolicitacaoId}
                                  </Link>
                                </>
                              }
                              secondary={`${c.projeto.nome} · ${descreverPeriodo(c.outroPeriodo)}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                      Use “Validar conflitos” para registrar o resultado no status da solicitação.
                    </Typography>
                  </Paper>
                  )}

                  <Paper sx={{ p: 2.5 }}>
                    <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
                      Gerenciar
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        startIcon={<EditOutlinedIcon />}
                        component={RouterLink}
                        to={`/solicitacoes/${solicitacao.id}/editar`}
                        disabled={!podeEditarSolicitacao(usuario, solicitacao) || processando}
                      >
                        Editar
                      </Button>
                      <Button
                        color="error"
                        startIcon={<DeleteOutlinedIcon />}
                        onClick={() => setAcao('excluir')}
                        disabled={!podeExcluirSolicitacao(usuario, solicitacao) || processando}
                      >
                        Excluir
                      </Button>
                    </Stack>
                    {!podeEditarSolicitacao(usuario, solicitacao) && (
                      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                        {isStatusFinal(solicitacao.status)
                          ? 'Solicitações aprovadas ou recusadas não podem ser editadas.'
                          : 'Somente o próprio colaborador ou o coordenador pode editar esta solicitação.'}
                      </Typography>
                    )}
                  </Paper>
                </Stack>
              </Grid>
            </Grid>

            <ConfirmDialog
              aberto={acao === 'aprovar'}
              titulo="Aprovar solicitação?"
              mensagem={
                solicitacao.status === StatusSolicitacao.ConflitoEncontrado
                  ? 'Atenção: esta solicitação está com conflito encontrado. Aprovar mesmo assim? A decisão não poderá ser desfeita.'
                  : `A ausência de ${solicitacao.colaborador.nome} será aprovada. A decisão não poderá ser desfeita.`
              }
              rotuloConfirmar={solicitacao.status === StatusSolicitacao.ConflitoEncontrado ? 'Aprovar mesmo assim' : 'Aprovar'}
              cor={solicitacao.status === StatusSolicitacao.ConflitoEncontrado ? 'warning' : 'success'}
              processando={aprovar.isPending}
              onFechar={() => setAcao(null)}
              onConfirmar={() => aprovar.mutate(undefined, { onSettled: () => setAcao(null) })}
            />
            <RecusaDialog
              aberto={acao === 'recusar'}
              processando={recusar.isPending}
              onFechar={() => setAcao(null)}
              onConfirmar={(observacao) => recusar.mutate(observacao, { onSuccess: () => setAcao(null) })}
            />
            <ConfirmDialog
              aberto={acao === 'excluir'}
              titulo="Excluir solicitação?"
              mensagem="A solicitação será removida permanentemente. Os períodos continuarão cadastrados."
              rotuloConfirmar="Excluir"
              cor="error"
              processando={excluir.isPending}
              onFechar={() => setAcao(null)}
              onConfirmar={() =>
                excluir.mutate(undefined, {
                  onSuccess: () => navigate(`/solicitacoes${voltarPara}`),
                  onSettled: () => setAcao(null),
                })
              }
            />
          </>
        )}
      </EstadoConsulta>
    </>
  );
}
