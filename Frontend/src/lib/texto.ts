/** Normaliza para busca: minúsculas e sem acentos. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

export function contemTexto(alvo: string, busca: string): boolean {
  return normalizarBusca(alvo).includes(normalizarBusca(busca));
}

export function plural(quantidade: number, singular: string, pluralizado: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : pluralizado}`;
}
