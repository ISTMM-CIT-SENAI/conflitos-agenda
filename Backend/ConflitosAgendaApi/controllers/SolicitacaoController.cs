using Microsoft.AspNetCore.Mvc;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Services.Acesso;
using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;

namespace ConflitosAgendaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SolicitacaoController : ControllerBase
{
    private readonly ISolicitacaoService _solicitacaoService;
    private readonly IUsuarioAtualAccessor _usuarioAtual;
    private readonly IVisibilidadeService _visibilidade;
    private readonly IUsuarioRepository _usuarioRepository;

    public SolicitacaoController(
        ISolicitacaoService solicitacaoService,
        IUsuarioAtualAccessor usuarioAtual,
        IVisibilidadeService visibilidade,
        IUsuarioRepository usuarioRepository)
    {
        _solicitacaoService = solicitacaoService;
        _usuarioAtual = usuarioAtual;
        _visibilidade = visibilidade;
        _usuarioRepository = usuarioRepository;
    }

    private async Task<List<SolicitacaoResponseDto>> VisiveisAsync(IEnumerable<SolicitacaoResponseDto> solicitacoes)
    {
        var usuario = await _usuarioAtual.ObterAsync();
        return _visibilidade.FiltrarSolicitacoes(usuario, solicitacoes).ToList();
    }

    /// <summary>A Solicitação, se existir e o Usuário puder vê-la; senão, 404 (não revela que existe).</summary>
    private async Task<(UsuarioAtual Usuario, SolicitacaoResponseDto? Solicitacao)> ObterVisivelAsync(int id)
    {
        var usuario = await _usuarioAtual.ObterAsync();
        var solicitacao = await _solicitacaoService.GetByIdAsync(id);
        var visivel = solicitacao is not null
            && RegrasAcesso.PodeVerSolicitacao(usuario, solicitacao.Colaborador.Id, solicitacao.Supervisor.Id);
        return (usuario, visivel ? solicitacao : null);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var (_, solicitacao) = await ObterVisivelAsync(id);
        if (solicitacao is null)
        {
            return NotFound();
        }

        return Ok(solicitacao);
    }

    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        return Ok(await VisiveisAsync(await _solicitacaoService.GetAllAsync()));
    }

    [HttpGet("colaborador/{colaboradorId}")]
    public async Task<IActionResult> GetByColaboradorId(int colaboradorId)
    {
        var solicitacoes = await VisiveisAsync(await _solicitacaoService.GetByColaboradorIdAsync(colaboradorId));
        if (solicitacoes.Count == 0)
        {
            return NotFound($"Nenhuma solicitação encontrada para o colaborador com ID {colaboradorId}.");
        }

        return Ok(solicitacoes);
    }

    [HttpGet("periodo/{periodoId}")]
    public async Task<IActionResult> GetByPeriodoId(int periodoId)
    {
        var solicitacoes = await VisiveisAsync(await _solicitacaoService.GetByPeriodoIdAsync(periodoId));
        if (solicitacoes.Count == 0)
        {
            return NotFound($"Nenhuma solicitação encontrada para o período com ID {periodoId}.");
        }

        return Ok(solicitacoes);
    }

    [HttpGet("status/{status}")]
    public async Task<IActionResult> GetByStatus(StatusSolicitacao status)
    {
        var solicitacoes = await VisiveisAsync(await _solicitacaoService.GetByStatusAsync(status));
        if (solicitacoes.Count == 0)
        {
            return NotFound($"Nenhuma solicitação encontrada com o status '{status}'.");
        }

        return Ok(solicitacoes);
    }

    [HttpPost]
    public async Task<IActionResult> Add(SolicitacaoInsertionDto dto)
    {
        var usuario = await _usuarioAtual.ObterAsync();
        if (!RegrasAcesso.PodeEditarSolicitacao(usuario, dto.Colaborador?.Id ?? 0))
        {
            throw new AcessoNegadoException("Você só pode criar solicitações para você mesmo.");
        }

        var novaSolicitacao = await _solicitacaoService.AddAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = novaSolicitacao.Id }, new SolicitacaoResponseDto(novaSolicitacao));
    }

    /// <summary>
    /// Edita a Solicitação ou muda o status. Aprovar e recusar (status 2 e 3) cabem ao
    /// Supervisor encaminhado ou a um Coordenador, nunca ao solicitante; o Supervisor
    /// que não é dono só pode mudar o status, sem alterar o conteúdo.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, SolicitacaoUpdateDto dto)
    {
        var (usuario, atual) = await ObterVisivelAsync(id);
        if (atual is null)
        {
            return NotFound();
        }

        var ehDecisao = dto.Status is StatusSolicitacao.Aprovada or StatusSolicitacao.Recusada;
        if (ehDecisao && !RegrasAcesso.PodeDecidir(usuario, atual.Colaborador.Id, atual.Supervisor.Id))
        {
            throw new AcessoNegadoException(
                RegrasAcesso.EhDono(usuario, atual.Colaborador.Id)
                    ? "Você não pode aprovar ou recusar a sua própria solicitação."
                    : "Somente o supervisor encaminhado ou o coordenador pode aprovar ou recusar esta solicitação.");
        }

        if (!RegrasAcesso.PodeEditarSolicitacao(usuario, atual.Colaborador.Id))
        {
            // Supervisor encaminhado: pode mudar o status (validar, aprovar, recusar), não o conteúdo.
            if (!RegrasAcesso.AlteraSomenteStatus(atual, dto))
            {
                throw new AcessoNegadoException("Você só pode alterar o status desta solicitação.");
            }
        }

        var decisor = ehDecisao ? await _usuarioRepository.GetByIdAsync(usuario.UsuarioId) : null;
        var solicitacaoAtualizada = await _solicitacaoService.UpdateAsync(id, dto, decisor);
        if (solicitacaoAtualizada is null)
        {
            return NotFound();
        }

        return Ok(new SolicitacaoResponseDto(solicitacaoAtualizada));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var (usuario, solicitacao) = await ObterVisivelAsync(id);
        if (solicitacao is null)
        {
            return NotFound();
        }
        if (!RegrasAcesso.PodeExcluirSolicitacao(usuario, solicitacao.Colaborador.Id, solicitacao.Status))
        {
            throw new AcessoNegadoException(
                "Somente o próprio colaborador, antes da decisão, ou um coordenador pode excluir esta solicitação.");
        }

        await _solicitacaoService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPut("{id}/validate")]
    public async Task<IActionResult> ValidarSolicitacao(int id)
    {
        var (usuario, solicitacao) = await ObterVisivelAsync(id);
        if (solicitacao is null)
        {
            return NotFound();
        }
        if (!RegrasAcesso.PodeValidarConflito(usuario, solicitacao.Colaborador.Id, solicitacao.Supervisor.Id))
        {
            throw new AcessoNegadoException();
        }

        var resultado = await _solicitacaoService.ValidateSolicitacaoAsync(id);
        if (!resultado)
        {
            return BadRequest("Conflito encontrado: a ausência coincide com a de outra pessoa crítica do mesmo projeto.");
        }

        return Ok(resultado);
    }
}
