using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Tests.Models;

public class SolicitacaoTests
{
    [Fact]
    public void ValidarNumPeriodos_DeveAceitarEntreUmETresPeriodos()
    {
        var solicitacao = CriarSolicitacao();

        Assert.False(solicitacao.ValidarNumPeriodos(Array.Empty<Periodo>()));
        Assert.True(solicitacao.ValidarNumPeriodos(new[] { CriarPeriodo() }));
        Assert.True(solicitacao.ValidarNumPeriodos(new[]
        {
            CriarPeriodo(),
            CriarPeriodo(),
            CriarPeriodo()
        }));
        Assert.False(solicitacao.ValidarNumPeriodos(new[]
        {
            CriarPeriodo(),
            CriarPeriodo(),
            CriarPeriodo(),
            CriarPeriodo()
        }));
    }

    [Fact]
    public void ValidarAbono_DeveLimitarQuantidadeEDias()
    {
        var solicitacao = CriarSolicitacao(abono: true, totalDias: 20);

        Assert.True(solicitacao.ValidarAbono(new[] { CriarPeriodo(), CriarPeriodo() }));
        Assert.False(solicitacao.ValidarAbono(new[]
        {
            CriarPeriodo(),
            CriarPeriodo(),
            CriarPeriodo()
        }));

        var solicitacaoAcimaDoLimite = CriarSolicitacao(abono: true, totalDias: 21);
        Assert.False(solicitacaoAcimaDoLimite.ValidarAbono(new[] { CriarPeriodo() }));
    }

    private static Solicitacao CriarSolicitacao(
        bool abono = false,
        int totalDias = 10)
    {
        var colaborador = new Colaborador("Colaborador", new(), false);
        var coordenador = new Colaborador("Coordenador", new(), true);

        return new Solicitacao(
            colaborador,
            new() { CriarPeriodo() },
            StatusSolicitacao.Em_Analise,
            DateTimeOffset.UtcNow,
            coordenador,
            abono: abono,
            totalDias: totalDias);
    }

    private static Periodo CriarPeriodo()
    {
        return new Periodo(
            new DateTime(2026, 10, 1),
            new DateTime(2026, 10, 11));
    }
}
