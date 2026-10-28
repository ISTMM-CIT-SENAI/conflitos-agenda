namespace ConflitosAgendaApi.Models;

/// <summary>
/// Regras da CLT para férias (art. 134 e 143). Lança <see cref="ArgumentException"/> com a
/// mensagem para o usuário. O frontend espelha em <c>src/domain/validation</c>.
/// </summary>
public static class RegrasFerias
{
    public const int MinimoDiasPeriodo = 5;
    public const int MinimoDiasPeriodoPrincipal = 14;
    public const int MaximoPeriodos = 3;
    public const int DiasFerias = 30;
    /// <summary>Com abono pecuniário, 1/3 das férias (10 dias) é vendido.</summary>
    public const int DiasFeriasComAbono = 20;

    /// <summary>Dias de ausência: o dia de retorno não conta (ver ADR 0002).</summary>
    public static int Dias(DateTime inicio, DateTime retorno) => (retorno.Date - inicio.Date).Days;

    public static void ValidarPeriodo(DateTime inicio, DateTime retorno)
    {
        if (inicio >= retorno)
        {
            throw new ArgumentException("A data de início deve ser anterior à data de retorno.");
        }
        var dias = Dias(inicio, retorno);
        if (dias < MinimoDiasPeriodo)
        {
            throw new ArgumentException($"O período deve ter no mínimo {MinimoDiasPeriodo} dias.");
        }
        if (dias > DiasFerias)
        {
            throw new ArgumentException($"O período não pode exceder {DiasFerias} dias.");
        }
        if (IniciaAntesDeDescanso(inicio))
        {
            throw new ArgumentException(
                "As férias não podem começar nos 2 dias que antecedem um domingo ou feriado (CLT, art. 134, §3º).");
        }
    }

    /// <summary>Verdadeiro se um dos 2 dias seguintes ao início é domingo ou feriado.</summary>
    public static bool IniciaAntesDeDescanso(DateTime inicio) =>
        Enumerable.Range(1, 2)
            .Select(i => inicio.Date.AddDays(i))
            .Any(dia => dia.DayOfWeek == DayOfWeek.Sunday || Feriados.EhFeriado(dia));

    /// <summary>
    /// Uma solicitação é parte das férias do ano: de 1 a 3 períodos de pelo menos 5 dias. Somando as
    /// solicitações não recusadas do mesmo ano civil (o do primeiro dia de cada uma), o ano tem no
    /// máximo 3 períodos e 30 dias (20 se alguma tiver abono), e ainda precisa caber um período de
    /// 14 dias se nenhum foi pedido.
    /// </summary>
    public static void ValidarFeriasDoAno(
        string nome,
        IEnumerable<Solicitacao> solicitacoesDoColaborador,
        IReadOnlyCollection<Periodo> periodos,
        bool abono,
        int? ignorarSolicitacaoId)
    {
        if (periodos.Count is < 1 or > MaximoPeriodos)
        {
            throw new ArgumentException($"A solicitação deve conter entre 1 e {MaximoPeriodos} períodos.");
        }
        if (periodos.Any(p => Dias(p.DataInicio, p.DataFim) < MinimoDiasPeriodo))
        {
            throw new ArgumentException($"Cada período deve ter no mínimo {MinimoDiasPeriodo} dias.");
        }

        var ano = AnoReferencia(periodos);
        var outras = solicitacoesDoColaborador
            .Where(s => s.Id != ignorarSolicitacaoId
                && s.Status != StatusSolicitacao.Recusada
                && s.Periodos.Count > 0
                && AnoReferencia(s.Periodos) == ano)
            .ToList();
        var dias = outras.SelectMany(s => s.Periodos).Concat(periodos).Select(p => Dias(p.DataInicio, p.DataFim)).ToList();
        var limite = abono || outras.Any(s => s.Abono) ? DiasFeriasComAbono : DiasFerias;

        if (dias.Count > MaximoPeriodos)
        {
            throw new ArgumentException(
                $"{nome} ficaria com {dias.Count} períodos de férias em {ano}: a CLT permite no máximo {MaximoPeriodos}.");
        }
        if (dias.Sum() > limite)
        {
            throw new ArgumentException(
                $"{nome} ficaria com {dias.Sum()} dias de férias em {ano}: o limite é {limite}{(limite == DiasFeriasComAbono ? " (com abono)" : "")}.");
        }
        // Sem nenhum período de 14 dias, ainda precisa sobrar espaço (dias e períodos) para um.
        var semPrincipal = dias.Max() < MinimoDiasPeriodoPrincipal;
        if (semPrincipal && (limite - dias.Sum() < MinimoDiasPeriodoPrincipal || dias.Count == MaximoPeriodos))
        {
            throw new ArgumentException(
                $"Um dos períodos de {ano} precisa ter no mínimo {MinimoDiasPeriodoPrincipal} dias, e com este pedido não sobraria espaço para ele.");
        }
    }

    /// <summary>Ano civil das férias: o do primeiro dia de ausência.</summary>
    public static int AnoReferencia(IEnumerable<Periodo> periodos) => periodos.Min(p => p.DataInicio).Year;
}
