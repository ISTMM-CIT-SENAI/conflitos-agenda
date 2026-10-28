using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services.Interfaces;

namespace ConflitosAgendaApi.Services;

/// <summary>
/// Conflito (ver CONTEXT.md): um Período da Solicitação se sobrepõe a um Período de outra
/// Solicitação, não Recusada, de uma Pessoa Crítica de um Projeto do qual o solicitante participa.
/// Espelha <c>detectarConflitos</c> do frontend.
/// </summary>
public sealed class ConflitoSolicitacaoService : IConflitoSolicitacaoService
{
    private readonly IProjetoRepository _projetoRepository;
    private readonly ISolicitacaoRepository _solicitacaoRepository;

    public ConflitoSolicitacaoService(
        IProjetoRepository projetoRepository,
        ISolicitacaoRepository solicitacaoRepository)
    {
        _projetoRepository = projetoRepository;
        _solicitacaoRepository = solicitacaoRepository;
    }

    public async Task<bool> PossuiConflitoAsync(Solicitacao solicitacao)
    {
        ArgumentNullException.ThrowIfNull(solicitacao);

        if (solicitacao.Periodos.Count == 0)
        {
            throw new ArgumentException("A solicitação deve conter pelo menos um período.");
        }

        var colaborador = solicitacao.Colaborador
            ?? throw new ArgumentException("A solicitação deve conter um colaborador válido.");

        var pessoasCriticas = (await _projetoRepository.ListProjetosByColaboradorIdAsync(colaborador.Id))
            .SelectMany(projeto => projeto.PessoasCriticas)
            .Select(pessoa => pessoa.Id)
            .Where(id => id != colaborador.Id)
            .ToHashSet();

        var periodosDasPessoasCriticas = (await _solicitacaoRepository.GetAllAsync())
            .Where(outra => outra.Id != solicitacao.Id
                && outra.Status != StatusSolicitacao.Recusada
                && pessoasCriticas.Contains(outra.Colaborador.Id))
            .SelectMany(outra => outra.Periodos);

        return periodosDasPessoasCriticas.Any(existente => solicitacao.Periodos.Any(periodo =>
            periodo.DataInicio < existente.DataFim && periodo.DataFim > existente.DataInicio));
    }
}
