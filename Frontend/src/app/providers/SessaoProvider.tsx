import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, type ReactNode } from 'react';
import type { UsuarioLogado } from '@/domain/entities';
import { chaves } from '@/hooks/useDados';
import { useServicos } from './useServicos';
import { CHAVE_SESSAO, SessaoContext, type Sessao } from './useSessao';

/** Mantém quem está logado e limpa os dados em cache ao trocar de usuário. */
export function SessaoProvider({ children }: { children: ReactNode }) {
  const { autenticacao } = useServicos();
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: CHAVE_SESSAO,
    queryFn: () => autenticacao.usuarioAtual(),
    staleTime: Infinity,
    retry: false,
  });

  const definirUsuario = useCallback(
    (usuario: UsuarioLogado | null) => {
      // Nada do usuário anterior pode aparecer para o próximo.
      queryClient.removeQueries({ queryKey: chaves.raiz });
      queryClient.setQueryData(CHAVE_SESSAO, usuario);
    },
    [queryClient],
  );

  const sessao = useMemo<Sessao>(
    () => ({
      usuario: consulta.data ?? null,
      carregando: consulta.isPending,
      async entrar(nomeUsuario, senha) {
        const usuario = await autenticacao.entrar(nomeUsuario, senha);
        definirUsuario(usuario);
        return usuario;
      },
      async sair() {
        try {
          await autenticacao.sair();
        } finally {
          definirUsuario(null);
        }
      },
      async trocarSenha(senhaAtual, novaSenha) {
        const usuario = await autenticacao.trocarSenha(senhaAtual, novaSenha);
        queryClient.setQueryData(CHAVE_SESSAO, usuario);
        return usuario;
      },
    }),
    [consulta.data, consulta.isPending, autenticacao, definirUsuario, queryClient],
  );

  return <SessaoContext.Provider value={sessao}>{children}</SessaoContext.Provider>;
}
