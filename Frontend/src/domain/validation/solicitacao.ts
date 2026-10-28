import type { Periodo, Projeto, Solicitacao } from '../entities';
import { StatusSolicitacao } from '../enums/statusSolicitacao';
import { DURACAO_MINIMA_DIAS, duracaoDoPeriodo } from './periodo';

/** CLT, art. 134: até 3 períodos no ano, um com pelo menos 14 dias, os demais com pelo menos 5. */
export const MIN_PERIODOS = 1;
export const MAX_PERIODOS = 3;
export const MIN_DIAS_PERIODO_PRINCIPAL = 14;
export const DIAS_FERIAS = 30;
/** CLT, art. 143: com abono pecuniário, 1/3 das férias (10 dias) é vendido. */
export const DIAS_FERIAS_COM_ABONO = 20;

export interface ViolacaoRegra {
  campo: 'periodoIds' | 'abono';
  mensagem: string;
}

/** Total de Dias é sempre derivado dos Períodos, nunca informado. */
export function calcularTotalDias(periodos: readonly Periodo[]): number {
  return periodos.reduce((total, periodo) => total + duracaoDoPeriodo(periodo), 0);
}

/** Regras de um pedido isolado: de 1 a 3 períodos, cada um com pelo menos 5 dias. */
export function validarRegrasSolicitacao({ duracoes }: { duracoes: readonly number[] }): ViolacaoRegra[] {
  if (duracoes.length < MIN_PERIODOS || duracoes.length > MAX_PERIODOS) {
    return [{ campo: 'periodoIds', mensagem: `A solicitação deve conter de ${MIN_PERIODOS} a ${MAX_PERIODOS} períodos.` }];
  }
  if (duracoes.some((d) => d < DURACAO_MINIMA_DIAS)) {
    return [{ campo: 'periodoIds', mensagem: `Cada período deve ter no mínimo ${DURACAO_MINIMA_DIAS} dias.` }];
  }
  return [];
}

/** Violações de uma Solicitação já salva (ex.: dados antigos gravados antes das regras). */
export function violacoesDaSolicitacao(solicitacao: Solicitacao): ViolacaoRegra[] {
  return validarRegrasSolicitacao({ duracoes: solicitacao.periodos.map(duracaoDoPeriodo) });
}

/** Ano civil das férias: o do primeiro dia de ausência. */
export function anoReferencia(periodos: readonly Periodo[]): number {
  return Number(periodos.map((p) => p.dataInicio).sort()[0].slice(0, 4));
}

export interface SaldoDoAno {
  ano: number;
  /** Dias das outras solicitações não recusadas do mesmo ano. */
  diasAnteriores: number;
  diasDoPedido: number;
  limite: number;
  comAbono: boolean;
  restam: number;
  /** Nenhum período de 14 dias foi pedido no ano, contando este pedido. */
  faltaPeriodoPrincipal: boolean;
  violacoes: ViolacaoRegra[];
}

/**
 * Saldo das férias do ano com este pedido, como `RegrasFerias.ValidarFeriasDoAno` na API: no ano,
 * no máximo 3 períodos e 30 dias (20 se alguma solicitação tiver abono), e ainda precisa caber um
 * período de 14 dias se nenhum foi pedido. Recusadas não contam. `null` sem períodos.
 */
export function saldoDoAno(
  solicitacoes: readonly Solicitacao[],
  colaboradorId: number,
  periodos: readonly Periodo[],
  abono: boolean,
  ignorarId?: number,
): SaldoDoAno | null {
  if (periodos.length === 0) return null;
  const ano = anoReferencia(periodos);
  const outras = solicitacoes.filter(
    (s) =>
      s.id !== ignorarId &&
      s.colaborador.id === colaboradorId &&
      s.status !== StatusSolicitacao.Recusada &&
      s.periodos.length > 0 &&
      anoReferencia(s.periodos) === ano,
  );
  const duracoes = [...outras.flatMap((s) => s.periodos), ...periodos].map(duracaoDoPeriodo);
  const comAbono = abono || outras.some((s) => s.abono);
  const limite = comAbono ? DIAS_FERIAS_COM_ABONO : DIAS_FERIAS;
  const total = duracoes.reduce((soma, d) => soma + d, 0);
  const faltaPeriodoPrincipal = Math.max(...duracoes) < MIN_DIAS_PERIODO_PRINCIPAL;

  const violacoes: ViolacaoRegra[] = [];
  if (duracoes.length > MAX_PERIODOS) {
    violacoes.push({
      campo: 'periodoIds',
      mensagem: `Seriam ${duracoes.length} períodos de férias em ${ano}: a CLT permite no máximo ${MAX_PERIODOS}.`,
    });
  }
  if (total > limite) {
    violacoes.push({
      campo: comAbono ? 'abono' : 'periodoIds',
      mensagem: `Seriam ${total} dias de férias em ${ano}: o limite é ${limite}${comAbono ? ' (com abono)' : ''}.`,
    });
  } else if (faltaPeriodoPrincipal && (limite - total < MIN_DIAS_PERIODO_PRINCIPAL || duracoes.length >= MAX_PERIODOS)) {
    violacoes.push({
      campo: 'periodoIds',
      mensagem: `Um dos períodos de ${ano} precisa ter no mínimo ${MIN_DIAS_PERIODO_PRINCIPAL} dias, e com este pedido não sobraria espaço para ele.`,
    });
  }
  return {
    ano,
    diasAnteriores: total - calcularTotalDias(periodos),
    diasDoPedido: calcularTotalDias(periodos),
    limite,
    comAbono,
    restam: limite - total,
    faltaPeriodoPrincipal,
    violacoes,
  };
}

export function isPessoaCriticaEmAlgumProjeto(colaboradorId: number, projetos: readonly Projeto[]): boolean {
  return projetos.some((projeto) => projeto.pessoasCriticas.some((pessoa) => pessoa.id === colaboradorId));
}
