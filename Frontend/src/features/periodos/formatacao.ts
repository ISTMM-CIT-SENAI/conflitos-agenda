import type { Periodo } from '@/domain/entities';
import { duracaoEmDias, intervaloDoPeriodo, ultimoDiaDeAusencia, type Intervalo } from '@/domain/validation/periodo';
import { formatarData } from '@/lib/datas';
import { plural } from '@/lib/texto';

/** "15/10/2026 a 24/10/2026" — dias efetivos de ausência (o Retorno não conta). */
export function descreverAusencia(intervalo: Intervalo): string {
  return `${formatarData(intervalo.inicio)} a ${formatarData(ultimoDiaDeAusencia(intervalo))}`;
}

/** "15/10/2026 a 24/10/2026 · 10 dias" */
export function descreverPeriodo(periodo: Periodo): string {
  const intervalo = intervaloDoPeriodo(periodo);
  return `${descreverAusencia(intervalo)} · ${plural(duracaoEmDias(intervalo), 'dia', 'dias')}`;
}
