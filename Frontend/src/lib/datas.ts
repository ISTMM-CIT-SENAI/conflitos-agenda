import { addDays, differenceInCalendarDays, format, isValid, parse } from 'date-fns';

/**
 * Toda data de Período circula na interface como `DataISO` ("AAAA-MM-DD"),
 * sem horário nem fuso. Assim nenhuma conversão UTC pode mudar o dia.
 * A conversão para o `DateTime` da API acontece só na borda do serviço.
 */
export type DataISO = string;

const PADRAO_DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function isDataISO(valor: string): valor is DataISO {
  return PADRAO_DATA_ISO.test(valor) && isValid(parseDataISO(valor));
}

/** Converte "AAAA-MM-DD" em Date à meia-noite local. */
export function parseDataISO(data: DataISO): Date {
  return parse(data, 'yyyy-MM-dd', new Date());
}

export function paraDataISO(data: Date): DataISO {
  return format(data, 'yyyy-MM-dd');
}

export function hojeISO(): DataISO {
  return paraDataISO(new Date());
}

/** "2026-10-15T00:00:00" (ou com fuso) → "2026-10-15", sem passar por Date. */
export function dataISODeDateTime(dateTime: string): DataISO {
  return dateTime.slice(0, 10);
}

/** "2026-10-15" → "2026-10-15T00:00:00", formato `DateTime` aceito pela API. */
export function dateTimeDeDataISO(data: DataISO): string {
  return `${data}T00:00:00`;
}

export function formatarData(data: DataISO): string {
  return format(parseDataISO(data), 'dd/MM/yyyy');
}

/** Formata um DateTimeOffset ISO no horário local, ex.: "14/10/2026 17:00". */
export function formatarDataHora(dateTimeOffset: string): string {
  const data = new Date(dateTimeOffset);
  return isValid(data) ? format(data, 'dd/MM/yyyy HH:mm') : dateTimeOffset;
}

/** Data/hora atual como DateTimeOffset com o fuso local, ex.: "2026-10-14T17:00:00-03:00". */
export function agoraDateTimeOffset(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX");
}

export function diferencaEmDias(inicio: DataISO, fim: DataISO): number {
  return differenceInCalendarDays(parseDataISO(fim), parseDataISO(inicio));
}

export function somarDias(data: DataISO, dias: number): DataISO {
  return paraDataISO(addDays(parseDataISO(data), dias));
}
