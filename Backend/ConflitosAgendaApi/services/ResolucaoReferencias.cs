using ConflitosAgendaApi.Dtos.Referencias;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;

namespace ConflitosAgendaApi.Services;

/// <summary>
/// Converte as referências recebidas nos payloads em entidades carregadas do banco.
/// Usar as entidades rastreadas pelo EF (e não objetos desserializados) evita que
/// registros vazios sejam inseridos no lugar dos existentes.
/// </summary>
internal static class ResolucaoReferencias
{
    public static async Task<Colaborador> ObterColaboradorAsync(
        this IColaboradorRepository repository,
        ColaboradorReferenciaDto? referencia,
        string papel = "Colaborador")
    {
        if (referencia is null)
        {
            throw new ArgumentException($"{papel} não informado.");
        }

        return await repository.GetByIdAsync(referencia.Id)
            ?? throw new ArgumentException($"{papel} com ID {referencia.Id} não encontrado.");
    }

    public static async Task<List<Colaborador>> ObterColaboradoresAsync(
        this IColaboradorRepository repository,
        IEnumerable<ColaboradorReferenciaDto> referencias)
    {
        var colaboradores = new List<Colaborador>();
        foreach (var referencia in referencias.DistinctBy(r => r.Id))
        {
            colaboradores.Add(await repository.ObterColaboradorAsync(referencia));
        }
        return colaboradores;
    }

    public static async Task<List<Periodo>> ObterPeriodosAsync(
        this IPeriodoRepository repository,
        IEnumerable<PeriodoReferenciaDto> referencias)
    {
        var periodos = new List<Periodo>();
        foreach (var referencia in referencias.DistinctBy(r => r.Id))
        {
            periodos.Add(await repository.GetByIdAsync(referencia.Id)
                ?? throw new ArgumentException($"Período com ID {referencia.Id} não encontrado."));
        }
        return periodos;
    }
}
