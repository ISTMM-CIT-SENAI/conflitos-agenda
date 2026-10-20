import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Link,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';
import { z } from 'zod';
import { useServicos } from '@/app/providers/useServicos';
import { aplicarErrosDoServico } from '@/components/forms/errosDoServico';
import { validarNomeUsuario, validarSenha } from '@/domain/acesso';
import type { Colaborador } from '@/domain/entities';
import { useMutacao, useUsuarios } from '@/hooks/useDados';
import { ErroServico, mensagemDeErro } from '@/services/erros';
import { CamposAcesso } from '../usuarios/CamposAcesso';
import { ACESSO_VAZIO, errosDeValoresAcesso, type ErrosAcesso, type ValoresAcesso } from '../usuarios/valoresAcesso';

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome completo.').max(150, 'O nome deve ter no máximo 150 caracteres.'),
});

type Formulario = z.infer<typeof esquema>;

interface ColaboradorFormDialogProps {
  aberto: boolean;
  /** Quando informado, o formulário edita este colaborador. */
  colaborador?: Colaborador | null;
  onFechar: () => void;
}

export function ColaboradorFormDialog({ aberto, colaborador, onFechar }: ColaboradorFormDialogProps) {
  const servicos = useServicos();
  const usuarios = useUsuarios();
  const edicao = Boolean(colaborador);
  const conta = colaborador ? usuarios.data?.find((u) => u.colaborador.id === colaborador.id) : undefined;

  const [criarAcesso, setCriarAcesso] = useState(false);
  const [acesso, setAcesso] = useState<ValoresAcesso>(ACESSO_VAZIO);
  const [errosAcesso, setErrosAcesso] = useState<ErrosAcesso>({});

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: { nome: '' } });

  useEffect(() => {
    if (!aberto) return;
    reset({ nome: colaborador?.nome ?? '' });
  }, [aberto, colaborador, reset]);

  /** Limpa a seção de acesso ao fechar, para o diálogo reabrir vazio. */
  const fechar = () => {
    setCriarAcesso(false);
    setAcesso(ACESSO_VAZIO);
    setErrosAcesso({});
    onFechar();
  };

  const salvar = useMutacao(
    async (dados: Formulario) => {
      const salvo = colaborador
        ? await servicos.colaboradores.atualizar(colaborador.id, dados)
        : await servicos.colaboradores.criar(dados);
      if (criarAcesso) {
        try {
          await servicos.usuarios.criar({ colaboradorId: salvo.id, ...acesso });
        } catch (erro) {
          throw new ErroServico(
            `Colaborador salvo, mas o acesso não foi criado: ${mensagemDeErro(erro)} Crie o acesso na tela Usuários.`,
          );
        }
      }
      return salvo;
    },
    {
      sucesso: criarAcesso
        ? 'Colaborador salvo e acesso criado. Entregue a senha temporária à pessoa.'
        : edicao
          ? 'Colaborador atualizado.'
          : 'Colaborador criado.',
      errosDeCampoTratadosNaTela: true,
    },
  );

  const enviar = handleSubmit((dados) => {
    if (criarAcesso) {
      const problemas = errosDeValoresAcesso(acesso, validarNomeUsuario, validarSenha);
      const nomeEmUso = usuarios.data?.some((u) => u.nomeUsuario.toLowerCase() === acesso.nomeUsuario.trim().toLowerCase());
      if (nomeEmUso) problemas.nomeUsuario = 'Este nome de usuário já está em uso.';
      setErrosAcesso(problemas);
      if (Object.keys(problemas).length > 0) return;
    }
    salvar.mutate(dados, {
      onSuccess: fechar,
      onError: (erro) => {
        aplicarErrosDoServico(erro, setError, ['nome']);
        // O colaborador foi salvo mesmo que o acesso tenha falhado: fecha para evitar duplicá-lo.
        if (erro instanceof ErroServico && erro.message.startsWith('Colaborador salvo')) fechar();
      },
    });
  });

  return (
    <Dialog open={aberto} onClose={salvar.isPending ? undefined : fechar} maxWidth="sm" fullWidth>
      <form onSubmit={enviar} noValidate>
        <DialogTitle>{edicao ? 'Editar colaborador' : 'Novo colaborador'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nome completo"
              autoFocus
              {...register('nome')}
              error={Boolean(errors.nome)}
              helperText={errors.nome?.message ?? 'Identifica o colaborador no sistema; não pode se repetir.'}
              required
            />

            <Divider />
            <Typography variant="subtitle2">Acesso ao sistema</Typography>
            {conta ? (
              <Alert severity="info">
                Usuário <strong>{conta.nomeUsuario}</strong>
                {conta.ativo ? '' : ' (desativado)'}. Para redefinir a senha ou desativar, use a tela{' '}
                <Link component={RouterLink} to="/usuarios">
                  Usuários
                </Link>
                .
              </Alert>
            ) : (
              <>
                <FormControlLabel
                  control={<Switch checked={criarAcesso} onChange={(e) => setCriarAcesso(e.target.checked)} />}
                  label="Criar acesso para este colaborador"
                />
                {criarAcesso ? (
                  <CamposAcesso valores={acesso} erros={errosAcesso} onChange={setAcesso} desabilitado={salvar.isPending} />
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Sem acesso, o colaborador não entra no sistema; as ausências dele são lançadas por um administrador.
                  </Typography>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fechar} disabled={salvar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={salvar.isPending}>
            Salvar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
