import { paraDataISO, parseDataISO, somarDias, type DataISO } from '@/lib/datas';

/**
 * Feriados nacionais e municipais de Belo Horizonte (MG não tem feriado estadual além de 21/4).
 * Carnaval é ponto facultativo e o instituto não folga. Espelha `Feriados.cs` da API.
 */
const FIXOS = new Set([
  '01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25',
  '08-15', // Assunção de Nossa Senhora (BH)
  '12-08', // Imaculada Conceição (BH)
]);

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): DataISO {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const n = h + l - 7 * m + 114;
  return paraDataISO(new Date(ano, Math.floor(n / 31) - 1, (n % 31) + 1));
}

export function ehFeriado(data: DataISO): boolean {
  if (FIXOS.has(data.slice(5))) return true;
  const domingoDePascoa = pascoa(Number(data.slice(0, 4)));
  // Sexta-feira da Paixão e Corpus Christi (BH).
  return data === somarDias(domingoDePascoa, -2) || data === somarDias(domingoDePascoa, 60);
}

/** CLT, art. 134, §3º: as férias não podem começar nos 2 dias que antecedem domingo ou feriado. */
export function iniciaAntesDeDescanso(inicio: DataISO): boolean {
  return [1, 2].some((n) => {
    const dia = somarDias(inicio, n);
    return parseDataISO(dia).getDay() === 0 || ehFeriado(dia);
  });
}
