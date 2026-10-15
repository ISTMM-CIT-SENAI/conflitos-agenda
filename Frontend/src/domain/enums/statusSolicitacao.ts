/** Valores numéricos idênticos ao enum `StatusSolicitacao` da API. */
export const StatusSolicitacao = {
  EmAnalise: 1,
  Aprovada: 2,
  Recusada: 3,
  ConflitoEncontrado: 4,
} as const;

export type StatusSolicitacao = (typeof StatusSolicitacao)[keyof typeof StatusSolicitacao];

export const TODOS_STATUS: readonly StatusSolicitacao[] = [
  StatusSolicitacao.EmAnalise,
  StatusSolicitacao.ConflitoEncontrado,
  StatusSolicitacao.Aprovada,
  StatusSolicitacao.Recusada,
];

export const ROTULO_STATUS: Record<StatusSolicitacao, string> = {
  [StatusSolicitacao.EmAnalise]: 'Em análise',
  [StatusSolicitacao.Aprovada]: 'Aprovada',
  [StatusSolicitacao.Recusada]: 'Recusada',
  [StatusSolicitacao.ConflitoEncontrado]: 'Conflito encontrado',
};

export function isStatusSolicitacao(valor: unknown): valor is StatusSolicitacao {
  return typeof valor === 'number' && (TODOS_STATUS as readonly number[]).includes(valor);
}

/** Aprovada e Recusada são estados finais: a Solicitação não pode mais ser editada. */
export function isStatusFinal(status: StatusSolicitacao): boolean {
  return status === StatusSolicitacao.Aprovada || status === StatusSolicitacao.Recusada;
}

export function podeEditar(status: StatusSolicitacao): boolean {
  return !isStatusFinal(status);
}

/** Aprovar ou recusar só a partir de Em análise ou Conflito encontrado. */
export function podeDecidir(status: StatusSolicitacao): boolean {
  return !isStatusFinal(status);
}

export function podeValidarConflito(status: StatusSolicitacao): boolean {
  return !isStatusFinal(status);
}
