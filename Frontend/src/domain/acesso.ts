import type { NivelAcesso, Solicitacao, UsuarioLogado } from './entities';
import { isStatusFinal } from './enums/statusSolicitacao';

/**
 * O que cada nível de acesso pode fazer. Espelha `RegrasAcesso` do backend: a API é
 * quem garante as regras; aqui elas servem para esconder o que o Usuário não pode
 * fazer e para o modo demonstração se comportar como a API.
 */

export const ROTULO_NIVEL: Record<NivelAcesso, string> = {
  coordenador: 'Coordenador',
  supervisor: 'Supervisor',
  colaborador: 'Colaborador',
};

export function ehCoordenador(usuario: UsuarioLogado): boolean {
  return usuario.nivel === 'coordenador';
}

export function ehDono(usuario: UsuarioLogado, colaboradorId: number): boolean {
  return usuario.colaborador.id === colaboradorId;
}

type SolicitacaoResumo = Pick<Solicitacao, 'status'> & {
  colaborador: { id: number };
  supervisor: { id: number };
};

/** Coordenador vê todas; os demais veem as próprias e, se supervisores, as atribuídas a eles. */
export function podeVerSolicitacao(usuario: UsuarioLogado, s: SolicitacaoResumo): boolean {
  return ehCoordenador(usuario) || ehDono(usuario, s.colaborador.id) || usuario.colaborador.id === s.supervisor.id;
}

/** Alterar períodos, supervisor e abono. */
export function podeEditarSolicitacao(usuario: UsuarioLogado, s: SolicitacaoResumo): boolean {
  return !isStatusFinal(s.status) && (ehCoordenador(usuario) || ehDono(usuario, s.colaborador.id));
}

/** Aprovar ou recusar: o Supervisor encaminhado ou o Coordenador, nunca o próprio solicitante. */
export function podeDecidir(usuario: UsuarioLogado, s: SolicitacaoResumo): boolean {
  return (
    !isStatusFinal(s.status) &&
    !ehDono(usuario, s.colaborador.id) &&
    (ehCoordenador(usuario) || usuario.colaborador.id === s.supervisor.id)
  );
}

export function podeValidarConflito(usuario: UsuarioLogado, s: SolicitacaoResumo): boolean {
  return !isStatusFinal(s.status) && podeVerSolicitacao(usuario, s);
}

/** Coordenador exclui qualquer uma; o dono, só antes da Decisão. */
export function podeExcluirSolicitacao(usuario: UsuarioLogado, s: SolicitacaoResumo): boolean {
  return ehCoordenador(usuario) || (ehDono(usuario, s.colaborador.id) && !isStatusFinal(s.status));
}

/** Só o dono do período (ou um Coordenador) cria, altera ou exclui. */
export function podeGerenciarPeriodo(usuario: UsuarioLogado, idColaborador: number): boolean {
  return ehCoordenador(usuario) || ehDono(usuario, idColaborador);
}

const PADRAO_NOME_USUARIO = /^[A-Za-z0-9._-]{3,30}$/;
export const TAMANHO_MINIMO_SENHA = 8;

export function validarNomeUsuario(nomeUsuario: string): string | null {
  return PADRAO_NOME_USUARIO.test(nomeUsuario.trim())
    ? null
    : 'O nome de usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.';
}

export function validarSenha(senha: string): string | null {
  return senha.length >= TAMANHO_MINIMO_SENHA
    ? null
    : `A senha deve ter no mínimo ${TAMANHO_MINIMO_SENHA} caracteres.`;
}
