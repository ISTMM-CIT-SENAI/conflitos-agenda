import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Button,
  Chip,
  Grid,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material';
import { GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { CampoData } from '@/components/forms/CampoData';
import { SeletorColaborador } from '@/components/forms/SeletorColaborador';
import { TabelaDados } from '@/components/tables/TabelaDados';
import type { Solicitacao } from '@/domain/entities';
import { ROTULO_STATUS, TODOS_STATUS, isStatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { useUsuarioLogado } from '@/app/providers/useSessao';
import { ehAdministrador, podeEditarSolicitacao, podeExcluirSolicitacao } from '@/domain/acesso';
import { intervaloDoPeriodo, seSobrepoem } from '@/domain/validation/periodo';
import { violacoesDaSolicitacao } from '@/domain/validation/solicitacao';
import { useColaboradores, useMutacao, useSolicitacoes } from '@/hooks/useDados';
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl';
import { formatarDataHora, isDataISO, somarDias } from '@/lib/datas';
import { contemTexto } from '@/lib/texto';
import { descreverPeriodo } from '../periodos/formatacao';

type ChaveFiltro = 'busca' | 'status' | 'colaborador' | 'de' | 'ate';

function correspondeBusca(s: Solicitacao, busca: string): boolean {
  return (
    `#${s.id}` === busca.trim() ||
    String(s.id) === busca.trim() ||
    contemTexto(s.colaborador.nome, busca) ||
    contemTexto(s.coordenador.nome, busca) ||
    contemTexto(s.observacao ?? '', busca)
  );
}

export function SolicitacoesPage() {
  const servicos = useServicos();
  const usuario = useUsuarioLogado();
  const navigate = useNavigate();
  const { search } = useLocation();
  const filtros = useFiltrosUrl<ChaveFiltro>();
  const busca = filtros.obter('busca');
  const statusFiltro = Number(filtros.obter('status'));
  const colaboradorId = filtros.obterNumero('colaborador');
  const de = filtros.obter('de');
  const ate = filtros.obter('ate');

  const solicitacoes = useSolicitacoes();
  const colaboradores = useColaboradores();
  const [excluindo, setExcluindo] = useState<Solicitacao | null>(null);
  const excluir = useMutacao((id: number) => servicos.solicitacoes.excluir(id), { sucesso: 'Solicitação excluída.' });

  const linhas = useMemo(() => {
    // Intervalo do filtro: "até" é inclusivo, então o retorno equivalente é o dia seguinte.
    const intervaloFiltro =
      isDataISO(de) || isDataISO(ate)
        ? { inicio: isDataISO(de) ? de : '0000-01-01', retorno: isDataISO(ate) ? somarDias(ate, 1) : '9999-12-31' }
        : null;
    return (solicitacoes.data ?? []).filter(
      (s) =>
        (!busca || correspondeBusca(s, busca)) &&
        (!isStatusSolicitacao(statusFiltro) || s.status === statusFiltro) &&
        (colaboradorId === null || s.colaborador.id === colaboradorId) &&
        (!intervaloFiltro || s.periodos.some((p) => seSobrepoem(intervaloDoPeriodo(p), intervaloFiltro))),
    );
  }, [solicitacoes.data, busca, statusFiltro, colaboradorId, de, ate]);

  const colunas: GridColDef<Solicitacao>[] = [
    {
      field: 'id',
      headerName: 'Nº',
      width: 80,
      renderCell: ({ row }) => (
        <Link component={RouterLink} to={`/solicitacoes/${row.id}`} state={{ voltarPara: search }} underline="hover">
          #{row.id}
        </Link>
      ),
    },
    { field: 'colaborador', headerName: 'Colaborador', flex: 1, minWidth: 160, valueGetter: (_, row) => row.colaborador.nome },
    { field: 'coordenador', headerName: 'Coordenador', flex: 1, minWidth: 150, valueGetter: (_, row) => row.coordenador.nome },
    {
      field: 'periodos',
      headerName: 'Períodos',
      flex: 1.4,
      minWidth: 240,
      sortable: false,
      valueGetter: (_, row) => row.periodos.map(descreverPeriodo).join(' | '),
    },
    { field: 'totalDias', headerName: 'Dias', type: 'number', width: 70 },
    {
      field: 'marcadores',
      headerName: 'Indicadores',
      width: 190,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          {row.abono && <Chip label="Abono" size="small" color="secondary" variant="outlined" />}
          {row.isPessoaCritica && <Chip label="Pessoa crítica" size="small" color="warning" variant="outlined" />}
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 210,
      renderCell: ({ row }) => {
        const violacoes = violacoesDaSolicitacao(row);
        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
            <StatusChip status={row.status} />
            {violacoes.length > 0 && (
              <Tooltip title={violacoes.map((v) => v.mensagem).join(' ')}>
                <ErrorOutlineIcon color="error" fontSize="small" aria-label="Solicitação viola regras" />
              </Tooltip>
            )}
          </Stack>
        );
      },
    },
    {
      field: 'criadaEm',
      headerName: 'Criada em',
      width: 150,
      valueFormatter: (valor: string) => formatarDataHora(valor),
    },
    {
      field: 'acoes',
      type: 'actions',
      headerName: 'Ações',
      width: 130,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="ver"
          icon={<VisibilityOutlinedIcon />}
          label="Ver detalhes"
          onClick={() => navigate(`/solicitacoes/${row.id}`, { state: { voltarPara: search } })}
        />,
        <GridActionsCellItem
          key="editar"
          icon={<EditOutlinedIcon />}
          label={podeEditarSolicitacao(usuario, row) ? 'Editar' : 'Você não pode editar esta solicitação'}
          disabled={!podeEditarSolicitacao(usuario, row)}
          onClick={() => navigate(`/solicitacoes/${row.id}/editar`)}
        />,
        <GridActionsCellItem
          key="excluir"
          icon={<DeleteOutlinedIcon />}
          label={podeExcluirSolicitacao(usuario, row) ? 'Excluir' : 'Você não pode excluir esta solicitação'}
          disabled={!podeExcluirSolicitacao(usuario, row)}
          onClick={() => setExcluindo(row)}
        />,
      ],
    },
  ];

  const consultas = [solicitacoes, colaboradores];

  return (
    <>
      <PageHeader
        titulo="Solicitações"
        subtitulo="Pedidos de ausência aguardando ou já analisados pelos coordenadores."
        acoes={
          <Button component={RouterLink} to="/solicitacoes/nova" variant="contained" startIcon={<AddIcon />}>
            Nova solicitação
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <TextField
              placeholder="Buscar nº, nome ou observação"
              value={busca}
              onChange={(e) => filtros.definir('busca', e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
                htmlInput: { 'aria-label': 'Buscar solicitações' },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
            <TextField
              select
              label="Status"
              value={isStatusSolicitacao(statusFiltro) ? statusFiltro : ''}
              onChange={(e) => filtros.definir('status', e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {TODOS_STATUS.map((s) => (
                <MenuItem key={s} value={s}>
                  {ROTULO_STATUS[s]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {(ehAdministrador(usuario) || usuario.colaborador.isCoordenador) && (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <SeletorColaborador
              rotulo="Colaborador"
              opcoes={colaboradores.data ?? []}
              carregando={colaboradores.isPending}
              valor={colaboradorId}
              onChange={(id) => filtros.definir('colaborador', id)}
            />
          </Grid>
          )}
          <Grid size={{ xs: 6, lg: 'grow' }}>
            <CampoData rotulo="Ausente de" valor={de} onChange={(v) => filtros.definir('de', v)} />
          </Grid>
          <Grid size={{ xs: 6, lg: 'grow' }}>
            <CampoData rotulo="Até" valor={ate} onChange={(v) => filtros.definir('ate', v)} minimo={isDataISO(de) ? de : undefined} />
          </Grid>
          {filtros.possuiFiltros && (
            <Grid size={{ xs: 12 }}>
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
        vazio={(solicitacoes.data ?? []).length === 0}
        mensagemVazia="Nenhuma solicitação cadastrada."
        acaoVazia={
          <Button component={RouterLink} to="/solicitacoes/nova" variant="contained" startIcon={<AddIcon />}>
            Criar solicitação
          </Button>
        }
      >
        <TabelaDados
          rows={linhas}
          columns={colunas}
          getRowHeight={() => 'auto'}
          sx={{ '& .MuiDataGrid-cell': { py: 1 } }}
          localeText={{ noRowsLabel: 'Nenhuma solicitação corresponde aos filtros.' }}
          initialState={{ sorting: { sortModel: [{ field: 'criadaEm', sort: 'desc' }] } }}
        />
      </EstadoConsulta>

      <ConfirmDialog
        aberto={excluindo !== null}
        titulo="Excluir solicitação?"
        mensagem={`A solicitação #${excluindo?.id ?? ''} de ${excluindo?.colaborador.nome ?? ''} será removida permanentemente. Os períodos continuarão cadastrados.`}
        rotuloConfirmar="Excluir"
        cor="error"
        processando={excluir.isPending}
        onFechar={() => setExcluindo(null)}
        onConfirmar={() => excluindo && excluir.mutate(excluindo.id, { onSettled: () => setExcluindo(null) })}
      />
    </>
  );
}
