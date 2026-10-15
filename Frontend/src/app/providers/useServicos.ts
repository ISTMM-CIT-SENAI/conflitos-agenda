import { createContext, useContext } from 'react';
import type { Servicos } from '@/services';

export const ServicosContext = createContext<Servicos | null>(null);

/** Única porta de acesso das telas aos dados; não sabem se a fonte é mock ou API. */
export function useServicos(): Servicos {
  const servicos = useContext(ServicosContext);
  if (!servicos) throw new Error('useServicos deve ser usado dentro de <ServicosProvider>.');
  return servicos;
}
