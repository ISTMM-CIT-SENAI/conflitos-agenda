namespace ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Models;

public interface IColaboradorRepository
{
    Task<Colaborador?> GetByIdAsync(int id);
    Task<IEnumerable<Colaborador>> ListAllAsync();
    Task<Colaborador?> AddAsync(Colaborador colaborador);
    Task<Colaborador?> UpdateAsync(Colaborador colaborador);
    Task<Colaborador?> DeleteAsync(int id);
    Task<Colaborador?> TornarCoordenadorAsync(int id);
}