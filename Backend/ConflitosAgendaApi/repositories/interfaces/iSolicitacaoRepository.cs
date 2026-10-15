namespace ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Models;

public interface ISolicitacaoRepository
{
    Task<Solicitacao?> GetByIdAsync(int id);
    Task<List<Solicitacao>> GetAllAsync();
    Task<List<Solicitacao>> GetByColaboradorIdAsync(int colaboradorId);
    Task<List<Solicitacao>> GetByStatusAsync(StatusSolicitacao status);
    Task AddAsync(Solicitacao solicitacao);
    Task UpdateAsync(Solicitacao solicitacao);
    Task DeleteAsync(int id);
}