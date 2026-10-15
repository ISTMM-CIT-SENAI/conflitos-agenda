using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services.Interfaces;

namespace ConflitosAgendaApi.Services;

public sealed class ConflitoSolicitacaoService : IConflitoSolicitacaoService
{
    private readonly IProjetoRepository _projetoRepository;
    private readonly IPeriodoRepository _periodoRepository;

    public ConflitoSolicitacaoService(
        IProjetoRepository projetoRepository,
        IPeriodoRepository periodoRepository)
    {
        _projetoRepository = projetoRepository;
        _periodoRepository = periodoRepository;
    }

    public async Task<bool> PossuiConflitoAsync(Solicitacao solicitacao)
    {
        ArgumentNullException.ThrowIfNull(solicitacao);

        if (solicitacao.Periodos.Count == 0)
        {
            throw new ArgumentException("A solicitação deve conter pelo menos um período.");
        }

        var colaborador = solicitacao.Colaborador;
        if (colaborador is null)
        {
            throw new ArgumentException("A solicitação deve conter um colaborador válido.");
        }

        var projetosDoColaborador =
            await _projetoRepository.ListProjetosByColaboradorIdAsync(colaborador.Id);
        var projetosOndeEleEcritico =
            await _projetoRepository.ListProjetosByPessoasCriticasIdAsync(colaborador.Id);

        var idsProjetosDoColaborador = projetosDoColaborador
            .Select(projeto => projeto.Id)
            .ToHashSet();

        var projetosRelevantes = projetosOndeEleEcritico
            .Where(projeto => idsProjetosDoColaborador.Contains(projeto.Id))
            .ToList();

        var idsOutrasPessoasCriticas = projetosRelevantes
            .SelectMany(projeto => projeto.PessoasCriticas)
            .Where(pessoa => pessoa.Id != colaborador.Id)
            .Select(pessoa => pessoa.Id)
            .Distinct()
            .ToList();

        foreach (var pessoaCriticaId in idsOutrasPessoasCriticas)
        {
            var periodosDaPessoaCritica =
                await _periodoRepository.ListByColaboradorIdAsync(pessoaCriticaId);

            var existeConflito = solicitacao.Periodos.Any(periodoSolicitacao =>
                periodosDaPessoaCritica.Any(periodoExistente =>
                    periodoSolicitacao.DataInicio < periodoExistente.DataFim &&
                    periodoSolicitacao.DataFim > periodoExistente.DataInicio));

            if (existeConflito)
            {
                return true;
            }
        }

        return false;
    }
}
