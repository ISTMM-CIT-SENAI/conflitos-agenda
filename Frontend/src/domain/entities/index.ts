import type { StatusSolicitacao } from '../enums/statusSolicitacao';

/**
 * Formatos retornados e aceitos pela API (ver README.MD).
 * Datas `DateTime` chegam como `"2026-10-15T00:00:00"`; `DateTimeOffset` com fuso.
 */

export interface Colaborador {
  id: number;
  nome: string;
  email: string;
  isCoordenador: boolean;
  projetos?: Projeto[];
}

export interface Periodo {
  id: number;
  /** DateTime ISO; apenas a parte de data é significativa. */
  dataInicio: string;
  /** DateTime ISO do dia de Retorno (exclusivo). */
  dataFim: string;
  idColaborador: number;
}

export interface Projeto {
  id: number;
  nome: string;
  pessoasCriticas: Colaborador[];
  colaboradores: Colaborador[];
}

export interface Solicitacao {
  id: number;
  colaborador: Colaborador;
  periodos: Periodo[];
  status: StatusSolicitacao;
  /** DateTimeOffset ISO, com fuso. */
  criadaEm: string;
  coordenador: Colaborador;
  observacao: string | null;
  totalDias: number;
  abono: boolean;
  isPessoaCritica: boolean;
}
