namespace ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Dtos.Projetos;
using ConflitosAgendaApi.Models;

public interface IProjetoService
{
    Task<Projeto?> GetByIdAsync(int id);
    Task<IEnumerable<Projeto>> ListAllAsync();
    Task<Projeto?> AddAsync(ProjetoInsertionDto projeto);
    Task<Projeto?> UpdateAsync(int id, ProjetoUpdateDto projeto);
    Task<bool?> DeleteAsync(int id);
    Task<IEnumerable<Colaborador>> ListColaboradoresAsync(int projetoId);
    

}