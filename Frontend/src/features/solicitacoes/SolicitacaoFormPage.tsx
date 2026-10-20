import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormHelperText,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { useServicos } from '@/app/providers/useServicos';
import { PageHeader } from '@/components/common/PageHeader';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { aplicarErrosDoServico } from '@/components/forms/errosDoServico';
import { SeletorColaborador } from '@/components/forms/SeletorColaborador';
import { periodosDisponiveis } from '@/domain/consultas';
import type { Periodo, Solicitacao } from '@/domain/entities';
import { isStatusFinal } from '@/domain/enums/statusSolicitacao';
import { useUsuarioLogado } from '@/app/providers/useSessao';
import { ehAdministrador, podeEditarSolicitacao } from '@/domain/acesso';
import {
  MAX_DIAS_ABONO,
  MAX_PERIODOS,
  MAX_PERIODOS_ABONO,
  calcularTotalDias,
  isPessoaCriticaEmAlgumProjeto,
  validarRegrasSolicitacao,
} from '@/domain/validation/solicitacao';
import { useColaboradores, useMutacao, usePeriodos, useProjetos, useSolicitacoes } from '@/hooks/useDados';
import { descreverPeriodo } from '../periodos/formatacao';
import { PeriodoFormDialog } from '../periodos/PeriodoFormDialog';
import { StatusChip } from '@/components/common/StatusChip';

interface Formulario {
  colaboradorId: number | null;
  coordenadorId: number | null;
  periodoIds: number[];
  abono: boolean;
  observacao: string;
}

const CAMPOS: (keyof Formulario)[] = ['colaboradorId', 'coordenadorId', 'periodoIds', 'abono', 'observacao'];

/** Esquema depende dos períodos carregados, pois o Total de Dias é derivado deles. */
function criarEsquema(periodos: readonly Periodo[]) {
  return z
    .object({
      colaboradorId: z.number().nullable(),
      coordenadorId: z.number().nullable(),
      periodoIds: z.array(z.number()),
      abono: z.boolean(),
      observacao: z.string().max(500, 'A observação deve ter no máximo 500 caracteres.'),
    })
    .superRefine((dados, ctx) => {
      if (dados.colaboradorId === null) {
        ctx.addIssue({ code: 'custom', path: ['colaboradorId'], message: 'Selecione o colaborador.' });
      }
      if (dados.coordenadorId === null) {
        ctx.addIssue({ code: 'custom', path: ['coordenadorId'], message: 'Selecione o coordenador.' });
      } else if (dados.coordenadorId === dados.colaboradorId) {
        ctx.addIssue({ code: 'custom', path: ['coordenadorId'], message: 'O coordenador não pode analisar a própria solicitação.' });
      }
      const selecionados = periodos.filter((p) => dados.periodoIds.includes(p.id));
      for (const violacao of validarRegrasSolicitacao({
        quantidadePeriodos: dados.periodoIds.length,
        totalDias: calcularTotalDias(selecionados),
        abono: dados.abono,
      })) {
        ctx.addIssue({ code: 'custom', path: [violacao.campo], message: violacao.mensagem });
      }
    });
}

function Etapa({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <Paper sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {numero}
        </Box>
        <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 600 }}>
          {titulo}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

export function SolicitacaoFormPage() {
  const params = useParams();
  const id = params.id ? Number(params.id) : null;
  const [searchParams] = useSearchParams();
  const usuario = useUsuarioLogado();
  const admin = ehAdministrador(usuario);
  // Quem não é administrador só cria solicitações para si mesmo.
  const colaboradorInicial = admin ? Number(searchParams.get('colaborador')) || null : usuario.colaborador.id;
  const navigate = useNavigate();
  const servicos = useServicos();

  const colaboradores = useColaboradores();
  const periodos = usePeriodos();
  const solicitacoes = useSolicitacoes();
  const projetos = useProjetos();
  const consultas = [colaboradores, periodos, solicitacoes, projetos];
  const carregando = consultas.some((c) => c.isPending);

  const existente: Solicitacao | null = id === null ? null : (solicitacoes.data?.find((s) => s.id === id) ?? null);
  const esquema = useMemo(() => criarEsquema(periodos.data ?? []), [periodos.data]);

  const { control, handleSubmit, reset, setError, setValue, getValues } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: { colaboradorId: colaboradorInicial, coordenadorId: null, periodoIds: [], abono: false, observacao: '' },
  });

  // Preenche o formulário uma única vez quando a solicitação em edição é carregada.
  const preenchido = useRef(false);
  useEffect(() => {
    if (existente && !preenchido.current) {
      preenchido.current = true;
      reset({
        colaboradorId: existente.colaborador.id,
        coordenadorId: existente.coordenador.id,
        periodoIds: existente.periodos.map((p) => p.id),
        abono: existente.abono,
        observacao: existente.observacao ?? '',
      });
    }
  }, [existente, reset]);

  const [colaboradorId, periodoIds, abono] = useWatch({ control, name: ['colaboradorId', 'periodoIds', 'abono'] });
  const [criandoPeriodo, setCriandoPeriodo] = useState(false);

  const disponiveis =
    colaboradorId === null
      ? []
      : periodosDisponiveis(colaboradorId, periodos.data ?? [], solicitacoes.data ?? [], id ?? undefined).sort((a, b) =>
          a.dataInicio.localeCompare(b.dataInicio),
        );
  const selecionados = (periodos.data ?? []).filter((p) => periodoIds.includes(p.id));
  const totalDias = calcularTotalDias(selecionados);
  const limitePeriodos = abono ? MAX_PERIODOS_ABONO : MAX_PERIODOS;
  const pessoaCritica = colaboradorId !== null && isPessoaCriticaEmAlgumProjeto(colaboradorId, projetos.data ?? []);
  const coordenadores = (colaboradores.data ?? []).filter((c) => c.isCoordenador && c.id !== colaboradorId);
  const violacoesAoVivo = validarRegrasSolicitacao({ quantidadePeriodos: periodoIds.length, totalDias, abono });

  const salvar = useMutacao(
    (input: { colaboradorId: number; coordenadorId: number; periodoIds: number[]; abono: boolean; observacao: string }) =>
      id === null ? servicos.solicitacoes.criar(input) : servicos.solicitacoes.atualizar(id, input),
    {
      sucesso: (s) => (id === null ? `Solicitação #${s.id} criada.` : `Solicitação #${s.id} atualizada e enviada para nova análise.`),
      errosDeCampoTratadosNaTela: true,
    },
  );

  const enviar = handleSubmit((dados) => {
    if (dados.colaboradorId === null || dados.coordenadorId === null) return;
    salvar.mutate(
      { ...dados, colaboradorId: dados.colaboradorId, coordenadorId: dados.coordenadorId },
      {
        onSuccess: (s) => navigate(`/solicitacoes/${s.id}`),
        onError: (erro) => aplicarErrosDoServico(erro, setError, CAMPOS),
      },
    );
  });

  const alternarPeriodo = (periodoId: number) => {
    const atuais = getValues('periodoIds');
    setValue(
      'periodoIds',
      atuais.includes(periodoId) ? atuais.filter((x) => x !== periodoId) : [...atuais, periodoId],
      { shouldValidate: true },
    );
  };

  const titulo = id === null ? 'Nova solicitação' : `Editar solicitação #${id}`;

  return (
    <>
      <Button component={RouterLink} to={id === null ? '/solicitacoes' : `/solicitacoes/${id}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        {id === null ? 'Solicitações' : `Solicitação #${id}`}
      </Button>
      <PageHeader
        titulo={titulo}
        subtitulo={id === null ? 'A solicitação é criada com status Em análise.' : 'Ao salvar, a solicitação volta para Em análise.'}
      />

      <EstadoConsulta
        carregando={carregando}
        erro={consultas.find((c) => c.error)?.error}
        onTentarNovamente={() => consultas.forEach((c) => void c.refetch())}
      >
        {id !== null && !existente ? (
          <Alert severity="warning">Solicitação não encontrada.</Alert>
        ) : existente && !podeEditarSolicitacao(usuario, existente) ? (
          <Alert severity="info" action={<Button component={RouterLink} to={`/solicitacoes/${existente.id}`}>Ver detalhes</Button>}>
            {isStatusFinal(existente.status) ? (
              <>
                Esta solicitação já está <StatusChip status={existente.status} /> e não pode mais ser editada.
              </>
            ) : (
              'Somente o próprio colaborador ou um administrador pode editar esta solicitação.'
            )}
          </Alert>
        ) : (
          <form onSubmit={enviar} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Stack spacing={2}>
                  <Etapa numero={1} titulo="Colaborador">
                    <Controller
                      control={control}
                      name="colaboradorId"
                      render={({ field, fieldState }) => (
                        <SeletorColaborador
                          rotulo="Quem vai se ausentar"
                          opcoes={colaboradores.data ?? []}
                          valor={field.value}
                          onChange={(novo) => {
                            field.onChange(novo);
                            // Períodos pertencem ao colaborador: troca de colaborador limpa a seleção.
                            setValue('periodoIds', []);
                            if (getValues('coordenadorId') === novo) setValue('coordenadorId', null);
                          }}
                          erro={fieldState.error?.message}
                          desabilitado={!admin}
                          ajuda={admin ? undefined : 'Você cria solicitações apenas para você mesmo.'}
                        />
                      )}
                    />
                  </Etapa>

                  <Etapa numero={2} titulo="Coordenador">
                    <Controller
                      control={control}
                      name="coordenadorId"
                      render={({ field, fieldState }) => (
                        <SeletorColaborador
                          rotulo="Quem vai analisar"
                          opcoes={coordenadores}
                          valor={field.value}
                          onChange={field.onChange}
                          erro={fieldState.error?.message}
                          ajuda="Somente coordenadores, exceto o próprio solicitante."
                        />
                      )}
                    />
                  </Etapa>

                  <Etapa numero={3} titulo={`Períodos (1 a ${limitePeriodos})`}>
                    <Controller
                      control={control}
                      name="periodoIds"
                      render={({ fieldState }) => (
                        <>
                          {colaboradorId === null ? (
                            <Typography color="text.secondary">Selecione o colaborador para ver os períodos disponíveis.</Typography>
                          ) : disponiveis.length === 0 ? (
                            <Typography color="text.secondary">Este colaborador não possui períodos disponíveis.</Typography>
                          ) : (
                            <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                              {disponiveis.map((p) => {
                                const marcado = periodoIds.includes(p.id);
                                const bloqueado = !marcado && periodoIds.length >= limitePeriodos;
                                return (
                                  <ListItem key={p.id} disablePadding divider>
                                    <ListItemButton onClick={() => alternarPeriodo(p.id)} disabled={bloqueado} dense>
                                      <ListItemIcon sx={{ minWidth: 40 }}>
                                        <Checkbox edge="start" checked={marcado} tabIndex={-1} disableRipple slotProps={{ input: { 'aria-label': descreverPeriodo(p) } }} />
                                      </ListItemIcon>
                                      <ListItemText primary={descreverPeriodo(p)} />
                                    </ListItemButton>
                                  </ListItem>
                                );
                              })}
                            </List>
                          )}
                          {fieldState.error && <FormHelperText error>{fieldState.error.message}</FormHelperText>}
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            sx={{ mt: 1.5 }}
                            disabled={colaboradorId === null}
                            onClick={() => setCriandoPeriodo(true)}
                          >
                            Cadastrar novo período
                          </Button>
                        </>
                      )}
                    />
                  </Etapa>

                  <Etapa numero={4} titulo="Abono e observação">
                    <Controller
                      control={control}
                      name="abono"
                      render={({ field, fieldState }) => (
                        <Box sx={{ mb: 2 }}>
                          <FormControlLabel
                            control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                            label="Solicitação de abono"
                          />
                          <FormHelperText error={Boolean(fieldState.error)}>
                            {fieldState.error?.message ??
                              `Abono permite no máximo ${MAX_PERIODOS_ABONO} períodos e ${MAX_DIAS_ABONO} dias no total.`}
                          </FormHelperText>
                        </Box>
                      )}
                    />
                    <Controller
                      control={control}
                      name="observacao"
                      render={({ field, fieldState }) => (
                        <TextField
                          label="Observação (opcional)"
                          multiline
                          minRows={3}
                          {...field}
                          error={Boolean(fieldState.error)}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Etapa>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{ p: 2.5, position: { lg: 'sticky' }, top: { lg: 24 } }}>
                  <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
                    Resumo
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Períodos</Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {periodoIds.length} de {limitePeriodos}
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                      <Typography color="text.secondary">Total de dias</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{totalDias}</Typography>
                    </Stack>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography color="text.secondary">Pessoa crítica</Typography>
                      {pessoaCritica ? <Chip label="Sim" size="small" color="warning" variant="outlined" /> : <Typography>Não</Typography>}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Total de dias e pessoa crítica são calculados a partir dos períodos e dos projetos do colaborador.
                    </Typography>
                    {colaboradorId !== null && periodoIds.length > 0 && violacoesAoVivo.length > 0 && (
                      <Alert severity="warning">{violacoesAoVivo.map((v) => v.mensagem).join(' ')}</Alert>
                    )}
                    <Divider />
                    <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                      <Button component={RouterLink} to={id === null ? '/solicitacoes' : `/solicitacoes/${id}`} disabled={salvar.isPending}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="contained" loading={salvar.isPending}>
                        {id === null ? 'Criar solicitação' : 'Salvar alterações'}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </form>
        )}
      </EstadoConsulta>

      <PeriodoFormDialog
        aberto={criandoPeriodo}
        colaboradorIdInicial={colaboradorId}
        colaboradorBloqueado
        onFechar={() => setCriandoPeriodo(false)}
        onSalvo={(novo) => {
          const atuais = getValues('periodoIds');
          if (atuais.length < limitePeriodos) setValue('periodoIds', [...atuais, novo.id], { shouldValidate: true });
        }}
      />
    </>
  );
}
