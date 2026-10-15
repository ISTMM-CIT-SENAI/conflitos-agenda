import type { Colaborador, Periodo, Projeto, Solicitacao } from '../entities';
import { StatusSolicitacao } from '../enums/statusSolicitacao';
import { intervaloDoPeriodo, seSobrepoem } from './periodo';

export interface Conflito {
  solicitacaoId: number;
  periodo: Periodo;
  outraSolicitacaoId: number;
  outroPeriodo: Periodo;
  pessoaCritica: Colaborador;
  projeto: Projeto;
}

function participaDoProjeto(colaboradorId: number, projeto: Projeto): boolean {
  return (
    projeto.colaboradores.some((c) => c.id === colaboradorId) ||
    projeto.pessoasCriticas.some((c) => c.id === colaboradorId)
  );
}

/**
 * Conflito: um Período da Solicitação se sobrepõe a um Período de outra
 * Solicitação, não Recusada, de uma Pessoa Crítica de um Projeto do qual o
 * solicitante participa.
 */
export function detectarConflitos(
  alvo: Solicitacao,
  todas: readonly Solicitacao[],
  projetos: readonly Projeto[],
): Conflito[] {
  const solicitanteId = alvo.colaborador.id;
  const conflitos: Conflito[] = [];

  for (const projeto of projetos) {
    if (!participaDoProjeto(solicitanteId, projeto)) continue;

    for (const pessoaCritica of projeto.pessoasCriticas) {
      if (pessoaCritica.id === solicitanteId) continue;

      const outras = todas.filter(
        (s) =>
          s.id !== alvo.id &&
          s.colaborador.id === pessoaCritica.id &&
          s.status !== StatusSolicitacao.Recusada,
      );

      for (const outra of outras) {
        for (const periodo of alvo.periodos) {
          for (const outroPeriodo of outra.periodos) {
            if (seSobrepoem(intervaloDoPeriodo(periodo), intervaloDoPeriodo(outroPeriodo))) {
              conflitos.push({
                solicitacaoId: alvo.id,
                periodo,
                outraSolicitacaoId: outra.id,
                outroPeriodo,
                pessoaCritica,
                projeto,
              });
            }
          }
        }
      }
    }
  }
  return conflitos;
}

export function mensagemDeConflito(conflitos: readonly Conflito[]): string {
  const descricoes = [
    ...new Set(conflitos.map((c) => `${c.pessoaCritica.nome} (projeto ${c.projeto.nome})`)),
  ];
  return `Conflito com a ausência de pessoa crítica: ${descricoes.join(', ')}.`;
}
