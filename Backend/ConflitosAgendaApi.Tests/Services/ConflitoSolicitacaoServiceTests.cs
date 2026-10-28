using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories;
using ConflitosAgendaApi.Services;

namespace ConflitosAgendaApi.Tests.Services;

public sealed class ConflitoSolicitacaoServiceTests : IDisposable
{
    private readonly BancoEmMemoria _banco = new();
    private readonly ConflitoSolicitacaoService _service;
    private readonly Colaborador _solicitante = new("Carla", new(), false);
    private readonly Colaborador _critico = new("Diego", new(), false);
    private readonly Colaborador _supervisor = new("Bruno", new(), true);

    public ConflitoSolicitacaoServiceTests()
    {
        var contexto = _banco.Contexto;
        _service = new ConflitoSolicitacaoService(new ProjetoRepository(contexto), new SolicitacaoRepository(contexto));
        contexto.Colaboradores.AddRange(_solicitante, _critico, _supervisor);
        // A solicitante não é pessoa crítica: o conflito vale mesmo assim (ver CONTEXT.md).
        contexto.Projetos.Add(new Projeto("Portal", [_critico], [_solicitante, _critico]));
        contexto.SaveChanges();
    }

    public void Dispose() => _banco.Dispose();

    private static Periodo Periodo(int diaInicio, int diaRetorno, Colaborador dono) =>
        new(new DateTime(2027, 3, diaInicio), new DateTime(2027, 3, diaRetorno), dono.Id);

    private Solicitacao Solicitar(Colaborador dono, Periodo periodo, StatusSolicitacao status = StatusSolicitacao.Em_Analise)
    {
        var solicitacao = new Solicitacao(dono, [periodo], status, DateTimeOffset.UtcNow, _supervisor);
        _banco.Contexto.Solicitacoes.Add(solicitacao);
        _banco.Contexto.SaveChanges();
        return solicitacao;
    }

    [Fact]
    public async Task HaConflitoQuandoSeSobrepoeAUmaSolicitacaoDaPessoaCritica()
    {
        Solicitar(_critico, Periodo(10, 20, _critico));
        var alvo = Solicitar(_solicitante, Periodo(15, 25, _solicitante));

        Assert.True(await _service.PossuiConflitoAsync(alvo));
    }

    [Fact]
    public async Task PeriodosAdjacentesNaoSaoConflito()
    {
        Solicitar(_critico, Periodo(20, 30, _critico));
        var alvo = Solicitar(_solicitante, Periodo(10, 20, _solicitante));

        Assert.False(await _service.PossuiConflitoAsync(alvo));
    }

    [Fact]
    public async Task SolicitacaoRecusadaOuPeriodoSemSolicitacaoNaoContam()
    {
        Solicitar(_critico, Periodo(10, 20, _critico), StatusSolicitacao.Recusada);
        _banco.Contexto.Periodos.Add(Periodo(12, 22, _critico));
        _banco.Contexto.SaveChanges();
        var alvo = Solicitar(_solicitante, Periodo(15, 25, _solicitante));

        Assert.False(await _service.PossuiConflitoAsync(alvo));
    }

    [Fact]
    public async Task DeveRejeitarSolicitacaoSemPeriodos()
    {
        var vazia = new Solicitacao(_solicitante, [], StatusSolicitacao.Em_Analise, DateTimeOffset.UtcNow, _supervisor);

        await Assert.ThrowsAsync<ArgumentException>(() => _service.PossuiConflitoAsync(vazia));
    }
}
