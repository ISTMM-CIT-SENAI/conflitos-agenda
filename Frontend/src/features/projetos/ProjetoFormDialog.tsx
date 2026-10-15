import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useServicos } from '@/app/providers/useServicos';
import { aplicarErrosDoServico } from '@/components/forms/errosDoServico';
import { SeletorColaboradores } from '@/components/forms/SeletorColaborador';
import type { Projeto } from '@/domain/entities';
import { useColaboradores, useMutacao } from '@/hooks/useDados';

const esquema = z
  .object({
    nome: z.string().trim().min(1, 'Informe o nome do projeto.'),
    colaboradorIds: z.array(z.number()),
    pessoaCriticaIds: z.array(z.number()),
  })
  .refine((d) => d.pessoaCriticaIds.every((id) => d.colaboradorIds.includes(id)), {
    path: ['pessoaCriticaIds'],
    message: 'Pessoas críticas devem ser colaboradores do projeto.',
  });

type Formulario = z.infer<typeof esquema>;

interface ProjetoFormDialogProps {
  aberto: boolean;
  projeto?: Projeto | null;
  onFechar: () => void;
}

export function ProjetoFormDialog({ aberto, projeto, onFechar }: ProjetoFormDialogProps) {
  const servicos = useServicos();
  const colaboradores = useColaboradores();
  const edicao = Boolean(projeto);

  const { control, register, handleSubmit, reset, setError, setValue, getValues, formState } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: { nome: '', colaboradorIds: [], pessoaCriticaIds: [] },
  });

  useEffect(() => {
    if (!aberto) return;
    reset({
      nome: projeto?.nome ?? '',
      colaboradorIds: projeto?.colaboradores.map((c) => c.id) ?? [],
      pessoaCriticaIds: projeto?.pessoasCriticas.map((c) => c.id) ?? [],
    });
  }, [aberto, projeto, reset]);

  const colaboradorIds = useWatch({ control, name: 'colaboradorIds' });
  const membros = (colaboradores.data ?? []).filter((c) => colaboradorIds.includes(c.id));

  const salvar = useMutacao(
    (dados: Formulario) => (projeto ? servicos.projetos.atualizar(projeto.id, dados) : servicos.projetos.criar(dados)),
    { sucesso: edicao ? 'Projeto atualizado.' : 'Projeto criado.', errosDeCampoTratadosNaTela: true },
  );

  const enviar = handleSubmit((dados) =>
    salvar.mutate(dados, {
      onSuccess: onFechar,
      onError: (erro) => aplicarErrosDoServico(erro, setError, ['nome', 'colaboradorIds', 'pessoaCriticaIds']),
    }),
  );

  return (
    <Dialog open={aberto} onClose={salvar.isPending ? undefined : onFechar} maxWidth="sm" fullWidth>
      <form onSubmit={enviar} noValidate>
        <DialogTitle>{edicao ? 'Editar projeto' : 'Novo projeto'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField
              label="Nome"
              autoFocus
              required
              {...register('nome')}
              error={Boolean(formState.errors.nome)}
              helperText={formState.errors.nome?.message}
            />
            <Controller
              control={control}
              name="colaboradorIds"
              render={({ field, fieldState }) => (
                <SeletorColaboradores
                  rotulo="Colaboradores"
                  opcoes={colaboradores.data ?? []}
                  carregando={colaboradores.isPending}
                  valor={field.value}
                  onChange={(ids) => {
                    field.onChange(ids);
                    // Quem sai do projeto deixa de ser pessoa crítica dele.
                    setValue(
                      'pessoaCriticaIds',
                      getValues('pessoaCriticaIds').filter((id) => ids.includes(id)),
                    );
                  }}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="pessoaCriticaIds"
              render={({ field, fieldState }) => (
                <SeletorColaboradores
                  rotulo="Pessoas críticas"
                  opcoes={membros}
                  valor={field.value}
                  onChange={field.onChange}
                  erro={fieldState.error?.message}
                  ajuda={
                    membros.length === 0
                      ? 'Adicione colaboradores ao projeto para escolher as pessoas críticas.'
                      : 'Colaboradores cuja ausência simultânea gera conflito neste projeto.'
                  }
                  desabilitado={membros.length === 0}
                />
              )}
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
