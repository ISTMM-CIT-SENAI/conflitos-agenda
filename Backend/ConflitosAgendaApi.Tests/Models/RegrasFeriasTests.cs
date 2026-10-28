using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Tests.Models;

public class RegrasFeriasTests
{
    private static Periodo P(int ano, int mes, int dia, int dias)
    {
        var inicio = new DateTime(ano, mes, dia);
        return new Periodo(inicio, inicio.AddDays(dias));
    }

    [Theory]
    [InlineData(2026, 4, 5)]  // Páscoa 2026
    [InlineData(2027, 3, 28)]
    [InlineData(2028, 4, 16)]
    public void Pascoa_DeveSerCalculada(int ano, int mes, int dia) =>
        Assert.Equal(new DateTime(ano, mes, dia), Feriados.Pascoa(ano));

    [Theory]
    [InlineData(2026, 11, 20, true)]  // Consciência Negra (nacional)
    [InlineData(2026, 8, 15, true)]   // Assunção (BH)
    [InlineData(2026, 12, 8, true)]   // Imaculada Conceição (BH)
    [InlineData(2026, 4, 3, true)]    // Sexta-feira da Paixão
    [InlineData(2026, 6, 4, true)]    // Corpus Christi
    [InlineData(2026, 2, 17, false)]  // Carnaval: ponto facultativo, o instituto trabalha
    [InlineData(2026, 10, 28, false)]
    public void EhFeriado_NacionaisEDeBeloHorizonte(int ano, int mes, int dia, bool esperado) =>
        Assert.Equal(esperado, Feriados.EhFeriado(new DateTime(ano, mes, dia)));

    [Theory]
    [InlineData(2026, 10, 30, true)]  // sexta: domingo em 2 dias
    [InlineData(2026, 10, 31, true)]  // sábado: domingo no dia seguinte
    [InlineData(2026, 11, 18, true)]  // quarta: feriado de 20/11 em 2 dias
    [InlineData(2026, 10, 26, false)] // segunda
    public void IniciaAntesDeDescanso_DomingoOuFeriadoNos2DiasSeguintes(int ano, int mes, int dia, bool esperado) =>
        Assert.Equal(esperado, RegrasFerias.IniciaAntesDeDescanso(new DateTime(ano, mes, dia)));

    private static readonly Colaborador Dono = new("Carla", new(), false);
    private static readonly Colaborador Supervisor = new("Bruno", new(), true);

    private static Solicitacao Ja(bool abono, params Periodo[] periodos) =>
        new(Dono, periodos.ToList(), StatusSolicitacao.Em_Analise, DateTimeOffset.UtcNow, Supervisor, abono: abono);

    private static void Validar(Periodo[] pedido, bool abono = false, params Solicitacao[] anteriores) =>
        RegrasFerias.ValidarFeriasDoAno("Carla", anteriores, pedido, abono, ignorarSolicitacaoId: null);

    private static string Erro(Periodo[] pedido, bool abono = false, params Solicitacao[] anteriores) =>
        Assert.Throws<ArgumentException>(() => Validar(pedido, abono, anteriores)).Message;

    [Fact]
    public void AceitaPedirAsFeriasEmPartes()
    {
        Validar([P(2027, 1, 4, 15)]); // não precisa somar 30
        Validar([P(2027, 7, 5, 15)], false, Ja(false, P(2027, 1, 4, 15)));
        Validar([P(2027, 3, 1, 10)], false, Ja(false, P(2027, 1, 4, 14)));
        Validar([P(2027, 1, 4, 14), P(2027, 3, 1, 11), P(2027, 7, 5, 5)]);
    }

    [Fact]
    public void NoAnoNoMaximo30DiasE3Periodos()
    {
        Assert.Contains("36 dias de férias em 2027", Erro([P(2027, 7, 5, 16)], false, Ja(false, P(2027, 1, 4, 20))));
        Assert.Contains("4 períodos", Erro([P(2027, 9, 6, 5)], false, Ja(false, P(2027, 1, 4, 14), P(2027, 3, 1, 5), P(2027, 5, 3, 5))));
        // Em outro ano o saldo é outro.
        Validar([P(2028, 1, 3, 30)], false, Ja(false, P(2027, 1, 4, 30)));
    }

    [Fact]
    public void RecusadaNaoContaNoSaldo()
    {
        var recusada = Ja(false, P(2027, 1, 4, 30));
        recusada.Reprovar("Conflito.");
        Validar([P(2027, 7, 5, 30)], false, recusada);
    }

    [Fact]
    public void PrecisaSobrarEspacoParaUmPeriodoDe14Dias()
    {
        Validar([P(2027, 3, 1, 10)]); // sobram 20: ainda cabe um de 14
        Assert.Contains("14 dias", Erro([P(2027, 3, 1, 10)], false, Ja(false, P(2027, 1, 4, 10)))); // sobrariam 10
        Assert.Contains("14 dias", Erro([P(2027, 1, 4, 10), P(2027, 3, 1, 5), P(2027, 5, 3, 5)])); // 3 períodos sem nenhum de 14
    }

    [Fact]
    public void AbonoEmQualquerPedidoBaixaOLimiteDoAnoPara20()
    {
        Validar([P(2027, 7, 5, 6)], true, Ja(false, P(2027, 1, 4, 14)));
        Assert.Contains("o limite é 20 (com abono)", Erro([P(2027, 7, 5, 10)], true, Ja(false, P(2027, 1, 4, 14))));
        Assert.Contains("o limite é 20", Erro([P(2027, 7, 5, 10)], false, Ja(true, P(2027, 1, 4, 14))));
    }

    [Fact]
    public void CadaPedidoTemDe1A3PeriodosDePeloMenos5Dias()
    {
        Assert.Contains("entre 1 e 3 períodos", Erro([]));
        Assert.Contains("entre 1 e 3 períodos", Erro([P(2027, 1, 4, 5), P(2027, 2, 1, 5), P(2027, 3, 1, 5), P(2027, 4, 5, 5)]));
        Assert.Contains("mínimo 5 dias", Erro([P(2027, 1, 4, 4)]));
    }
}
