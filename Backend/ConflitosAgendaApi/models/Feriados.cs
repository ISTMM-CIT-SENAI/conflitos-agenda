namespace ConflitosAgendaApi.Models;

/// <summary>
/// Feriados nacionais e municipais de Belo Horizonte (MG não tem feriado estadual além de 21/4).
/// Carnaval é ponto facultativo e o instituto não folga, por isso não entra.
/// O frontend espelha esta lista em <c>src/domain/validation/feriados.ts</c>.
/// </summary>
public static class Feriados
{
    private static readonly (int Mes, int Dia)[] Fixos =
    [
        (1, 1), (4, 21), (5, 1), (9, 7), (10, 12), (11, 2), (11, 15), (11, 20), (12, 25),
        (8, 15), // Assunção de Nossa Senhora (BH)
        (12, 8), // Imaculada Conceição (BH)
    ];

    public static bool EhFeriado(DateTime data)
    {
        if (Fixos.Contains((data.Month, data.Day)))
        {
            return true;
        }
        var pascoa = Pascoa(data.Year);
        // Sexta-feira da Paixão e Corpus Christi (BH).
        return data.Date == pascoa.AddDays(-2) || data.Date == pascoa.AddDays(60);
    }

    /// <summary>Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher (calendário gregoriano).</summary>
    public static DateTime Pascoa(int ano)
    {
        int a = ano % 19, b = ano / 100, c = ano % 100, d = b / 4, e = b % 4;
        int f = (b + 8) / 25, g = (b - f + 1) / 3, h = (19 * a + b - d - g + 15) % 30;
        int i = c / 4, k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
        int m = (a + 11 * h + 22 * l) / 451;
        int mes = (h + l - 7 * m + 114) / 31, dia = (h + l - 7 * m + 114) % 31 + 1;
        return new DateTime(ano, mes, dia);
    }
}
