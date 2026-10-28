namespace ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Models;

public interface IProjetoRepository
{
    Task<Projeto?> GetByIdAsync(int id);
    Task<IEnumerable<Projeto>> ListAllAsync();
    Task<Projeto?> AddAsync(Projeto projeto);
    Task<Projeto?> UpdateAsync(Projeto projeto);
    Task<Projeto?> DeleteAsync(int id);

    Task<IEnumerable<Projeto>> ListProjetosByColaboradorIdAsync(int colaboradorId);
}