using Microsoft.AspNetCore.Mvc;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Controllers;
[ApiController]
[Route("api/[controller]")]
public class SolicitacaoController : ControllerBase
{
    private readonly ISolicitacaoService _solicitacaoService;

    public SolicitacaoController(ISolicitacaoService solicitacaoService)
    {
        _solicitacaoService = solicitacaoService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var solicitacao = await _solicitacaoService.GetByIdAsync(id);

        if (solicitacao is null)
        {
            return NotFound();
        }

        return Ok(solicitacao);
    }

    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        var solicitacoes = await _solicitacaoService.GetAllAsync();
        return Ok(solicitacoes);
    }

    [HttpGet("colaborador/{colaboradorId}")]
    public async Task<IActionResult> GetByColaboradorId(int colaboradorId)
    {
        var solicitacoes = await _solicitacaoService.GetByColaboradorIdAsync(colaboradorId);

        if (solicitacoes is null || !solicitacoes.Any())
        {
            return NotFound($"Nenhuma solicitação encontrada para o colaborador com ID {colaboradorId}.");
        }

        return Ok(solicitacoes);
    }

    [HttpGet("periodo/{periodoId}")]
    public async Task<IActionResult> GetByPeriodoId(int periodoId)
    {
        var solicitacoes = await _solicitacaoService.GetByPeriodoIdAsync(periodoId);

        if (solicitacoes is null || !solicitacoes.Any())
        {
            return NotFound($"Nenhuma solicitação encontrada para o período com ID {periodoId}.");
        }

        return Ok(solicitacoes);
    }

    [HttpGet("projeto/{projetoId}")]
    public Task<IActionResult> GetByPeriodoLegacy(int projetoId)
    {
        return GetByPeriodoId(projetoId);
    }

    [HttpGet("status/{status}")]
    public async Task<IActionResult> GetByStatus(StatusSolicitacao status)
    {
        var solicitacoes = await _solicitacaoService.GetByStatusAsync(status);

        if (solicitacoes is null || !solicitacoes.Any())
        {
            return NotFound($"Nenhuma solicitação encontrada com o status '{status}'.");
        }

        return Ok(solicitacoes);
    }

    [HttpPost]
    public async Task<IActionResult> Add(SolicitacaoInsertionDto dto)
    {
        var novaSolicitacao = await _solicitacaoService.AddAsync(dto);

        if (novaSolicitacao is null)
        {
            return BadRequest("Não foi possível adicionar a solicitação.");
        }

        return CreatedAtAction(nameof(GetById), new { id = novaSolicitacao.Id }, new SolicitacaoResponseDto(novaSolicitacao));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, SolicitacaoUpdateDto dto)
    {
        var solicitacaoAtualizada = await _solicitacaoService.UpdateAsync(id, dto);

        if (solicitacaoAtualizada is null)
        {
            return NotFound();
        }

        return Ok(new SolicitacaoResponseDto(solicitacaoAtualizada));
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var resultado = await _solicitacaoService.GetByIdAsync(id);

        if (resultado is null)
        {
            return NotFound();
        }

        await _solicitacaoService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPut("{id}/validate")]
    public async Task<IActionResult> ValidarSolicitacao(int id)
    {
        var resultado = await _solicitacaoService.ValidateSolicitacaoAsync(id);
        
        if(!resultado)
        {
            return BadRequest("Conflito encontrado: a ausência coincide com a de outra pessoa crítica do mesmo projeto.");
        }
        return Ok(resultado);

    }
    
}