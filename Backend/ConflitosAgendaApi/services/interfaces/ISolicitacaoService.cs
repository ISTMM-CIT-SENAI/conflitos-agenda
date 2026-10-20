namespace ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;

public interface ISolicitacaoService
{
    Task<List<SolicitacaoResponseDto>> GetAllAsync();
    Task<SolicitacaoResponseDto?> GetByIdAsync(int id);
    Task<List<SolicitacaoResponseDto>> GetByColaboradorIdAsync(int colaboradorId);
    Task<List<SolicitacaoResponseDto>> GetByPeriodoIdAsync(int periodoId);
    Task<List<SolicitacaoResponseDto>> GetByStatusAsync(StatusSolicitacao status);
    Task<Solicitacao> AddAsync(SolicitacaoInsertionDto solicitacao);
    /// <param name="decisor">Usuário que aprova ou recusa; registrado quando o novo status é uma Decisão.</param>
    Task<Solicitacao?> UpdateAsync(int id, SolicitacaoUpdateDto solicitacao, Usuario? decisor = null);
    Task<bool> DeleteAsync(int id);
    Task<bool> ValidateSolicitacaoAsync(int solicitacaoId);
}