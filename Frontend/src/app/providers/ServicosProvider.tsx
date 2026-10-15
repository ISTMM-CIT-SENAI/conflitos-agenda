import type { ReactNode } from 'react';
import type { Servicos } from '@/services';
import { ServicosContext } from './useServicos';

export function ServicosProvider({ servicos, children }: { servicos: Servicos; children: ReactNode }) {
  return <ServicosContext.Provider value={servicos}>{children}</ServicosContext.Provider>;
}
