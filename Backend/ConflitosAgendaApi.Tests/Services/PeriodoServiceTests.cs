using ConflitosAgendaApi.Dtos.Periodos;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories;
using ConflitosAgendaApi.Services;

namespace ConflitosAgendaApi.Tests.Services;

public sealed class PeriodoServiceTests : IDisposable
{
    private readonly BancoEmMemoria _banco = new();
    private readonly PeriodoService _service;
    private readonly Colaborador _colaborador = new("Henrique", new(), false);
    private readonly Colaborador _supervisor = new("Bruno", new(), true);

    public PeriodoServiceTests()
    {
        _service = new PeriodoService(new PeriodoRepository(_banco.Contexto), new SolicitacaoRepository(_banco.Contexto));
        _banco.Contexto.Colaboradores.AddRange(_colaborador, _supervisor);
        _banco.Contexto.SaveChanges();
    }

    public void Dispose() => _banco.Dispose();

    private PeriodoInsertionDto Novo(DateTime inicio, DateTime retorno) =>
        new() { DataInicio = inicio, DataFim = retorno, IdColaborador = _colaborador.Id };

    private PeriodoUpdateDto Datas(DateTime inicio, DateTime retorno) =>
        new() { DataInicio = inicio, DataFim = retorno, IdColaborador = _colaborador.Id };

    private async Task<Periodo> PeriodoEmSolicitacaoAsync(StatusSolicitacao status)
    {
        var periodo = (await _service.AddAsync(Novo(new DateTime(2027, 1, 4), new DateTime(2027, 2, 3))))!;
        _banco.Contexto.Solicitacoes.Add(new Solicitacao(_colaborador, [periodo], status, DateTimeOffset.UtcNow, _supervisor));
        await _banco.Contexto.SaveChangesAsync();
        return periodo;
    }

    [Fact]
    public async Task AddAsync_DeveAceitarPeriodoEntreCincoETrintaDias()
    {
        Assert.NotNull(await _service.AddAsync(Novo(new DateTime(2026, 10, 1), new DateTime(2026, 10, 11))));
    }

    [Fact]
    public async Task AddAsync_DeveRejeitarPeriodoMenorQueCincoDias()
    {
        var erro = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddAsync(Novo(new DateTime(2026, 10, 1), new DateTime(2026, 10, 5))));
        Assert.Contains("mínimo 5 dias", erro.Message);
    }

    [Fact]
    public async Task AddAsync_DeveRejeitarInicioNaSextaFeira()
    {
        var erro = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddAsync(Novo(new DateTime(2026, 10, 2), new DateTime(2026, 10, 16))));
        Assert.Contains("antecedem um domingo ou feriado", erro.Message);
    }

    [Fact]
    public async Task UpdateAsync_DeveRetornarNullQuandoPeriodoNaoExiste()
    {
        Assert.Null(await _service.UpdateAsync(99, Datas(new DateTime(2026, 10, 1), new DateTime(2026, 10, 11))));
    }

    [Fact]
    public async Task UpdateAsync_NaoAlteraPeriodoDeSolicitacaoDecidida()
    {
        var periodo = await PeriodoEmSolicitacaoAsync(StatusSolicitacao.Aprovada);

        var erro = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateAsync(periodo.Id, Datas(new DateTime(2027, 5, 3), new DateTime(2027, 6, 2))));
        Assert.Contains("já foi decidida", erro.Message);
        Assert.Equal(new DateTime(2027, 1, 4), periodo.DataInicio);
    }

    [Fact]
    public async Task UpdateAsync_MantemASolicitacaoEmAbertoDentroDaClt()
    {
        var periodo = await PeriodoEmSolicitacaoAsync(StatusSolicitacao.Em_Analise);
        // Outra parte de 2027, com 10 dias.
        var outro = (await _service.AddAsync(Novo(new DateTime(2027, 9, 13), new DateTime(2027, 9, 23))))!;
        _banco.Contexto.Solicitacoes.Add(new Solicitacao(_colaborador, [outro], StatusSolicitacao.Em_Analise, DateTimeOffset.UtcNow, _supervisor));
        await _banco.Contexto.SaveChangesAsync();

        // 10 + 25 passaria de 30; 10 + 10 não deixaria espaço para um período de 14 dias.
        var excesso = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateAsync(periodo.Id, Datas(new DateTime(2027, 5, 3), new DateTime(2027, 5, 28))));
        Assert.Contains("35 dias", excesso.Message);
        var semEspaco = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.UpdateAsync(periodo.Id, Datas(new DateTime(2027, 5, 3), new DateTime(2027, 5, 13))));
        Assert.Contains("14 dias", semEspaco.Message);

        await _service.UpdateAsync(periodo.Id, Datas(new DateTime(2027, 5, 3), new DateTime(2027, 5, 23)));
        Assert.Equal(new DateTime(2027, 5, 3), periodo.DataInicio);
    }

    [Fact]
    public async Task DeleteAsync_NaoExcluiPeriodoQueFazParteDeUmaSolicitacao()
    {
        var periodo = await PeriodoEmSolicitacaoAsync(StatusSolicitacao.Em_Analise);

        var erro = await Assert.ThrowsAsync<ArgumentException>(() => _service.DeleteAsync(periodo.Id));
        Assert.Contains("Remova-o da solicitação", erro.Message);
    }
}
