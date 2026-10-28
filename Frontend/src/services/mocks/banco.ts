import type { Periodo } from '@/domain/entities';
import type { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';

/**
 * Formato normalizado persistido pelo mock. Projetos e Solicitações guardam
 * apenas IDs; os objetos completos são montados na leitura, como a API faria.
 */

export interface ColaboradorRegistro {
  id: number;
  nome: string;
  isSupervisor: boolean;
  respondeAId: number | null;
}

export interface UsuarioRegistro {
  id: number;
  nomeUsuario: string;
  /** Hash da senha (ver `hashSenhaDemonstracao`); a senha nunca é guardada. */
  senhaHash: string;
  colaboradorId: number;
  isCoordenador: boolean;
  ativo: boolean;
  precisaTrocarSenha: boolean;
  tentativasFalhas: number;
  /** Instante ISO até o qual o login fica bloqueado. */
  bloqueadoAte: string | null;
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
  supervisorId: number;
  periodoIds: number[];
  status: StatusSolicitacao;
  criadaEm: string;
  observacao: string | null;
  totalDias: number;
  abono: boolean;
  isPessoaCritica: boolean;
  decididaPorId: number | null;
  decididaEm: string | null;
}

export interface BancoMock {
  versao: number;
  colaboradores: ColaboradorRegistro[];
  usuarios: UsuarioRegistro[];
  periodos: Periodo[];
  projetos: ProjetoRegistro[];
  solicitacoes: SolicitacaoRegistro[];
}

/** Versão 3: Coordenador/Supervisor, "Responde a" e regras da CLT. */
export const VERSAO_BANCO = 3;

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

/**
 * Hash usado APENAS no modo demonstração, que roda inteiro no navegador. Evita guardar
 * a senha em texto puro no localStorage, mas não é proteção real: na API, as senhas
 * usam o PasswordHasher do ASP.NET Core (PBKDF2 com sal aleatório).
 */
export function hashSenhaDemonstracao(senha: string): string {
  let hash = 0x811c9dc5;
  for (const caractere of `conflitos-agenda:${senha}`) {
    hash ^= caractere.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return `demo$${(hash >>> 0).toString(16).padStart(8, '0')}`;
}
