namespace ConflitosAgendaApi.Services.Interfaces;

using ConflitosAgendaApi.Dtos.Colaboradores;
using ConflitosAgendaApi.Models;

public interface IColaboradorService
{
    Task<Colaborador?> GetByIdAsync(int id);
    Task<IEnumerable<Colaborador>> ListAllAsync();
    Task<Colaborador?> AddAsync(ColaboradorInsertionDto colaborador);
    Task<Colaborador?> UpdateAsync(int id, ColaboradorUpdateDto colaborador);
    Task<bool?> DeleteAsync(int id);
    Task<Colaborador?> TornarCoordenadorAsync(int id, ColaboradorUpdateDto colaborador);
}