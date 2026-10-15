using Microsoft.AspNetCore.Mvc;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Dtos.Periodos;

namespace ConflitosAgendaApi.Controllers;
[ApiController]
[Route("api/[controller]")]
public class PeriodoController : ControllerBase
{
    private readonly IPeriodoService _periodoService;

    public PeriodoController(IPeriodoService periodoService)
    {
        _periodoService = periodoService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var periodo = await _periodoService.GetByIdAsync(id);

        if (periodo is null)
        {
            return NotFound();
        }

        return Ok(new PeriodoResponseDto(periodo));
    }

    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        var periodos = await _periodoService.ListAllAsync();
        return Ok(periodos.Select(p => new PeriodoResponseDto(p)));
    }

    [HttpPost]
    public async Task<IActionResult> Add(PeriodoInsertionDto dto)
    {
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

        await _periodoService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("colaborador/{colaboradorId}")]
    public async Task<IActionResult> ListByColaboradorId(int colaboradorId)
    {
        var periodos = await _periodoService.ListByColaboradorIdAsync(colaboradorId);
        return Ok(periodos.Select(p => new PeriodoResponseDto(p)));
    }

    [HttpGet("validar/{periodoId}")]
    public async Task<IActionResult> ValidarPeriodo(int periodoId)
    {
        var resultadoValidacao = await _periodoService.ValidarPeriodoAsync(periodoId);

        if (!resultadoValidacao)
        {
            return BadRequest("O período informado é inválido.");
        }

        return Ok();
    }

    [HttpGet("validar")]
    public async Task<IActionResult> ValidarPeriodo(DateTime dataInicio, DateTime dataFim)
    {
        var resultadoValidacao = await _periodoService.ValidarPeriodoAsync(dataInicio, dataFim);

        if (!resultadoValidacao)
        {
            return BadRequest("A data de início deve ser anterior à data de fim.");
        }

        return Ok();
    }

}