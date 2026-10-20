using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services.Interfaces;

namespace ConflitosAgendaApi.Services;

public class SolicitacaoService : ISolicitacaoService
{
    private readonly ISolicitacaoRepository _solicitacaoRepository;
    private readonly IConflitoSolicitacaoService _conflitoSolicitacaoService;
    private readonly IColaboradorRepository _colaboradorRepository;
    private readonly IPeriodoRepository _periodoRepository;

    public SolicitacaoService(
        ISolicitacaoRepository solicitacaoRepository,
        IConflitoSolicitacaoService conflitoSolicitacaoService,
        IColaboradorRepository colaboradorRepository,
        IPeriodoRepository periodoRepository)
    {
        _solicitacaoRepository = solicitacaoRepository;
        _conflitoSolicitacaoService = conflitoSolicitacaoService;
        _colaboradorRepository = colaboradorRepository;
        _periodoRepository = periodoRepository;
    }

    public async Task<List<SolicitacaoResponseDto>> GetAllAsync()
    {
        var solicitacoes = await _solicitacaoRepository.GetAllAsync();

        var solicitacoesDto = solicitacoes.Select(s => new SolicitacaoResponseDto(s)).ToList();
        return solicitacoesDto;
    }

    public async Task<SolicitacaoResponseDto?> GetByIdAsync(int id)
    {
        var solicitacao = await _solicitacaoRepository.GetByIdAsync(id);

        return solicitacao is null ? null : new SolicitacaoResponseDto(solicitacao);
    }

    public async Task<List<SolicitacaoResponseDto>> GetByColaboradorIdAsync(int colaboradorId)
    {
        var solicitacoes = await _solicitacaoRepository.GetByColaboradorIdAsync(colaboradorId);
        return solicitacoes.Select(s => new SolicitacaoResponseDto(s)).ToList();
    }

    public async Task<List<SolicitacaoResponseDto>> GetByPeriodoIdAsync(int periodoId)
    {
        var solicitacoes = await _solicitacaoRepository.GetAllAsync();
        var solicitacoesDto = solicitacoes
            .Where(s => s.Periodos.Any(p => p.Id == periodoId))
            .Select(s => new SolicitacaoResponseDto(s)).ToList();

        return solicitacoesDto;
    }

    public async Task<List<SolicitacaoResponseDto>> GetByStatusAsync(StatusSolicitacao status)
    {
        var solicitacoes = await _solicitacaoRepository.GetByStatusAsync(status);

        var solicitacoesDto = solicitacoes.Select(s => new SolicitacaoResponseDto(s)).ToList();
        return solicitacoesDto;
    }

    public async Task<Solicitacao> AddAsync(SolicitacaoInsertionDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        if (dto.Periodos is null)
        {
            throw new ArgumentException(
                "A solicitação deve conter pelo menos um período.");
        }

        var solicitacao = new Solicitacao(
            await _colaboradorRepository.ObterColaboradorAsync(dto.Colaborador),
            await _periodoRepository.ObterPeriodosAsync(dto.Periodos),
            dto.Status,
            dto.CriadaEm,
            await _colaboradorRepository.ObterColaboradorAsync(dto.Coordenador, "Coordenador"),
            dto.Observacao,
            dto.Abono,
            dto.isPessoaCritica,
            dto.TotalDias);

        ValidarRegras(solicitacao);
        ValidarCoordenador(solicitacao);

        await _solicitacaoRepository.AddAsync(solicitacao);

        return solicitacao;
    }

    public async Task<Solicitacao?> UpdateAsync(
        int id,
        SolicitacaoUpdateDto dto,
        Usuario? decisor = null)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var solicitacao = await _solicitacaoRepository.GetByIdAsync(id);

        if (solicitacao is null)
        {
            return null;
        }

        if (dto.Periodos is null)
        {
            throw new ArgumentException(
                "A solicitação deve conter pelo menos um período.");
        }

        if (solicitacao.EstaDecidida)
        {
            throw new ArgumentException(
                "Solicitações aprovadas ou recusadas não podem ser alteradas.");
        }

        var periodos = await _periodoRepository.ObterPeriodosAsync(dto.Periodos);

        // Quantidade é validada antes de alterar a entidade; abono depende dos novos valores.
        if (!solicitacao.ValidarNumPeriodos(periodos))
        {
            throw new ArgumentException(
                "A solicitação deve conter entre 1 e 3 períodos.");
        }

        solicitacao.Atualizar(
            await _colaboradorRepository.ObterColaboradorAsync(dto.Colaborador),
            periodos,
            await _colaboradorRepository.ObterColaboradorAsync(dto.Coordenador, "Coordenador"),
            dto.Status,
            dto.Observacao,
            dto.TotalDias,
            dto.Abono,
            dto.isPessoaCritica);

        ValidarRegras(solicitacao);
        ValidarCoordenador(solicitacao);

        // Aprovar ou recusar registra a Decisão: quem decidiu e quando.
        if (solicitacao.EstaDecidida && decisor is not null)
        {
            solicitacao.RegistrarDecisao(decisor, DateTimeOffset.UtcNow);
        }

        await _solicitacaoRepository.UpdateAsync(solicitacao);

        return solicitacao;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var solicitacao = await _solicitacaoRepository.GetByIdAsync(id);

        if (solicitacao is null)
        {
            return false;
        }

        await _solicitacaoRepository.DeleteAsync(id);

        return true;
    }

    public async Task<bool> ValidateSolicitacaoAsync(int solicitacaoId)
    {
        var solicitacao = await _solicitacaoRepository.GetByIdAsync(solicitacaoId);

        if (solicitacao is null)
        {
            throw new KeyNotFoundException(
                $"Solicitação com ID {solicitacaoId} não encontrada.");
        }

        return !await _conflitoSolicitacaoService.PossuiConflitoAsync(solicitacao);

    }

    /// <summary>O Coordenador escolhido precisa ser coordenador e não pode ser o próprio solicitante.</summary>
    private static void ValidarCoordenador(Solicitacao solicitacao)
    {
        if (!solicitacao.Coordenador.IsCoordenador)
        {
            throw new ArgumentException(
                $"{solicitacao.Coordenador.Nome} não é coordenador.");
        }
        if (solicitacao.Coordenador.Id == solicitacao.Colaborador.Id)
        {
            throw new ArgumentException(
                "O coordenador não pode analisar a própria solicitação.");
        }
    }

    private static void ValidarRegras(
        Solicitacao solicitacao,
        IEnumerable<Periodo>? periodos = null)
    {
        if (!solicitacao.ValidarNumPeriodos(periodos))
        {
            throw new ArgumentException(
                "A solicitação deve conter entre 1 e 3 períodos.");
        }

        if (!solicitacao.ValidarAbono(periodos))
        {
            throw new ArgumentException(
                "A solicitação não atende aos critérios de abono.");
        }
    }
}