import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SearchIcon from '@mui/icons-material/Search';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { TabelaDados } from '@/components/tables/TabelaDados';
import type { Projeto } from '@/domain/entities';
import { useMutacao, useProjetos } from '@/hooks/useDados';
import { useFiltrosUrl } from '@/hooks/useFiltrosUrl';
import { contemTexto } from '@/lib/texto';
import { ProjetoFormDialog } from './ProjetoFormDialog';

function MembrosDialog({ projeto, onFechar }: { projeto: Projeto | null; onFechar: () => void }) {
  return (
    <Dialog open={projeto !== null} onClose={onFechar} maxWidth="xs" fullWidth>
      <DialogTitle>Colaboradores · {projeto?.nome}</DialogTitle>
      <DialogContent dividers>
        {projeto && projeto.colaboradores.length === 0 ? (
          <Typography color="text.secondary">Nenhum colaborador neste projeto.</Typography>
        ) : (
          <List dense disablePadding>
            {projeto?.colaboradores.map((c) => {
              const critico = projeto.pessoasCriticas.some((p) => p.id === c.id);
              return (
                <ListItem
                  key={c.id}
                  disableGutters
                  secondaryAction={
                    critico && <Chip icon={<WarningAmberIcon />} label="Pessoa crítica" size="small" color="warning" variant="outlined" />
                  }
                >
                  <ListItemText
                    primary={
                      <Link component={RouterLink} to={`/colaboradores/${c.id}`} underline="hover">
                        {c.nome}
                      </Link>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFechar}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

export function ProjetosPage() {
  const servicos = useServicos();
  const filtros = useFiltrosUrl<'busca'>();
  const busca = filtros.obter('busca');
  const projetos = useProjetos();

  const [formulario, setFormulario] = useState<{ aberto: boolean; projeto: Projeto | null }>({ aberto: false, projeto: null });
  const [vendoMembros, setVendoMembros] = useState<Projeto | null>(null);
  const [excluindo, setExcluindo] = useState<Projeto | null>(null);
  const excluir = useMutacao((id: number) => servicos.projetos.excluir(id), { sucesso: 'Projeto excluído.' });

  const linhas = useMemo(
    () => (projetos.data ?? []).filter((p) => !busca || contemTexto(p.nome, busca)),
    [projetos.data, busca],
  );

  const colunas: GridColDef<Projeto>[] = [
    { field: 'nome', headerName: 'Projeto', flex: 1, minWidth: 180 },
    {
      field: 'colaboradores',
      headerName: 'Colaboradores',
      width: 140,
      type: 'number',
      valueGetter: (_, row) => row.colaboradores.length,
    },
    {
      field: 'pessoasCriticas',
      headerName: 'Pessoas críticas',
      flex: 1.5,
      minWidth: 240,
      sortable: false,
      renderCell: ({ row }) =>
        row.pessoasCriticas.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 'inherit' }}>
            Nenhuma
          </Typography>
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%', overflow: 'hidden' }}>
            {row.pessoasCriticas.map((c) => (
              <Chip key={c.id} label={c.nome} size="small" color="warning" variant="outlined" />
            ))}
          </Stack>
        ),
    },
    {
      field: 'acoes',
      type: 'actions',
      headerName: 'Ações',
      width: 130,
      getActions: ({ row }) => [
        <GridActionsCellItem key="membros" icon={<GroupsOutlinedIcon />} label="Ver colaboradores" onClick={() => setVendoMembros(row)} />,
        <GridActionsCellItem key="editar" icon={<EditOutlinedIcon />} label="Editar" onClick={() => setFormulario({ aberto: true, projeto: row })} />,
        <GridActionsCellItem key="excluir" icon={<DeleteOutlinedIcon />} label="Excluir" onClick={() => setExcluindo(row)} />,
      ],
    },
  ];

  const novoProjeto = () => setFormulario({ aberto: true, projeto: null });

  return (
    <>
      <PageHeader
        titulo="Projetos"
        subtitulo="Equipes e suas pessoas críticas, usadas na detecção de conflitos."
        acoes={
          <Button variant="contained" startIcon={<AddIcon />} onClick={novoProjeto}>
            Novo projeto
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
            htmlInput: { 'aria-label': 'Buscar projetos' },
          }}
        />
      </Box>

      <EstadoConsulta
        carregando={projetos.isPending}
        erro={projetos.error}
        onTentarNovamente={() => void projetos.refetch()}
        vazio={(projetos.data ?? []).length === 0}
        mensagemVazia="Nenhum projeto cadastrado."
        acaoVazia={
          <Button variant="contained" startIcon={<AddIcon />} onClick={novoProjeto}>
            Cadastrar projeto
          </Button>
        }
      >
        <TabelaDados
          rows={linhas}
          columns={colunas}
          localeText={{ noRowsLabel: 'Nenhum projeto corresponde à busca.' }}
          initialState={{ sorting: { sortModel: [{ field: 'nome', sort: 'asc' }] } }}
        />
      </EstadoConsulta>

      <ProjetoFormDialog
        aberto={formulario.aberto}
        projeto={formulario.projeto}
        onFechar={() => setFormulario({ aberto: false, projeto: null })}
      />
      <MembrosDialog projeto={vendoMembros} onFechar={() => setVendoMembros(null)} />
      <ConfirmDialog
        aberto={excluindo !== null}
        titulo="Excluir projeto?"
        mensagem={`O projeto ${excluindo?.nome ?? ''} será removido permanentemente.`}
        rotuloConfirmar="Excluir"
        cor="error"
        processando={excluir.isPending}
        onFechar={() => setExcluindo(null)}
        onConfirmar={() => excluindo && excluir.mutate(excluindo.id, { onSettled: () => setExcluindo(null) })}
      />
    </>
  );
}
