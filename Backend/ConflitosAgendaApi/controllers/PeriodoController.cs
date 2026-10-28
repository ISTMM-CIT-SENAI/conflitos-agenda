using Microsoft.AspNetCore.Mvc;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Services.Acesso;
using ConflitosAgendaApi.Dtos.Periodos;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PeriodoController : ControllerBase
{
    private readonly IPeriodoService _periodoService;
    private readonly IUsuarioAtualAccessor _usuarioAtual;
    private readonly IVisibilidadeService _visibilidade;

    public PeriodoController(
        IPeriodoService periodoService,
        IUsuarioAtualAccessor usuarioAtual,
        IVisibilidadeService visibilidade)
    {
        _periodoService = periodoService;
        _usuarioAtual = usuarioAtual;
        _visibilidade = visibilidade;
    }

    private async Task<IEnumerable<PeriodoResponseDto>> VisiveisAsync(IEnumerable<Periodo> periodos)
    {
        var usuario = await _usuarioAtual.ObterAsync();
        var visiveis = await _visibilidade.FiltrarPeriodosAsync(usuario, periodos);
        return visiveis.Select(p => new PeriodoResponseDto(p));
    }

    /// <summary>Só o dono do período (ou o Coordenador) cria, altera ou exclui.</summary>
    private async Task GarantirPodeGerenciarAsync(int idColaborador)
    {
        var usuario = await _usuarioAtual.ObterAsync();
        if (!RegrasAcesso.PodeGerenciarPeriodo(usuario, idColaborador))
        {
            throw new AcessoNegadoException("Você só pode gerenciar os seus próprios períodos.");
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var periodo = await _periodoService.GetByIdAsync(id);
        var visivel = periodo is null ? null : (await VisiveisAsync([periodo])).FirstOrDefault();
        if (visivel is null)
        {
            return NotFound();
        }

        return Ok(visivel);
    }

    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        return Ok(await VisiveisAsync(await _periodoService.ListAllAsync()));
    }

    [HttpPost]
    public async Task<IActionResult> Add(PeriodoInsertionDto dto)
    {
        await GarantirPodeGerenciarAsync(dto.IdColaborador);
        var novoPeriodo = await _periodoService.AddAsync(dto);

        if (novoPeriodo is null)
        {
            return BadRequest("Não foi possível adicionar o período.");
        }

        return CreatedAtAction(nameof(GetById), new { id = novoPeriodo.Id }, new PeriodoResponseDto(novoPeriodo));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, PeriodoUpdateDto dto)
    {
        var existente = await _periodoService.GetByIdAsync(id);
        if (existente is null)
        {
            return NotFound();
        }
        await GarantirPodeGerenciarAsync(existente.IdColaborador);
        await GarantirPodeGerenciarAsync(dto.IdColaborador);

        var periodoAtualizado = await _periodoService.UpdateAsync(id, dto);
        if (periodoAtualizado is null)
        {
            return NotFound();
        }

        return Ok(new PeriodoResponseDto(periodoAtualizado));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var periodo = await _periodoService.GetByIdAsync(id);
        if (periodo is null)
        {
            return NotFound();
        }
        await GarantirPodeGerenciarAsync(periodo.IdColaborador);

        await _periodoService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("colaborador/{colaboradorId}")]
    public async Task<IActionResult> ListByColaboradorId(int colaboradorId)
    {
        return Ok(await VisiveisAsync(await _periodoService.ListByColaboradorIdAsync(colaboradorId)));
    }
}
