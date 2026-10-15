using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Services.Interfaces;

public interface IConflitoSolicitacaoService
{
    Task<bool> PossuiConflitoAsync(Solicitacao solicitacao);
}
