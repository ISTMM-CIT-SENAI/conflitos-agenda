import type { Periodo, Solicitacao } from './entities';
import { StatusSolicitacao } from './enums/statusSolicitacao';

/**
 * Solicitação à qual o Período pertence. Prefere a não Recusada, pois um
 * Período pode reaparecer em nova Solicitação depois de uma recusa.
 */
export function solicitacaoDoPeriodo(periodoId: number, solicitacoes: readonly Solicitacao[]): Solicitacao | null {
  const vinculadas = solicitacoes.filter((s) => s.periodos.some((p) => p.id === periodoId));
  return vinculadas.find((s) => s.status !== StatusSolicitacao.Recusada) ?? vinculadas[0] ?? null;
}

/** Períodos do colaborador que ainda podem entrar em uma Solicitação (excluindo a que está em edição). */
export function periodosDisponiveis(
  colaboradorId: number,
  periodos: readonly Periodo[],
  solicitacoes: readonly Solicitacao[],
  solicitacaoEmEdicaoId?: number,
): Periodo[] {
  return periodos.filter(
    (p) =>
      p.idColaborador === colaboradorId &&
      !solicitacoes.some(
        (s) =>
          s.id !== solicitacaoEmEdicaoId &&
          s.status !== StatusSolicitacao.Recusada &&
          s.periodos.some((x) => x.id === p.id),
      ),
  );
}
