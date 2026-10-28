import type { Periodo } from '../entities';
import { dataISODeDateTime, diferencaEmDias, somarDias, type DataISO } from '@/lib/datas';
import { iniciaAntesDeDescanso } from './feriados';

/** CLT: nenhum período de férias pode ter menos de 5 dias. */
export const DURACAO_MINIMA_DIAS = 5;
export const DURACAO_MAXIMA_DIAS = 30;

/** Intervalo de datas de um Período. `retorno` é exclusivo: não é dia de ausência. */
export interface Intervalo {
  inicio: DataISO;
  retorno: DataISO;
}

export function intervaloDoPeriodo(periodo: Periodo): Intervalo {
  return {
    inicio: dataISODeDateTime(periodo.dataInicio),
    retorno: dataISODeDateTime(periodo.dataFim),
  };
}

/** Duração = Retorno − Início (o dia de Retorno não conta). */
export function duracaoEmDias({ inicio, retorno }: Intervalo): number {
  return diferencaEmDias(inicio, retorno);
}

export function duracaoDoPeriodo(periodo: Periodo): number {
  return duracaoEmDias(intervaloDoPeriodo(periodo));
}

export function ultimoDiaDeAusencia({ retorno }: Intervalo): DataISO {
  return somarDias(retorno, -1);
}

/** Retorna as mensagens de erro do intervalo; lista vazia quando é válido. */
export function validarIntervalo(intervalo: Intervalo): string[] {
  if (intervalo.inicio >= intervalo.retorno) {
    return ['A data de retorno deve ser posterior à data de início.'];
  }
  const duracao = duracaoEmDias(intervalo);
  if (duracao < DURACAO_MINIMA_DIAS) {
    return [`O período deve ter no mínimo ${DURACAO_MINIMA_DIAS} dias (atual: ${duracao}).`];
  }
  if (duracao > DURACAO_MAXIMA_DIAS) {
    return [`O período deve ter no máximo ${DURACAO_MAXIMA_DIAS} dias (atual: ${duracao}).`];
  }
  if (iniciaAntesDeDescanso(intervalo.inicio)) {
    return ['As férias não podem começar nos 2 dias que antecedem um domingo ou feriado (CLT, art. 134, §3º).'];
  }
  return [];
}

/**
 * Dois intervalos se sobrepõem quando compartilham ao menos um dia de ausência.
 * Intervalos adjacentes (um termina no dia em que o outro começa) não se sobrepõem.
 * Comparar "AAAA-MM-DD" como texto equivale a comparar as datas.
 */
export function seSobrepoem(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.retorno && b.inicio < a.retorno;
}
