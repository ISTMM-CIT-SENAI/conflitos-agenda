import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useServicos } from '@/app/providers/useServicos';
import { CampoData } from '@/components/forms/CampoData';
import { aplicarErrosDoServico } from '@/components/forms/errosDoServico';
import { SeletorColaborador } from '@/components/forms/SeletorColaborador';
import type { Periodo } from '@/domain/entities';
import {
  DURACAO_MAXIMA_DIAS,
  DURACAO_MINIMA_DIAS,
  duracaoEmDias,
  intervaloDoPeriodo,
  validarIntervalo,
} from '@/domain/validation/periodo';
import { useColaboradores, useMutacao } from '@/hooks/useDados';
import { isDataISO } from '@/lib/datas';
import { plural } from '@/lib/texto';
import { descreverAusencia } from './formatacao';

const esquema = z
  .object({
    idColaborador: z.number({ error: 'Selecione um colaborador.' }).nullable().refine((v) => v !== null, 'Selecione um colaborador.'),
    dataInicio: z.string().refine(isDataISO, 'Informe a data de início.'),
    dataFim: z.string().refine(isDataISO, 'Informe a data de retorno.'),
  })
  .superRefine((dados, ctx) => {
    if (!isDataISO(dados.dataInicio) || !isDataISO(dados.dataFim)) return;
    for (const mensagem of validarIntervalo({ inicio: dados.dataInicio, retorno: dados.dataFim })) {
      ctx.addIssue({ code: 'custom', path: ['dataFim'], message: mensagem });
    }
  });

type Formulario = z.input<typeof esquema>;

interface PeriodoFormDialogProps {
  aberto: boolean;
  periodo?: Periodo | null;
  /** Colaborador pré-selecionado ao criar a partir de outra tela. */
  colaboradorIdInicial?: number | null;
  /** Períodos que já fazem parte de uma solicitação não podem trocar de colaborador. */
  colaboradorBloqueado?: boolean;
  onFechar: () => void;
  onSalvo?: (periodo: Periodo) => void;
}

export function PeriodoFormDialog({
  aberto,
  periodo,
  colaboradorIdInicial = null,
  colaboradorBloqueado = false,
  onFechar,
  onSalvo,
}: PeriodoFormDialogProps) {
  const servicos = useServicos();
  const colaboradores = useColaboradores();
  const edicao = Boolean(periodo);

  const { control, handleSubmit, reset, setError } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: { idColaborador: null, dataInicio: '', dataFim: '' },
  });

  useEffect(() => {
    if (!aberto) return;
    const intervalo = periodo ? intervaloDoPeriodo(periodo) : null;
    reset({
      idColaborador: periodo?.idColaborador ?? colaboradorIdInicial,
      dataInicio: intervalo?.inicio ?? '',
      dataFim: intervalo?.retorno ?? '',
    });
  }, [aberto, periodo, colaboradorIdInicial, reset]);

  const [dataInicio, dataFim] = useWatch({ control, name: ['dataInicio', 'dataFim'] });
  const intervaloValido =
    isDataISO(dataInicio) && isDataISO(dataFim) && validarIntervalo({ inicio: dataInicio, retorno: dataFim }).length === 0;

  const salvar = useMutacao(
    (input: { idColaborador: number; dataInicio: string; dataFim: string }) =>
      periodo ? servicos.periodos.atualizar(periodo.id, input) : servicos.periodos.criar(input),
    { sucesso: edicao ? 'Período atualizado.' : 'Período criado.', errosDeCampoTratadosNaTela: true },
  );

  const enviar = handleSubmit((dados) => {
    if (dados.idColaborador === null) return;
    salvar.mutate(
      { idColaborador: dados.idColaborador, dataInicio: dados.dataInicio, dataFim: dados.dataFim },
      {
        onSuccess: (salvo) => {
          onSalvo?.(salvo);
          onFechar();
        },
        onError: (erro) => aplicarErrosDoServico(erro, setError, ['idColaborador', 'dataInicio', 'dataFim']),
      },
    );
  });

  return (
    <Dialog open={aberto} onClose={salvar.isPending ? undefined : onFechar} maxWidth="sm" fullWidth>
      <form onSubmit={enviar} noValidate>
        <DialogTitle>{edicao ? 'Editar período' : 'Novo período'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Controller
              control={control}
              name="idColaborador"
              render={({ field, fieldState }) => (
                <SeletorColaborador
                  rotulo="Colaborador"
                  opcoes={colaboradores.data ?? []}
                  carregando={colaboradores.isPending}
                  valor={field.value}
                  onChange={field.onChange}
                  erro={fieldState.error?.message}
                  desabilitado={colaboradorBloqueado}
                  ajuda={colaboradorBloqueado && periodo ? 'O período já faz parte de uma solicitação.' : undefined}
                />
              )}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                control={control}
                name="dataInicio"
                render={({ field, fieldState }) => (
                  <CampoData
                    rotulo="Início"
                    valor={field.value}
                    onChange={field.onChange}
                    erro={fieldState.error?.message}
                    ajuda="Primeiro dia de ausência"
                  />
                )}
              />
              <Controller
                control={control}
                name="dataFim"
                render={({ field, fieldState }) => (
                  <CampoData
                    rotulo="Retorno"
                    valor={field.value}
                    onChange={field.onChange}
                    erro={fieldState.error?.message}
                    ajuda="Dia em que o colaborador volta"
                    minimo={isDataISO(dataInicio) ? dataInicio : undefined}
                  />
                )}
              />
            </Stack>
            {intervaloValido ? (
              <Alert severity="success" variant="outlined">
                Ausência de {descreverAusencia({ inicio: dataInicio, retorno: dataFim })} —{' '}
                {plural(duracaoEmDias({ inicio: dataInicio, retorno: dataFim }), 'dia', 'dias')}.
              </Alert>
            ) : (
              <Alert severity="info" variant="outlined">
                O período deve ter entre {DURACAO_MINIMA_DIAS} e {DURACAO_MAXIMA_DIAS} dias. O dia de retorno não conta como ausência.
              </Alert>
            )}
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
