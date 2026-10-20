using ConflitosAgendaApi.Dtos.Referencias;
using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services;
using ConflitosAgendaApi.Services.Interfaces;

namespace ConflitosAgendaApi.Tests.Services;

public class SolicitacaoServiceTests
{
    [Fact]
    public async Task AddAsync_DeveRejeitarSolicitacaoSemPeriodos()
    {
        var service = CriarService();
        var dto = CriarInsertionDto([]);

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => service.AddAsync(dto));

        Assert.Contains("entre 1 e 3 períodos", exception.Message);
    }

    [Fact]
    public async Task AddAsync_DeveRejeitarAbonoComMaisDeDoisPeriodos()
    {
        var service = CriarService();
        var dto = CriarInsertionDto(
            [CriarReferenciaPeriodo(1), CriarReferenciaPeriodo(2), CriarReferenciaPeriodo(3)],
            abono: true);

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => service.AddAsync(dto));

        Assert.Contains("critérios de abono", exception.Message);
    }

    [Fact]
    public async Task UpdateAsync_DeveValidarAntesDeAlterarOuPersistir()
    {
        var existente = CriarSolicitacao();
        var repository = new FakeSolicitacaoRepository(existente);
        var service = CriarService(repository);
        var dto = CriarUpdateDto(
            [CriarReferenciaPeriodo(1), CriarReferenciaPeriodo(2), CriarReferenciaPeriodo(3), CriarReferenciaPeriodo(4)]);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.UpdateAsync(existente.Id, dto));

        Assert.Single(existente.Periodos);
        Assert.False(repository.UpdateCalled);
    }

    [Fact]
    public async Task GetByIdAsync_DeveRetornarNullQuandoNaoEncontrar()
    {
        var service = CriarService(new FakeSolicitacaoRepository(null));

        var resultado = await service.GetByIdAsync(99);

        Assert.Null(resultado);
    }

    private static SolicitacaoService CriarService(
        ISolicitacaoRepository? repository = null)
    {
        return new SolicitacaoService(
            repository ?? new FakeSolicitacaoRepository(CriarSolicitacao()),
            new FakeConflitoSolicitacaoService(),
            new FakeColaboradorRepository(),
            new FakePeriodoRepository());
    }

    private static SolicitacaoInsertionDto CriarInsertionDto(
        List<PeriodoReferenciaDto> periodos,
        bool abono = false)
    {
        return new SolicitacaoInsertionDto
        {
            Colaborador = new ColaboradorReferenciaDto { Id = 1 },
            Periodos = periodos,
            Coordenador = new ColaboradorReferenciaDto { Id = 2 },
            TotalDias = abono ? 10 : 10,
            Abono = abono
        };
    }

    private static SolicitacaoUpdateDto CriarUpdateDto(List<PeriodoReferenciaDto> periodos)
    {
        return new SolicitacaoUpdateDto
        {
            Colaborador = new ColaboradorReferenciaDto { Id = 1 },
            Periodos = periodos,
            Coordenador = new ColaboradorReferenciaDto { Id = 2 }
        };
    }

    private static PeriodoReferenciaDto CriarReferenciaPeriodo(int id)
    {
        return new PeriodoReferenciaDto { Id = id };
    }

    private static Solicitacao CriarSolicitacao()
    {
        return new Solicitacao(
            CriarColaborador(),
            [CriarPeriodo()],
            StatusSolicitacao.Em_Analise,
            DateTimeOffset.UtcNow,
            CriarColaborador());
    }

    private static Colaborador CriarColaborador()
    {
        return new Colaborador("Pessoa", new(), false);
    }

    private static Periodo CriarPeriodo()
    {
        return new Periodo(
            new DateTime(2026, 10, 1),
            new DateTime(2026, 10, 11));
    }

    /// <summary>Devolve um colaborador para qualquer ID.</summary>
    private sealed class FakeColaboradorRepository : IColaboradorRepository
    {
        public Task<Colaborador?> GetByIdAsync(int id) =>
            Task.FromResult<Colaborador?>(CriarColaborador());
        public Task<IEnumerable<Colaborador>> ListAllAsync() =>
            Task.FromResult<IEnumerable<Colaborador>>([]);
        public Task<Colaborador?> AddAsync(Colaborador colaborador) => Task.FromResult<Colaborador?>(colaborador);
        public Task<Colaborador?> UpdateAsync(Colaborador colaborador) => Task.FromResult<Colaborador?>(colaborador);
        public Task<Colaborador?> DeleteAsync(int id) => Task.FromResult<Colaborador?>(null);
        public Task<Colaborador?> TornarCoordenadorAsync(int id) => Task.FromResult<Colaborador?>(null);
        public Task<bool> ExisteComNomeAsync(string nome, int? ignorarId = null) => Task.FromResult(false);
    }

    /// <summary>Devolve um período válido para qualquer ID.</summary>
    private sealed class FakePeriodoRepository : IPeriodoRepository
    {
        public Task<Periodo?> GetByIdAsync(int id) => Task.FromResult<Periodo?>(CriarPeriodo());
        public Task<IEnumerable<Periodo>> ListAllAsync() => Task.FromResult<IEnumerable<Periodo>>([]);
        public Task<Periodo?> AddAsync(Periodo periodo) => Task.FromResult<Periodo?>(periodo);
        public Task<Periodo?> UpdateAsync(Periodo periodo) => Task.FromResult<Periodo?>(periodo);
        public Task<Periodo?> DeleteAsync(int id) => Task.FromResult<Periodo?>(null);
        public Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId) =>
            Task.FromResult<IEnumerable<Periodo>>([]);
    }

    private sealed class FakeConflitoSolicitacaoService : IConflitoSolicitacaoService
    {
        public Task<bool> PossuiConflitoAsync(Solicitacao solicitacao)
        {
            return Task.FromResult(false);
        }
    }

    private sealed class FakeSolicitacaoRepository : ISolicitacaoRepository
    {
        private readonly Solicitacao? _solicitacao;
        public bool UpdateCalled { get; private set; }

        public FakeSolicitacaoRepository(Solicitacao? solicitacao)
        {
            _solicitacao = solicitacao;
        }

        public Task<Solicitacao?> GetByIdAsync(int id) =>
            Task.FromResult(_solicitacao);

        public Task<List<Solicitacao>> GetAllAsync() =>
            Task.FromResult(_solicitacao is null
                ? new List<Solicitacao>()
                : new List<Solicitacao> { _solicitacao });

        public Task<List<Solicitacao>> GetByColaboradorIdAsync(int colaboradorId) =>
            GetAllAsync();

        public Task<List<Solicitacao>> GetByStatusAsync(StatusSolicitacao status) =>
            GetAllAsync();

        public Task AddAsync(Solicitacao solicitacao) => Task.CompletedTask;

        public Task UpdateAsync(Solicitacao solicitacao)
        {
            UpdateCalled = true;
            return Task.CompletedTask;
        }

        public Task DeleteAsync(int id) => Task.CompletedTask;
    }
}
