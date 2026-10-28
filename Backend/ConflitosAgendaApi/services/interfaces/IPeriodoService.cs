namespace ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Dtos.Periodos;
using ConflitosAgendaApi.Models;

public interface IPeriodoService
{
    Task<Periodo?> GetByIdAsync(int id);
    Task<IEnumerable<Periodo>> ListAllAsync();
    Task<Periodo?> AddAsync(PeriodoInsertionDto periodo);
    Task<Periodo?> UpdateAsync(int id, PeriodoUpdateDto periodo);
    Task<bool?> DeleteAsync(int id);
    Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId);
    
}