import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useServicos } from '@/app/providers/useServicos';
import { useFeedback } from '@/components/feedback/useFeedback';
import { ErroRegraNegocio, mensagemDeErro } from '@/services/erros';

/** Chaves de cache. Toda mutação invalida a raiz, pois as entidades se afetam mutuamente. */
export const chaves = {
  raiz: ['dados'] as const,
  colaboradores: ['dados', 'colaboradores'] as const,
  projetos: ['dados', 'projetos'] as const,
  periodos: ['dados', 'periodos'] as const,
  solicitacoes: ['dados', 'solicitacoes'] as const,
  solicitacao: (id: number) => ['dados', 'solicitacoes', id] as const,
};

export function useColaboradores() {
  const { colaboradores } = useServicos();
  return useQuery({ queryKey: chaves.colaboradores, queryFn: () => colaboradores.listar() });
}

export function useProjetos() {
  const { projetos } = useServicos();
  return useQuery({ queryKey: chaves.projetos, queryFn: () => projetos.listar() });
}

export function usePeriodos() {
  const { periodos } = useServicos();
  return useQuery({ queryKey: chaves.periodos, queryFn: () => periodos.listar() });
}

export function useSolicitacoes() {
  const { solicitacoes } = useServicos();
  return useQuery({ queryKey: chaves.solicitacoes, queryFn: () => solicitacoes.listar() });
}

export function useSolicitacao(id: number) {
  const { solicitacoes } = useServicos();
  return useQuery({ queryKey: chaves.solicitacao(id), queryFn: () => solicitacoes.buscarPorId(id) });
}

interface OpcoesMutacao<TResultado> {
  /** Mensagem do toast de sucesso; string fixa ou derivada do resultado. */
  sucesso?: string | ((resultado: TResultado) => string);
  /**
   * Quando o formulário trata erros de campo (violações com `campo`), passe
   * `true` para não duplicar a mensagem no toast.
   */
  errosDeCampoTratadosNaTela?: boolean;
}

/**
 * Mutação padrão: desabilita botões via `isPending`, atualiza as listagens e
 * mostra o feedback global de sucesso ou erro.
 */
export function useMutacao<TVariaveis, TResultado>(
  executar: (variaveis: TVariaveis) => Promise<TResultado>,
  { sucesso, errosDeCampoTratadosNaTela = false }: OpcoesMutacao<TResultado> = {},
) {
  const queryClient = useQueryClient();
  const feedback = useFeedback();

  return useMutation({
    mutationFn: executar,
    onSuccess: async (resultado) => {
      await queryClient.invalidateQueries({ queryKey: chaves.raiz });
      if (sucesso) feedback.sucesso(typeof sucesso === 'function' ? sucesso(resultado) : sucesso);
    },
    onError: (erro) => {
      const tratadoNaTela =
        errosDeCampoTratadosNaTela && erro instanceof ErroRegraNegocio && erro.violacoes.some((v) => v.campo);
      if (!tratadoNaTela) feedback.erro(mensagemDeErro(erro));
    },
  });
}
