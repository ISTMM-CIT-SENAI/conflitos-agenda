import '@fullcalendar/react/skeleton.css';
import '@fullcalendar/react/themes/classic/theme.css';
import '@fullcalendar/react/themes/classic/palette.css';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FullCalendar, { type EventClickInfo, type EventInput } from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import ptBrLocale from '@fullcalendar/react/locales/pt-br';
import classicThemePlugin from '@fullcalendar/react/themes/classic';
import { Box, Button, Chip, Grid, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsuarioLogado } from '@/app/providers/useSessao';
import { ehCoordenador } from '@/domain/acesso';
import { PageHeader } from '@/components/common/PageHeader';
import { HEX_SEM_SOLICITACAO, VISUAL_STATUS } from '@/components/common/status';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { SeletorColaborador } from '@/components/forms/SeletorColaborador';
import { solicitacaoDoPeriodo } from '@/domain/consultas';
import { StatusSolicitacao, TODOS_STATUS } from '@/domain/enums/statusSolicitacao';
import { detectarConflitos } from '@/domain/validation/conflito';
import { intervaloDoPeriodo } from '@/domain/validation/periodo';
import { useColaboradores, usePeriodos, useProjetos, useSolicitacoes } from '@/hooks/useDados';
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl';

const SEM_SOLICITACAO = 'sem';
/** Ausência planejada de um colega de projeto: só nome e datas, sem detalhes da solicitação. */
const COLEGA = 'colega';
const HEX_COLEGA = '#b0bec5';
const COR_CONFLITO = '#c62828';

type ChaveFiltro = 'colaborador' | 'status';

interface DadosEvento {
  solicitacaoId: number | null;
  deColega: boolean;
  colaboradorId: number;
}

export function CalendarioPage() {
  const navigate = useNavigate();
  const usuario = useUsuarioLogado();
  const admin = ehCoordenador(usuario);
  const filtros = useFiltrosUrl<ChaveFiltro>();
  const colaboradorId = filtros.obterNumero('colaborador');
  const statusSelecionados = filtros.obterLista('status');

  const colaboradores = useColaboradores();
  const periodos = usePeriodos();
  const solicitacoes = useSolicitacoes();
  const projetos = useProjetos();
  const consultas = [colaboradores, periodos, solicitacoes, projetos];

  /** IDs dos Períodos envolvidos em algum Conflito entre solicitações não recusadas. */
  const periodosEmConflito = useMemo(() => {
    const ids = new Set<number>();
    const todas = solicitacoes.data ?? [];
    for (const s of todas) {
      if (s.status === StatusSolicitacao.Recusada) continue;
      for (const c of detectarConflitos(s, todas, projetos.data ?? [])) {
        ids.add(c.periodo.id);
        ids.add(c.outroPeriodo.id);
      }
    }
    return ids;
  }, [solicitacoes.data, projetos.data]);

  const eventos = useMemo<EventInput[]>(() => {
    const nomes = new Map((colaboradores.data ?? []).map((c) => [c.id, c.nome]));
    return (periodos.data ?? [])
      .filter((p) => colaboradorId === null || p.idColaborador === colaboradorId)
      .flatMap((p) => {
        const solicitacao = solicitacaoDoPeriodo(p.id, solicitacoes.data ?? []);
        const deColega = !solicitacao && !admin && p.idColaborador !== usuario.colaborador.id;
        const chaveStatus = solicitacao ? String(solicitacao.status) : deColega ? COLEGA : SEM_SOLICITACAO;
        if (statusSelecionados.length > 0 && !statusSelecionados.includes(chaveStatus)) return [];

        const conflito = periodosEmConflito.has(p.id);
        const cor = solicitacao ? VISUAL_STATUS[solicitacao.status].hex : deColega ? HEX_COLEGA : HEX_SEM_SOLICITACAO;
        const intervalo = intervaloDoPeriodo(p);
        const nome = nomes.get(p.idColaborador) ?? `Colaborador #${p.idColaborador}`;
        const dados: DadosEvento = { solicitacaoId: solicitacao?.id ?? null, colaboradorId: p.idColaborador, deColega };
        return [
          {
            id: String(p.id),
            title: `${conflito ? '⚠ ' : ''}${nome}${solicitacao ? ` · #${solicitacao.id}` : ''}`,
            // Eventos de dia inteiro: o fim é exclusivo, exatamente como o dia de Retorno.
            start: intervalo.inicio,
            end: intervalo.retorno,
            allDay: true,
            color: cor,
            contrastColor: deColega ? '#263238' : '#ffffff',
            className: [conflito ? 'evento-conflito' : '', deColega ? 'evento-colega' : ''].join(' ').trim(),
            extendedProps: dados,
          },
        ];
      });
  }, [periodos.data, solicitacoes.data, colaboradores.data, colaboradorId, statusSelecionados, periodosEmConflito, admin, usuario.colaborador.id]);

  const aoClicar = (info: EventClickInfo) => {
    const dados = info.event.extendedProps as DadosEvento;
    if (dados.deColega) return;
    if (dados.solicitacaoId) navigate(`/solicitacoes/${dados.solicitacaoId}`);
    else navigate(admin ? `/colaboradores/${dados.colaboradorId}` : '/periodos');
  };

  const opcoesStatus = [
    ...TODOS_STATUS.map((s) => ({ valor: String(s), rotulo: VISUAL_STATUS[s].rotulo, cor: VISUAL_STATUS[s].hex })),
    { valor: SEM_SOLICITACAO, rotulo: 'Sem solicitação', cor: HEX_SEM_SOLICITACAO },
    ...(admin ? [] : [{ valor: COLEGA, rotulo: 'Colega de projeto', cor: HEX_COLEGA }]),
  ];

  return (
    <>
      <PageHeader titulo="Calendário" subtitulo="Ausências por mês. Clique em um evento para abrir a solicitação." />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <SeletorColaborador
              rotulo="Colaborador"
              opcoes={colaboradores.data ?? []}
              carregando={colaboradores.isPending}
              valor={colaboradorId}
              onChange={(id) => filtros.definir('colaborador', id)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              select
              label="Status"
              value={statusSelecionados}
              onChange={(e) => {
                const valor = e.target.value as unknown as string[] | string;
                filtros.definir('status', typeof valor === 'string' ? valor.split(',') : valor);
              }}
              slotProps={{
                select: {
                  multiple: true,
                  renderValue: (selecionados) =>
                    (selecionados as string[]).length === 0
                      ? 'Todos'
                      : (selecionados as string[]).map((v) => opcoesStatus.find((o) => o.valor === v)?.rotulo).join(', '),
                  displayEmpty: true,
                },
                inputLabel: { shrink: true },
              }}
            >
              {opcoesStatus.map((o) => (
                <MenuItem key={o.valor} value={o.valor}>
                  {o.rotulo}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {filtros.possuiFiltros && (
            <Grid size={{ xs: 12, md: 'auto' }}>
              <Button size="small" startIcon={<FilterAltOffOutlinedIcon />} onClick={filtros.limpar}>
                Limpar filtros
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      <EstadoConsulta
        carregando={consultas.some((c) => c.isPending)}
        erro={consultas.find((c) => c.error)?.error}
        onTentarNovamente={() => consultas.forEach((c) => void c.refetch())}
      >
        <Paper sx={{ p: { xs: 1, sm: 2 } }} className="calendario-ausencias">
          <FullCalendar
            plugins={[dayGridPlugin, classicThemePlugin]}
            initialView="dayGridMonth"
            locale={ptBrLocale}
            headerToolbar={{ start: 'title', end: 'today prev,next' }}
            events={eventos}
            eventClick={aoClicar}
            dayMaxEvents={4}
            height="auto"
          />
        </Paper>

        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Legenda:
          </Typography>
          {opcoesStatus.map((o) => (
            <Chip
              key={o.valor}
              label={o.rotulo}
              size="small"
              icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: o.cor, ml: '8px !important' }} />}
              variant="outlined"
            />
          ))}
          <Chip
            label="Conflito com pessoa crítica"
            size="small"
            icon={<WarningAmberIcon />}
            variant="outlined"
            sx={{ borderColor: COR_CONFLITO, borderStyle: 'dashed' }}
          />
        </Stack>
      </EstadoConsulta>
    </>
  );
}
