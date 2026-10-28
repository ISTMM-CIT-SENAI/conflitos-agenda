using ConflitosAgendaApi.Dtos.Periodos;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Repositories.Interfaces;

namespace ConflitosAgendaApi.Services;

public class PeriodoService : IPeriodoService
{
    private readonly IPeriodoRepository _periodoRepository;
    private readonly ISolicitacaoRepository _solicitacaoRepository;

    public PeriodoService(IPeriodoRepository periodoRepository, ISolicitacaoRepository solicitacaoRepository)
    {
        _periodoRepository = periodoRepository;
        _solicitacaoRepository = solicitacaoRepository;
    }

    /// <summary>A solicitação que usa o período (no banco, um período pertence a no máximo uma).</summary>
    private async Task<List<Solicitacao>> SolicitacoesComPeriodoAsync(int periodoId) =>
        (await _solicitacaoRepository.GetAllAsync())
            .Where(s => s.Periodos.Any(p => p.Id == periodoId))
            .ToList();

    public async Task<Periodo?> GetByIdAsync(int id)
    {
        var periodo = await _periodoRepository.GetByIdAsync(id);

        if (periodo == null)
        {
            return null;
        }
        
        return periodo;
    }
    public async Task<IEnumerable<Periodo>> ListAllAsync()
    {
        return await _periodoRepository.ListAllAsync();
    }
    public async Task<Periodo?> AddAsync(PeriodoInsertionDto periodo)
    {
        if (periodo == null)
        {
            throw new ArgumentNullException(nameof(periodo));
        }

        RegrasFerias.ValidarPeriodo(periodo.DataInicio, periodo.DataFim);

        var novoPeriodo = await _periodoRepository.AddAsync(new Periodo(periodo.DataInicio, periodo.DataFim, periodo.IdColaborador));

        return novoPeriodo;
    }
    public async Task<Periodo?> UpdateAsync(int id, PeriodoUpdateDto periodo)
    {
        if (periodo == null)
        {
            throw new ArgumentNullException(nameof(periodo));
        }

        RegrasFerias.ValidarPeriodo(periodo.DataInicio, periodo.DataFim);

        var periodoExistente = await _periodoRepository.GetByIdAsync(id);
        if (periodoExistente is null)
        {
            return null;
        }

        // Uma solicitação decidida não muda; uma em aberto precisa continuar dentro das regras do ano.
        foreach (var solicitacao in await SolicitacoesComPeriodoAsync(id))
        {
            if (solicitacao.EstaDecidida)
            {
                throw new ArgumentException(
                    $"Este período faz parte da solicitação #{solicitacao.Id}, que já foi decidida, e não pode ser alterado.");
            }
            if (periodo.IdColaborador > 0 && periodo.IdColaborador != periodoExistente.IdColaborador)
            {
                throw new ArgumentException("O colaborador não pode ser trocado: o período já faz parte de uma solicitação.");
            }
            var novos = solicitacao.Periodos
                .Select(p => p.Id == id ? new Periodo(periodo.DataInicio, periodo.DataFim, p.IdColaborador) : p)
                .ToList();
            RegrasFerias.ValidarFeriasDoAno(
                solicitacao.Colaborador.Nome,
                await _solicitacaoRepository.GetByColaboradorIdAsync(solicitacao.Colaborador.Id),
                novos,
                solicitacao.Abono,
                solicitacao.Id);
        }

        periodoExistente.Atualizar(periodo.DataInicio, periodo.DataFim, periodo.IdColaborador);
        var periodoAtualizado = await _periodoRepository.UpdateAsync(periodoExistente);

        return periodoAtualizado;
    }
    public async Task<bool?> DeleteAsync(int id)
    {
        var periodo = await _periodoRepository.GetByIdAsync(id);

        if (periodo == null)
        {
            throw new ArgumentNullException("O período informado não existe.");
        }
        var vinculada = (await SolicitacoesComPeriodoAsync(id)).FirstOrDefault();
        if (vinculada is not null)
        {
            throw new ArgumentException(
                $"Este período faz parte da solicitação #{vinculada.Id}. Remova-o da solicitação antes de excluí-lo.");
        }

        await _periodoRepository.DeleteAsync(id);
        return true;
    }
    public async Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId)
    {
        return await _periodoRepository.ListByColaboradorIdAsync(colaboradorId);
    }
}
