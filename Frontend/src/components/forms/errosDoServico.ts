import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ErroRegraNegocio } from '@/services/erros';

/**
 * Exibe junto aos campos as violações devolvidas pelo serviço.
 * Violações sem campo conhecido ficam com o feedback global (toast).
 */
export function aplicarErrosDoServico<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
  campos: readonly Path<T>[],
): void {
  if (!(erro instanceof ErroRegraNegocio)) return;
  for (const violacao of erro.violacoes) {
    const campo = campos.find((c) => c === violacao.campo);
    if (campo) setError(campo, { type: 'servico', message: violacao.mensagem });
  }
}
