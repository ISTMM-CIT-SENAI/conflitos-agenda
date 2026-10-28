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
    private readonly IUsuarioRepository _usuarioRepository;

    public SolicitacaoService(
        ISolicitacaoRepository solicitacaoRepository,
        IConflitoSolicitacaoService conflitoSolicitacaoService,
        IColaboradorRepository colaboradorRepository,
        IPeriodoRepository periodoRepository,
        IUsuarioRepository usuarioRepository)
    {
        _solicitacaoRepository = solicitacaoRepository;
        _conflitoSolicitacaoService = conflitoSolicitacaoService;
        _colaboradorRepository = colaboradorRepository;
        _periodoRepository = periodoRepository;
        _usuarioRepository = usuarioRepository;
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

    /// <summary>
    /// Cria a Solicitação e a encaminha a quem o colaborador responde. A do Coordenador,
    /// que não responde a ninguém no sistema, já nasce aprovada (aprovação feita fora dele).
    /// </summary>
    public async Task<Solicitacao> AddAsync(SolicitacaoInsertionDto dto)
    {
        ArgumentNullException.ThrowIfNull(dto);

        var colaborador = await _colaboradorRepository.ObterColaboradorAsync(dto.Colaborador);
        var periodos = await _periodoRepository.ObterPeriodosAsync(dto.Periodos ?? new());
        await ValidarFeriasAsync(colaborador, periodos, dto.Abono, ignorarSolicitacaoId: null);

        var usuario = await _usuarioRepository.GetByColaboradorIdAsync(colaborador.Id);
        var ehCoordenadorSemSuperior = colaborador.RespondeAId is null && usuario is { IsCoordenador: true };
        var supervisor = ehCoordenadorSemSuperior
            ? colaborador
            : await _colaboradorRepository.GetByIdAsync(colaborador.RespondeAId ?? 0)
                ?? throw new ArgumentException(
                    $"{colaborador.Nome} não tem a quem responder cadastrado. Peça ao coordenador para preencher \"Responde a\".");

        var solicitacao = new Solicitacao(
            colaborador,
            periodos,
            StatusSolicitacao.Em_Analise,
            dto.CriadaEm,
            supervisor,
            dto.Observacao,
            dto.Abono,
            dto.isPessoaCritica,
            periodos.Sum(p => RegrasFerias.Dias(p.DataInicio, p.DataFim)));

        if (ehCoordenadorSemSuperior)
        {
            solicitacao.Aprovar();
            solicitacao.RegistrarDecisao(usuario!, DateTimeOffset.UtcNow);
        }

        await _solicitacaoRepository.AddAsync(solicitacao);

        return solicitacao;
    }

    /// <summary>Edita ou muda o status. O supervisor encaminhado não muda.</summary>
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

        if (solicitacao.EstaDecidida)
        {
            throw new ArgumentException(
                "Solicitações aprovadas ou recusadas não podem ser alteradas.");
        }

        // Trocar o colaborador deixaria a solicitação com o supervisor de outra pessoa.
        if (dto.Colaborador?.Id != solicitacao.Colaborador.Id)
        {
            throw new ArgumentException("O colaborador da solicitação não pode ser trocado.");
        }

        var colaborador = solicitacao.Colaborador;
        var periodos = await _periodoRepository.ObterPeriodosAsync(dto.Periodos ?? new());
        var abono = dto.Abono ?? solicitacao.Abono;
        await ValidarFeriasAsync(colaborador, periodos, abono, ignorarSolicitacaoId: id);

        solicitacao.Atualizar(
            periodos,
            dto.Status,
            dto.Observacao,
            periodos.Sum(p => RegrasFerias.Dias(p.DataInicio, p.DataFim)),
            abono,
            dto.isPessoaCritica);

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

    /// <summary>Regras da CLT para o pedido e para o saldo do ano (ver <see cref="RegrasFerias.ValidarFeriasDoAno"/>).</summary>
    private async Task ValidarFeriasAsync(
        Colaborador colaborador,
        List<Periodo> periodos,
        bool abono,
        int? ignorarSolicitacaoId)
    {
        // Sem isto, o período de outra pessoa sairia da solicitação dela e viria para esta.
        if (periodos.Any(p => p.IdColaborador != colaborador.Id))
        {
            throw new ArgumentException("Todos os períodos devem pertencer ao colaborador da solicitação.");
        }

        RegrasFerias.ValidarFeriasDoAno(
            colaborador.Nome,
            await _solicitacaoRepository.GetByColaboradorIdAsync(colaborador.Id),
            periodos,
            abono,
            ignorarSolicitacaoId);
    }
}
