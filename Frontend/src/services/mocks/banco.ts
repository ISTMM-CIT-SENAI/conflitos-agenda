import type { Periodo } from '@/domain/entities';
import type { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';

/**
 * Formato normalizado persistido pelo mock. Projetos e Solicitações guardam
 * apenas IDs; os objetos completos são montados na leitura, como a API faria.
 */

export interface ColaboradorRegistro {
  id: number;
  nome: string;
  email: string;
  isCoordenador: boolean;
}

export interface ProjetoRegistro {
  id: number;
  nome: string;
  colaboradorIds: number[];
  pessoaCriticaIds: number[];
}

export interface SolicitacaoRegistro {
  id: number;
  colaboradorId: number;
  coordenadorId: number;
  periodoIds: number[];
  status: StatusSolicitacao;
  criadaEm: string;
  observacao: string | null;
  totalDias: number;
  abono: boolean;
  isPessoaCritica: boolean;
}

export interface BancoMock {
  versao: number;
  colaboradores: ColaboradorRegistro[];
  periodos: Periodo[];
  projetos: ProjetoRegistro[];
  solicitacoes: SolicitacaoRegistro[];
}

export const VERSAO_BANCO = 1;

/** Subconjunto de `Storage`, para permitir armazenamento em memória nos testes. */
export interface Armazenamento {
  getItem(chave: string): string | null;
  setItem(chave: string, valor: string): void;
  removeItem(chave: string): void;
}

export function criarArmazenamentoEmMemoria(): Armazenamento {
  const dados = new Map<string, string>();
  return {
    getItem: (chave) => dados.get(chave) ?? null,
    setItem: (chave, valor) => void dados.set(chave, valor),
    removeItem: (chave) => void dados.delete(chave),
  };
}

export function proximoId(registros: readonly { id: number }[]): number {
  return registros.reduce((maior, r) => Math.max(maior, r.id), 0) + 1;
}
