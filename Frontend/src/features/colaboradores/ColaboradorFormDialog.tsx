import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useServicos } from '@/app/providers/useServicos';
import { aplicarErrosDoServico } from '@/components/forms/errosDoServico';
import type { Colaborador } from '@/domain/entities';
import { useMutacao } from '@/hooks/useDados';

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.'),
  email: z.string().trim().min(1, 'Informe o e-mail.').pipe(z.email('Informe um e-mail válido.')),
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
  const edicao = Boolean(colaborador);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: { nome: '', email: '' } });

  useEffect(() => {
    if (aberto) reset({ nome: colaborador?.nome ?? '', email: colaborador?.email ?? '' });
  }, [aberto, colaborador, reset]);

  const salvar = useMutacao(
    (dados: Formulario) =>
      colaborador ? servicos.colaboradores.atualizar(colaborador.id, dados) : servicos.colaboradores.criar(dados),
    { sucesso: edicao ? 'Colaborador atualizado.' : 'Colaborador criado.', errosDeCampoTratadosNaTela: true },
  );

  const enviar = handleSubmit((dados) =>
    salvar.mutate(dados, {
      onSuccess: onFechar,
      onError: (erro) => aplicarErrosDoServico(erro, setError, ['nome', 'email']),
    }),
  );

  return (
    <Dialog open={aberto} onClose={salvar.isPending ? undefined : onFechar} maxWidth="sm" fullWidth>
      <form onSubmit={enviar} noValidate>
        <DialogTitle>{edicao ? 'Editar colaborador' : 'Novo colaborador'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Nome"
              autoFocus
              {...register('nome')}
              error={Boolean(errors.nome)}
              helperText={errors.nome?.message}
              required
            />
            <TextField
              label="E-mail"
              type="email"
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              required
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onFechar} disabled={salvar.isPending}>
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
