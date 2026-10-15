using ConflitosAgendaApi.Dtos.Periodos;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services;

namespace ConflitosAgendaApi.Tests.Services;

public class PeriodoServiceTests
{
    [Fact]
    public async Task AddAsync_DeveAceitarPeriodoEntreDezETrintaDias()
    {
        var repository = new FakePeriodoRepository();
        var service = new PeriodoService(repository);

        var resultado = await service.AddAsync(new PeriodoInsertionDto
        {
            DataInicio = new DateTime(2026, 10, 1),
            DataFim = new DateTime(2026, 10, 11)
        });

        Assert.NotNull(resultado);
        Assert.Single(repository.Periodos);
    }

    [Fact]
    public async Task AddAsync_DeveRejeitarPeriodoMenorQueDezDias()
    {
        var service = new PeriodoService(new FakePeriodoRepository());

        var exception = await Assert.ThrowsAsync<ArgumentException>(
            () => service.AddAsync(new PeriodoInsertionDto
            {
                DataInicio = new DateTime(2026, 10, 1),
                DataFim = new DateTime(2026, 10, 10)
            }));

        Assert.Contains("mínimo 10 dias", exception.Message);
    }

    [Fact]
    public async Task UpdateAsync_DeveRetornarNullQuandoPeriodoNaoExiste()
    {
        var service = new PeriodoService(new FakePeriodoRepository());

        var resultado = await service.UpdateAsync(
            99,
            new PeriodoUpdateDto
            {
                DataInicio = new DateTime(2026, 10, 1),
                DataFim = new DateTime(2026, 10, 11)
            });

        Assert.Null(resultado);
    }

    private sealed class FakePeriodoRepository : IPeriodoRepository
    {
        public List<Periodo> Periodos { get; } = [];

        public Task<Periodo?> GetByIdAsync(int id) =>
            Task.FromResult(Periodos.FirstOrDefault(periodo => periodo.Id == id));

        public Task<IEnumerable<Periodo>> ListAllAsync() =>
            Task.FromResult<IEnumerable<Periodo>>(Periodos);

        public Task<Periodo?> AddAsync(Periodo periodo)
        {
            Periodos.Add(periodo);
            return Task.FromResult<Periodo?>(periodo);
        }

        public Task<Periodo?> UpdateAsync(Periodo periodo) =>
            Task.FromResult<Periodo?>(periodo);

        public Task<Periodo?> DeleteAsync(int id) =>
            Task.FromResult<Periodo?>(null);

        public Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId) =>
            Task.FromResult<IEnumerable<Periodo>>([]);
    }
}
