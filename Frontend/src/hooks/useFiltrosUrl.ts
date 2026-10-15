import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Filtros guardados na URL: são preservados ao voltar de uma tela de detalhe
 * e podem ser compartilhados por link.
 */
export function useFiltrosUrl<TChave extends string>() {
  const [params, setParams] = useSearchParams();

  const obter = useCallback((chave: TChave): string => params.get(chave) ?? '', [params]);

  const obterNumero = useCallback(
    (chave: TChave): number | null => {
      const valor = Number(params.get(chave));
      return Number.isInteger(valor) && valor > 0 ? valor : null;
    },
    [params],
  );

  const obterLista = useCallback(
    (chave: TChave): string[] => (params.get(chave) ?? '').split(',').filter(Boolean),
    [params],
  );

  const definir = useCallback(
    (chave: TChave, valor: string | number | null | readonly string[]) => {
      setParams(
        (anteriores) => {
          const proximos = new URLSearchParams(anteriores);
          const texto = Array.isArray(valor) ? valor.join(',') : valor === null ? '' : String(valor);
          if (texto === '') proximos.delete(chave);
          else proximos.set(chave, texto);
          return proximos;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const limpar = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  return { obter, obterNumero, obterLista, definir, limpar, possuiFiltros: params.size > 0 };
}
