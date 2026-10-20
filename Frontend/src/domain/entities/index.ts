import type { StatusSolicitacao } from '../enums/statusSolicitacao';

/**
 * Formatos retornados e aceitos pela API (ver Backend/README.MD).
 * Datas `DateTime` chegam como `"2026-10-15T00:00:00"`; `DateTimeOffset` com fuso.
 */

/** Identificado apenas pelo nome completo, que é único (sem e-mail; ver ADR 0003). */
export interface Colaborador {
  id: number;
  nome: string;
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

/** Quem aprovou ou recusou a Solicitação. */
export interface Decisor {
  usuarioId: number;
  nomeUsuario: string;
  nomeColaborador: string;
  isAdministrador: boolean;
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
  decididaPor?: Decisor | null;
  /** DateTimeOffset ISO da Decisão. */
  decididaEm?: string | null;
}

export type NivelAcesso = 'administrador' | 'coordenador' | 'colaborador';

export interface ColaboradorDoUsuario {
  id: number;
  nome: string;
  isCoordenador: boolean;
}

/** Quem está logado. */
export interface UsuarioLogado {
  id: number;
  nomeUsuario: string;
  nivel: NivelAcesso;
  precisaTrocarSenha: boolean;
  colaborador: ColaboradorDoUsuario;
}

/** Conta de acesso vista pelo Administrador. */
export interface ContaUsuario {
  id: number;
  nomeUsuario: string;
  nivel: NivelAcesso;
  isAdministrador: boolean;
  ativo: boolean;
  precisaTrocarSenha: boolean;
  bloqueado: boolean;
  colaborador: ColaboradorDoUsuario;
}
