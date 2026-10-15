import AddIcon from '@mui/icons-material/Add';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Button, Link, Stack, Typography } from '@mui/material';
import { GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusChip } from '@/components/common/StatusChip';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { SeletorColaborador } from '@/components/forms/SeletorColaborador';
import { TabelaDados } from '@/components/tables/TabelaDados';
import { solicitacaoDoPeriodo } from '@/domain/consultas';
import type { Periodo, Solicitacao } from '@/domain/entities';
import { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { duracaoEmDias, intervaloDoPeriodo, ultimoDiaDeAusencia } from '@/domain/validation/periodo';
import { useColaboradores, useMutacao, usePeriodos, useSolicitacoes } from '@/hooks/useDados';
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl';
import { formatarData } from '@/lib/datas';
import { PeriodoFormDialog } from './PeriodoFormDialog';

interface Linha extends Periodo {
  colaboradorNome: string;
  inicio: string;
  ultimoDia: string;
  retorno: string;
  duracao: number;
  solicitacao: Solicitacao | null;
}

export function PeriodosPage() {
  const servicos = useServicos();
  const filtros = useFiltrosUrl<'colaborador'>();
  const colaboradorId = filtros.obterNumero('colaborador');

  const colaboradores = useColaboradores();
  const periodos = usePeriodos();
  const solicitacoes = useSolicitacoes();

  const [formulario, setFormulario] = useState<{ aberto: boolean; periodo: Periodo | null; bloqueado: boolean }>({
    aberto: false,
    periodo: null,
    bloqueado: false,
  });
  const [excluindo, setExcluindo] = useState<Periodo | null>(null);
  const excluir = useMutacao((id: number) => servicos.periodos.excluir(id), { sucesso: 'Período excluído.' });

  const linhas = useMemo<Linha[]>(
    () =>
      (periodos.data ?? [])
        .filter((p) => colaboradorId === null || p.idColaborador === colaboradorId)
        .map((p) => {
          const intervalo = intervaloDoPeriodo(p);
          return {
            ...p,
            colaboradorNome:
              colaboradores.data?.find((c) => c.id === p.idColaborador)?.nome ?? `Colaborador #${p.idColaborador}`,
            inicio: intervalo.inicio,
            ultimoDia: ultimoDiaDeAusencia(intervalo),
            retorno: intervalo.retorno,
            duracao: duracaoEmDias(intervalo),
            solicitacao: solicitacaoDoPeriodo(p.id, solicitacoes.data ?? []),
          };
        }),
    [periodos.data, colaboradores.data, solicitacoes.data, colaboradorId],
  );

  const colunas: GridColDef<Linha>[] = [
    {
      field: 'colaboradorNome',
      headerName: 'Colaborador',
      flex: 1,
      minWidth: 170,
      renderCell: ({ row }) => (
        <Link component={RouterLink} to={`/colaboradores/${row.idColaborador}`} underline="hover">
          {row.colaboradorNome}
        </Link>
      ),
    },
    { field: 'inicio', headerName: 'Início', width: 115, valueFormatter: (v: string) => formatarData(v) },
    { field: 'ultimoDia', headerName: 'Último dia', width: 115, valueFormatter: (v: string) => formatarData(v) },
    { field: 'retorno', headerName: 'Retorno', width: 115, valueFormatter: (v: string) => formatarData(v) },
    { field: 'duracao', headerName: 'Dias', type: 'number', width: 80 },
    {
      field: 'solicitacao',
      headerName: 'Solicitação',
      flex: 1,
      minWidth: 220,
      sortComparator: (a: Solicitacao | null, b: Solicitacao | null) => (a?.id ?? 0) - (b?.id ?? 0),
      renderCell: ({ row }) =>
        row.solicitacao ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', height: '100%' }}>
            <Link component={RouterLink} to={`/solicitacoes/${row.solicitacao.id}`} underline="hover">
              #{row.solicitacao.id}
            </Link>
            <StatusChip status={row.solicitacao.status} />
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 'inherit' }}>
            Sem solicitação
          </Typography>
        ),
    },
    {
      field: 'acoes',
      type: 'actions',
      headerName: 'Ações',
      width: 100,
      getActions: ({ row }) => {
        const aprovada = row.solicitacao?.status === StatusSolicitacao.Aprovada;
        return [
          <GridActionsCellItem
            key="editar"
            icon={<EditOutlinedIcon />}
            label={aprovada ? 'Período de solicitação aprovada não pode ser editado' : 'Editar'}
            disabled={aprovada}
            onClick={() => setFormulario({ aberto: true, periodo: row, bloqueado: row.solicitacao !== null })}
          />,
          <GridActionsCellItem
            key="excluir"
            icon={<DeleteOutlinedIcon />}
            label={row.solicitacao ? 'Período vinculado a uma solicitação' : 'Excluir'}
            disabled={row.solicitacao !== null}
            onClick={() => setExcluindo(row)}
          />,
        ];
      },
    },
  ];

  const consultas = [colaboradores, periodos, solicitacoes];
  const novoPeriodo = () => setFormulario({ aberto: true, periodo: null, bloqueado: false });

  return (
    <>
      <PageHeader
        titulo="Períodos"
        subtitulo="Intervalos de ausência dos colaboradores, de 10 a 30 dias."
        acoes={
          <>
            <Button
              component={RouterLink}
              to={colaboradorId ? `/calendario?colaborador=${colaboradorId}` : '/calendario'}
              startIcon={<CalendarMonthOutlinedIcon />}
            >
              Ver no calendário
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={novoPeriodo}>
              Novo período
            </Button>
          </>
        }
      />

      <Box sx={{ mb: 2, maxWidth: 360 }}>
        <SeletorColaborador
          rotulo="Filtrar por colaborador"
          opcoes={colaboradores.data ?? []}
          carregando={colaboradores.isPending}
          valor={colaboradorId}
          onChange={(id) => filtros.definir('colaborador', id)}
        />
      </Box>

      <EstadoConsulta
        carregando={consultas.some((c) => c.isPending)}
        erro={consultas.find((c) => c.error)?.error}
        onTentarNovamente={() => consultas.forEach((c) => void c.refetch())}
        vazio={(periodos.data ?? []).length === 0}
        mensagemVazia="Nenhum período cadastrado."
        acaoVazia={
          <Button variant="contained" startIcon={<AddIcon />} onClick={novoPeriodo}>
            Cadastrar período
          </Button>
        }
      >
        <TabelaDados
          rows={linhas}
          columns={colunas}
          localeText={{ noRowsLabel: 'Nenhum período para este colaborador.' }}
          initialState={{ sorting: { sortModel: [{ field: 'inicio', sort: 'asc' }] } }}
        />
      </EstadoConsulta>

      <PeriodoFormDialog
        aberto={formulario.aberto}
        periodo={formulario.periodo}
        colaboradorBloqueado={formulario.bloqueado}
        colaboradorIdInicial={colaboradorId}
        onFechar={() => setFormulario({ aberto: false, periodo: null, bloqueado: false })}
      />

      <ConfirmDialog
        aberto={excluindo !== null}
        titulo="Excluir período?"
        mensagem={
          excluindo
            ? `O período de ${formatarData(intervaloDoPeriodo(excluindo).inicio)} será removido permanentemente.`
            : ''
        }
        rotuloConfirmar="Excluir"
        cor="error"
        processando={excluir.isPending}
        onFechar={() => setExcluindo(null)}
        onConfirmar={() => excluindo && excluir.mutate(excluindo.id, { onSettled: () => setExcluindo(null) })}
      />
    </>
  );
}
