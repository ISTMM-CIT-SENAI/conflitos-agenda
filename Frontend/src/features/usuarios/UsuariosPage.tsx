import AddIcon from '@mui/icons-material/Add';
import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material';
import { GridActionsCellItem, type GridColDef } from '@mui/x-data-grid';
import { useMemo, useState } from 'react';
import { useServicos } from '@/app/providers/useServicos';
import { useUsuarioLogado } from '@/app/providers/useSessao';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { EstadoConsulta } from '@/components/feedback/EstadoConsulta';
import { SeletorColaborador } from '@/components/forms/SeletorColaborador';
import { TabelaDados } from '@/components/tables/TabelaDados';
import { ROTULO_NIVEL, TAMANHO_MINIMO_SENHA, validarNomeUsuario, validarSenha } from '@/domain/acesso';
import type { ContaUsuario } from '@/domain/entities';
import { useColaboradores, useMutacao, useUsuarios } from '@/hooks/useDados';
import { ErroRegraNegocio } from '@/services/erros';
import { CamposAcesso } from './CamposAcesso';
import { ACESSO_VAZIO, errosDeValoresAcesso, type ErrosAcesso, type ValoresAcesso } from './valoresAcesso';

function situacao(conta: ContaUsuario) {
  if (!conta.ativo) return <Chip label="Desativado" size="small" />;
  if (conta.bloqueado) return <Chip label="Bloqueado" size="small" color="error" variant="outlined" />;
  if (conta.precisaTrocarSenha) return <Chip label="Troca de senha pendente" size="small" color="warning" variant="outlined" />;
  return <Chip label="Ativo" size="small" color="success" variant="outlined" />;
}

function NovoAcessoDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const servicos = useServicos();
  const colaboradores = useColaboradores();
  const usuarios = useUsuarios();
  const [colaboradorId, setColaboradorId] = useState<number | null>(null);
  const [valores, setValores] = useState<ValoresAcesso>(ACESSO_VAZIO);
  const [erros, setErros] = useState<ErrosAcesso & { colaboradorId?: string }>({});

  const semAcesso = (colaboradores.data ?? []).filter((c) => !(usuarios.data ?? []).some((u) => u.colaborador.id === c.id));
  const criar = useMutacao(
    () =>
      servicos.usuarios.criar({ colaboradorId: colaboradorId ?? 0, ...valores }),
    { sucesso: (conta) => `Acesso "${conta.nomeUsuario}" criado.`, errosDeCampoTratadosNaTela: true },
  );

  const fechar = () => {
    setColaboradorId(null);
    setValores(ACESSO_VAZIO);
    setErros({});
    onFechar();
  };

  const enviar = () => {
    const novosErros = { ...errosDeValoresAcesso(valores, validarNomeUsuario, validarSenha), ...(colaboradorId === null ? { colaboradorId: 'Selecione o colaborador.' } : {}) };
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;
    criar.mutate(undefined, {
      onSuccess: fechar,
      onError: (erro) => {
        if (erro instanceof ErroRegraNegocio) {
          setErros(Object.fromEntries(erro.violacoes.filter((v) => v.campo).map((v) => [v.campo, v.mensagem])));
        }
      },
    });
  };

  return (
    <Dialog open={aberto} onClose={criar.isPending ? undefined : fechar} maxWidth="sm" fullWidth>
      <DialogTitle>Novo acesso ao sistema</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <SeletorColaborador
            rotulo="Colaborador"
            opcoes={semAcesso}
            valor={colaboradorId}
            onChange={setColaboradorId}
            erro={erros.colaboradorId}
            ajuda="Somente colaboradores que ainda não têm acesso. Para cadastrar uma pessoa nova, use a tela Colaboradores."
            carregando={colaboradores.isPending}
          />
          <CamposAcesso valores={valores} erros={erros} onChange={setValores} desabilitado={criar.isPending} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fechar} disabled={criar.isPending}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={enviar} loading={criar.isPending}>
          Criar acesso
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RedefinirSenhaDialog({ conta, onFechar }: { conta: ContaUsuario | null; onFechar: () => void }) {
  const servicos = useServicos();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const redefinir = useMutacao((s: string) => servicos.usuarios.redefinirSenha(conta?.id ?? 0, s), {
    sucesso: (c) => `Senha de "${c.nomeUsuario}" redefinida. Entregue a senha temporária à pessoa.`,
  });

  const fechar = () => {
    setSenha('');
    setErro(null);
    onFechar();
  };

  return (
    <Dialog open={conta !== null} onClose={redefinir.isPending ? undefined : fechar} maxWidth="xs" fullWidth>
      <DialogTitle>Redefinir senha</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Defina uma senha temporária para <strong>{conta?.nomeUsuario}</strong> ({conta?.colaborador.nome}). No próximo
          login, a pessoa será obrigada a criar uma nova senha.
        </DialogContentText>
        <TextField
          label="Senha temporária"
          autoFocus
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            setErro(null);
          }}
          error={Boolean(erro)}
          helperText={erro ?? `Mínimo de ${TAMANHO_MINIMO_SENHA} caracteres.`}
          autoComplete="new-password"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={fechar} disabled={redefinir.isPending}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          loading={redefinir.isPending}
          onClick={() => {
            const problema = validarSenha(senha);
            if (problema) setErro(problema);
            else redefinir.mutate(senha, { onSuccess: fechar });
          }}
        >
          Redefinir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

type Confirmacao = { conta: ContaUsuario; acao: 'desativar' | 'reativar' | 'tornarAdmin' | 'removerAdmin' } | null;

export function UsuariosPage() {
  const servicos = useServicos();
  const eu = useUsuarioLogado();
  const usuarios = useUsuarios();
  const [criando, setCriando] = useState(false);
  const [redefinindo, setRedefinindo] = useState<ContaUsuario | null>(null);
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null);

  const executar = useMutacao(
    ({ conta, acao }: NonNullable<Confirmacao>) => {
      switch (acao) {
        case 'desativar':
          return servicos.usuarios.desativar(conta.id);
        case 'reativar':
          return servicos.usuarios.reativar(conta.id);
        case 'tornarAdmin':
          return servicos.usuarios.definirAdministrador(conta.id, true);
        case 'removerAdmin':
          return servicos.usuarios.definirAdministrador(conta.id, false);
      }
    },
    { sucesso: 'Acesso atualizado.' },
  );

  const textos = useMemo(
    () => ({
      desativar: { titulo: 'Desativar acesso?', mensagem: 'A pessoa não conseguirá mais entrar. O histórico dela é preservado e o acesso pode ser reativado depois.', botao: 'Desativar', cor: 'error' as const },
      reativar: { titulo: 'Reativar acesso?', mensagem: 'A pessoa voltará a entrar com a senha atual.', botao: 'Reativar', cor: 'primary' as const },
      tornarAdmin: { titulo: 'Tornar administrador?', mensagem: 'A pessoa terá acesso total ao sistema.', botao: 'Tornar administrador', cor: 'warning' as const },
      removerAdmin: { titulo: 'Remover administrador?', mensagem: 'A pessoa passará a ter o acesso de coordenador ou de colaborador, conforme o cadastro.', botao: 'Remover', cor: 'warning' as const },
    }),
    [],
  );

  const colunas: GridColDef<ContaUsuario>[] = [
    { field: 'nomeUsuario', headerName: 'Usuário', flex: 1, minWidth: 140 },
    { field: 'colaborador', headerName: 'Colaborador', flex: 1.3, minWidth: 180, valueGetter: (_, row) => row.colaborador.nome },
    {
      field: 'nivel',
      headerName: 'Nível de acesso',
      width: 160,
      valueGetter: (_, row) => ROTULO_NIVEL[row.nivel],
      renderCell: ({ row }) =>
        row.isAdministrador ? (
          <Chip icon={<AdminPanelSettingsOutlinedIcon />} label="Administrador" size="small" color="primary" variant="outlined" />
        ) : (
          ROTULO_NIVEL[row.nivel]
        ),
    },
    { field: 'situacao', headerName: 'Situação', width: 210, sortable: false, renderCell: ({ row }) => situacao(row) },
    {
      field: 'acoes',
      type: 'actions',
      headerName: 'Ações',
      width: 140,
      getActions: ({ row }) => {
        const souEu = row.id === eu.id;
        return [
          <GridActionsCellItem key="senha" icon={<KeyOutlinedIcon />} label="Redefinir senha" onClick={() => setRedefinindo(row)} />,
          <GridActionsCellItem
            key="admin"
            icon={<AdminPanelSettingsOutlinedIcon />}
            label={row.isAdministrador ? 'Remover administrador' : 'Tornar administrador'}
            disabled={souEu}
            onClick={() => setConfirmacao({ conta: row, acao: row.isAdministrador ? 'removerAdmin' : 'tornarAdmin' })}
          />,
          row.ativo ? (
            <GridActionsCellItem
              key="ativo"
              icon={<BlockOutlinedIcon />}
              label={souEu ? 'Você não pode desativar o próprio acesso' : 'Desativar'}
              disabled={souEu}
              onClick={() => setConfirmacao({ conta: row, acao: 'desativar' })}
            />
          ) : (
            <GridActionsCellItem key="ativo" icon={<LockOpenOutlinedIcon />} label="Reativar" onClick={() => setConfirmacao({ conta: row, acao: 'reativar' })} />
          ),
        ];
      },
    },
  ];

  const texto = confirmacao ? textos[confirmacao.acao] : null;

  return (
    <>
      <PageHeader
        titulo="Usuários"
        subtitulo="Contas de acesso ao sistema. Cada usuário pertence a um colaborador."
        acoes={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCriando(true)}>
            Novo acesso
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        O nível de acesso de quem não é administrador vem do cadastro do colaborador: coordenadores têm acesso de
        coordenador; os demais, de colaborador. Esqueceu a senha? Use “Redefinir senha” e entregue a senha temporária à pessoa.
      </Alert>

      <EstadoConsulta
        carregando={usuarios.isPending}
        erro={usuarios.error}
        onTentarNovamente={() => void usuarios.refetch()}
        vazio={(usuarios.data ?? []).length === 0}
        mensagemVazia="Nenhum usuário cadastrado."
      >
        <TabelaDados rows={usuarios.data ?? []} columns={colunas} initialState={{ sorting: { sortModel: [{ field: 'nomeUsuario', sort: 'asc' }] } }} />
      </EstadoConsulta>

      <NovoAcessoDialog aberto={criando} onFechar={() => setCriando(false)} />
      <RedefinirSenhaDialog conta={redefinindo} onFechar={() => setRedefinindo(null)} />
      <ConfirmDialog
        aberto={confirmacao !== null}
        titulo={texto?.titulo ?? ''}
        mensagem={confirmacao ? `${confirmacao.conta.nomeUsuario} (${confirmacao.conta.colaborador.nome}): ${texto?.mensagem}` : ''}
        rotuloConfirmar={texto?.botao}
        cor={texto?.cor}
        processando={executar.isPending}
        onFechar={() => setConfirmacao(null)}
        onConfirmar={() => confirmacao && executar.mutate(confirmacao, { onSettled: () => setConfirmacao(null) })}
      />
    </>
  );
}
