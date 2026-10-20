import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box, Button, Chip, InputAdornment, Link, TextField, Typography } from '@mui/material';
import { GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { TabelaDados } from '@/components/tables/TabelaDados';
import type { Colaborador } from '@/domain/entities';
import { useColaboradores, useMutacao, usePeriodos, useSolicitacoes, useUsuarios } from '@/hooks/useDados';
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl';
import { contemTexto } from '@/lib/texto';
import { ColaboradorFormDialog } from './ColaboradorFormDialog';

interface Linha extends Colaborador {
  qtdPeriodos: number;
  qtdSolicitacoes: number;
  acesso: string;
}

export function ColaboradoresPage() {
  const servicos = useServicos();
  const navigate = useNavigate();
  const filtros = useFiltrosUrl<'busca'>();
  const busca = filtros.obter('busca');

  const colaboradores = useColaboradores();
  const periodos = usePeriodos();
  const solicitacoes = useSolicitacoes();
  const usuarios = useUsuarios();

  const [formulario, setFormulario] = useState<{ aberto: boolean; colaborador: Colaborador | null }>({
    aberto: false,
    colaborador: null,
  });
  const [excluindo, setExcluindo] = useState<Colaborador | null>(null);
  const [promovendo, setPromovendo] = useState<Colaborador | null>(null);

  const excluir = useMutacao((id: number) => servicos.colaboradores.excluir(id), { sucesso: 'Colaborador excluído.' });
  const tornarCoordenador = useMutacao((id: number) => servicos.colaboradores.tornarCoordenador(id), {
    sucesso: (c) => `${c.nome} agora é coordenador.`,
  });

  const linhas = useMemo<Linha[]>(
    () =>
      (colaboradores.data ?? [])
        .filter((c) => !busca || contemTexto(c.nome, busca))
        .map((c) => ({
          ...c,
          qtdPeriodos: (periodos.data ?? []).filter((p) => p.idColaborador === c.id).length,
          qtdSolicitacoes: (solicitacoes.data ?? []).filter((s) => s.colaborador.id === c.id).length,
          acesso: (() => {
            const conta = usuarios.data?.find((u) => u.colaborador.id === c.id);
            return conta ? `${conta.nomeUsuario}${conta.ativo ? '' : ' (desativado)'}` : '';
          })(),
        })),
    [colaboradores.data, periodos.data, solicitacoes.data, usuarios.data, busca],
  );

  const colunas: GridColDef<Linha>[] = [
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 1.2,
      minWidth: 180,
      renderCell: ({ row }) => (
        <Link component={RouterLink} to={`/colaboradores/${row.id}`} underline="hover">
          {row.nome}
        </Link>
      ),
    },
    {
      field: 'acesso',
      headerName: 'Acesso ao sistema',
      flex: 1,
      minWidth: 170,
      renderCell: ({ row }) =>
        row.acesso ? (
          row.acesso
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 'inherit' }}>
            Sem acesso
          </Typography>
        ),
    },
    {
      field: 'isCoordenador',
      headerName: 'Perfil',
      width: 150,
      renderCell: ({ row }) =>
        row.isCoordenador ? (
          <Chip icon={<VerifiedUserOutlinedIcon />} label="Coordenador" size="small" color="primary" variant="outlined" />
        ) : (
          'Colaborador'
        ),
    },
    { field: 'qtdPeriodos', headerName: 'Períodos', type: 'number', width: 100 },
    { field: 'qtdSolicitacoes', headerName: 'Solicitações', type: 'number', width: 115 },
    {
      field: 'acoes',
      type: 'actions',
      headerName: 'Ações',
      width: 170,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="ver"
          icon={<VisibilityOutlinedIcon />}
          label="Ver detalhes"
          onClick={() => navigate(`/colaboradores/${row.id}`)}
        />,
        <GridActionsCellItem
          key="editar"
          icon={<EditOutlinedIcon />}
          label="Editar"
          onClick={() => setFormulario({ aberto: true, colaborador: row })}
        />,
        <GridActionsCellItem
          key="coordenador"
          icon={<VerifiedUserOutlinedIcon />}
          label="Tornar coordenador"
          disabled={row.isCoordenador}
          onClick={() => setPromovendo(row)}
        />,
        <GridActionsCellItem
          key="excluir"
          icon={<DeleteOutlineIcon />}
          label="Excluir"
          onClick={() => setExcluindo(row)}
        />,
      ],
    },
  ];

  const consultas = [colaboradores, periodos, solicitacoes];

  return (
    <>
      <PageHeader
        titulo="Colaboradores"
        subtitulo="Pessoas cadastradas, seus perfis de coordenação e acesso ao sistema."
        acoes={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setFormulario({ aberto: true, colaborador: null })}
          >
            Novo colaborador
          </Button>
        }
      />

      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <TextField
          placeholder="Buscar por nome"
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
            htmlInput: { 'aria-label': 'Buscar colaboradores' },
          }}
        />
      </Box>

      <EstadoConsulta
        carregando={consultas.some((c) => c.isPending)}
        erro={consultas.find((c) => c.error)?.error}
        onTentarNovamente={() => consultas.forEach((c) => void c.refetch())}
        vazio={(colaboradores.data ?? []).length === 0}
        mensagemVazia="Nenhum colaborador cadastrado."
        acaoVazia={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormulario({ aberto: true, colaborador: null })}>
            Cadastrar colaborador
          </Button>
        }
      >
        <TabelaDados
          rows={linhas}
          columns={colunas}
          localeText={{ noRowsLabel: 'Nenhum colaborador corresponde à busca.' }}
          initialState={{ sorting: { sortModel: [{ field: 'nome', sort: 'asc' }] } }}
        />
      </EstadoConsulta>

      <ColaboradorFormDialog
        aberto={formulario.aberto}
        colaborador={formulario.colaborador}
        onFechar={() => setFormulario({ aberto: false, colaborador: null })}
      />

      <ConfirmDialog
        aberto={excluindo !== null}
        titulo="Excluir colaborador?"
        mensagem={`${excluindo?.nome ?? ''} será removido permanentemente.`}
        rotuloConfirmar="Excluir"
        cor="error"
        processando={excluir.isPending}
        onFechar={() => setExcluindo(null)}
        onConfirmar={() => excluindo && excluir.mutate(excluindo.id, { onSettled: () => setExcluindo(null) })}
      />

      <ConfirmDialog
        aberto={promovendo !== null}
        titulo="Tornar coordenador?"
        mensagem={`${promovendo?.nome ?? ''} poderá analisar solicitações de outros colaboradores.`}
        rotuloConfirmar="Tornar coordenador"
        processando={tornarCoordenador.isPending}
        onFechar={() => setPromovendo(null)}
        onConfirmar={() =>
          promovendo && tornarCoordenador.mutate(promovendo.id, { onSettled: () => setPromovendo(null) })
        }
      />
    </>
  );
}
