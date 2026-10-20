using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services;

namespace ConflitosAgendaApi.Tests.Services;

public class ConflitoSolicitacaoServiceTests
{
    [Fact]
    public async Task PossuiConflitoAsync_DeveRetornarTrueQuandoPeriodosSeSobrepoem()
    {
        var colaborador = CriarColaborador(1);
        var pessoaCritica = CriarColaborador(2);
        var projeto = CriarProjeto(colaborador, pessoaCritica);
        var repository = new FakeProjetoRepository(
            [projeto],
            [projeto]);
        var periodoRepository = new FakePeriodoRepository(
            new Dictionary<int, IEnumerable<Periodo>>
            {
                [2] = [CriarPeriodo(10, 20)]
            });
        var service = new ConflitoSolicitacaoService(repository, periodoRepository);

        var solicitacao = CriarSolicitacao(colaborador, CriarPeriodo(15, 25));

        Assert.True(await service.PossuiConflitoAsync(solicitacao));
    }

    [Fact]
    public async Task PossuiConflitoAsync_DeveRetornarFalseQuandoPeriodosSaoAdjacentes()
    {
        var colaborador = CriarColaborador(1);
        var pessoaCritica = CriarColaborador(2);
        var projeto = CriarProjeto(colaborador, pessoaCritica);
        var service = new ConflitoSolicitacaoService(
            new FakeProjetoRepository([projeto], [projeto]),
            new FakePeriodoRepository(new Dictionary<int, IEnumerable<Periodo>>
            {
                [2] = [CriarPeriodo(20, 30)]
            }));

        var solicitacao = CriarSolicitacao(colaborador, CriarPeriodo(10, 20));

        Assert.False(await service.PossuiConflitoAsync(solicitacao));
    }

    [Fact]
    public async Task PossuiConflitoAsync_DeveRejeitarSolicitacaoSemPeriodos()
    {
        var service = new ConflitoSolicitacaoService(
            new FakeProjetoRepository([], []),
            new FakePeriodoRepository(new Dictionary<int, IEnumerable<Periodo>>()));
        var solicitacao = CriarSolicitacao(CriarColaborador(1), null);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.PossuiConflitoAsync(solicitacao));
    }

    private static Projeto CriarProjeto(
        Colaborador colaborador,
        Colaborador pessoaCritica)
    {
        return new Projeto(
            "Projeto",
            [colaborador, pessoaCritica],
            [colaborador]);
    }

    private static Solicitacao CriarSolicitacao(
        Colaborador colaborador,
        Periodo? periodo)
    {
        return new Solicitacao(
            colaborador,
            periodo is null ? [] : [periodo],
            StatusSolicitacao.Em_Analise,
            DateTimeOffset.UtcNow,
            CriarColaborador(3));
    }

    private static Colaborador CriarColaborador(int id)
    {
        var colaborador = new Colaborador($"Pessoa {id}", new(), false);
        typeof(Colaborador)
            .GetProperty(nameof(Colaborador.Id))!
            .SetValue(colaborador, id);
        return colaborador;
    }

    private static Periodo CriarPeriodo(int inicio, int fim)
    {
        var periodo = new Periodo(
            new DateTime(2026, 10, inicio),
            new DateTime(2026, 10, fim));
        return periodo;
    }

    private sealed class FakeProjetoRepository : IProjetoRepository
    {
        private readonly IEnumerable<Projeto> _colaboradorProjetos;
        private readonly IEnumerable<Projeto> _criticoProjetos;

        public FakeProjetoRepository(
            IEnumerable<Projeto> colaboradorProjetos,
            IEnumerable<Projeto> criticoProjetos)
        {
            _colaboradorProjetos = colaboradorProjetos;
            _criticoProjetos = criticoProjetos;
        }

        public Task<Projeto?> GetByIdAsync(int id) => Task.FromResult<Projeto?>(null);
        public Task<IEnumerable<Projeto>> ListAllAsync() => Task.FromResult<IEnumerable<Projeto>>([]);
        public Task<Projeto?> AddAsync(Projeto projeto) => Task.FromResult<Projeto?>(projeto);
        public Task<Projeto?> UpdateAsync(Projeto projeto) => Task.FromResult<Projeto?>(projeto);
        public Task<Projeto?> DeleteAsync(int id) => Task.FromResult<Projeto?>(null);

        public Task<IEnumerable<Projeto>> ListProjetosByColaboradorIdAsync(int colaboradorId) =>
            Task.FromResult(_colaboradorProjetos);

        public Task<IEnumerable<Projeto>> ListProjetosByPessoasCriticasIdAsync(int pessoaCriticaId) =>
            Task.FromResult(_criticoProjetos);
    }

    private sealed class FakePeriodoRepository : IPeriodoRepository
    {
        private readonly IReadOnlyDictionary<int, IEnumerable<Periodo>> _periodos;

        public FakePeriodoRepository(IReadOnlyDictionary<int, IEnumerable<Periodo>> periodos)
        {
            _periodos = periodos;
        }

        public Task<Periodo?> GetByIdAsync(int id) => Task.FromResult<Periodo?>(null);
        public Task<IEnumerable<Periodo>> ListAllAsync() => Task.FromResult<IEnumerable<Periodo>>([]);
        public Task<Periodo?> AddAsync(Periodo periodo) => Task.FromResult<Periodo?>(periodo);
        public Task<Periodo?> UpdateAsync(Periodo periodo) => Task.FromResult<Periodo?>(periodo);
        public Task<Periodo?> DeleteAsync(int id) => Task.FromResult<Periodo?>(null);

        public Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId) =>
            Task.FromResult(_periodos.TryGetValue(colaboradorId, out var periodos)
                ? periodos
                : Enumerable.Empty<Periodo>());
    }
}
