import type { Periodo, Projeto, Solicitacao } from '../entities';
import { duracaoDoPeriodo } from './periodo';

export const MIN_PERIODOS = 1;
export const MAX_PERIODOS = 3;
export const MAX_PERIODOS_ABONO = 2;
export const MAX_DIAS_ABONO = 20;

export interface RegrasSolicitacaoInput {
  quantidadePeriodos: number;
  totalDias: number;
  abono: boolean;
}

export interface ViolacaoRegra {
  campo: 'periodoIds' | 'abono';
  mensagem: string;
}

/** Total de Dias é sempre derivado dos Períodos, nunca informado. */
export function calcularTotalDias(periodos: readonly Periodo[]): number {
  return periodos.reduce((total, periodo) => total + duracaoDoPeriodo(periodo), 0);
}

/** Regras de quantidade de Períodos e de Abono, as mesmas aplicadas pelo service da API. */
export function validarRegrasSolicitacao({
  quantidadePeriodos,
  totalDias,
  abono,
}: RegrasSolicitacaoInput): ViolacaoRegra[] {
  const violacoes: ViolacaoRegra[] = [];

  if (quantidadePeriodos < MIN_PERIODOS || quantidadePeriodos > MAX_PERIODOS) {
    violacoes.push({
      campo: 'periodoIds',
      mensagem: `A solicitação deve conter de ${MIN_PERIODOS} a ${MAX_PERIODOS} períodos.`,
    });
  }
  if (abono && quantidadePeriodos > MAX_PERIODOS_ABONO) {
    violacoes.push({
      campo: 'abono',
      mensagem: `Solicitações de abono podem conter no máximo ${MAX_PERIODOS_ABONO} períodos.`,
    });
  }
  if (abono && totalDias > MAX_DIAS_ABONO) {
    violacoes.push({
      campo: 'abono',
      mensagem: `Solicitações de abono podem somar no máximo ${MAX_DIAS_ABONO} dias (atual: ${totalDias}).`,
    });
  }
  return violacoes;
}

/** Violações de uma Solicitação já salva (ex.: dados antigos gravados antes das regras). */
export function violacoesDaSolicitacao(solicitacao: Solicitacao): ViolacaoRegra[] {
  return validarRegrasSolicitacao({
    quantidadePeriodos: solicitacao.periodos.length,
    totalDias: calcularTotalDias(solicitacao.periodos),
    abono: solicitacao.abono,
  });
}

export function isPessoaCriticaEmAlgumProjeto(colaboradorId: number, projetos: readonly Projeto[]): boolean {
  return projetos.some((projeto) => projeto.pessoasCriticas.some((pessoa) => pessoa.id === colaboradorId));
}
