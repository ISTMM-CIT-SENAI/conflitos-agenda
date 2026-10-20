import { createContext, useContext } from 'react';
import type { UsuarioLogado } from '@/domain/entities';

export interface Sessao {
  /** `null` quando ninguém está logado. */
  usuario: UsuarioLogado | null;
  carregando: boolean;
  entrar(nomeUsuario: string, senha: string): Promise<UsuarioLogado>;
  sair(): Promise<void>;
  trocarSenha(senhaAtual: string, novaSenha: string): Promise<UsuarioLogado>;
}

export const CHAVE_SESSAO = ['sessao'] as const;

export const SessaoContext = createContext<Sessao | null>(null);

export function useSessao(): Sessao {
  const sessao = useContext(SessaoContext);
  if (!sessao) throw new Error('useSessao deve ser usado dentro de <SessaoProvider>.');
  return sessao;
}

/** Usuário logado; só para telas dentro da área protegida, onde a sessão é garantida. */
export function useUsuarioLogado(): UsuarioLogado {
  const { usuario } = useSessao();
  if (!usuario) throw new Error('useUsuarioLogado usado fora da área protegida.');
  return usuario;
}
