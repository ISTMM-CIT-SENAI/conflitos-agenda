namespace ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Models;

public interface IColaboradorRepository
{
    Task<Colaborador?> GetByIdAsync(int id);
    Task<IEnumerable<Colaborador>> ListAllAsync();
    Task<Colaborador?> AddAsync(Colaborador colaborador);
    Task<Colaborador?> UpdateAsync(Colaborador colaborador);
    Task<Colaborador?> DeleteAsync(int id);
    /// <summary>Verifica se já existe colaborador com o nome (sem diferenciar maiúsculas).</summary>
    Task<bool> ExisteComNomeAsync(string nome, int? ignorarId = null);
}