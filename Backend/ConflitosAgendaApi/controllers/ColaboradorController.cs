using ConflitosAgendaApi.Services.Acesso;
using Microsoft.AspNetCore.Authorization;
using ConflitosAgendaApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using ConflitosAgendaApi.Dtos.Colaboradores;


namespace ConflitosAgendaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ColaboradorController : ControllerBase
{
    private readonly IColaboradorService _colaboradorService;

    public ColaboradorController(IColaboradorService colaboradorService)
    {
        _colaboradorService = colaboradorService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var colaborador = await _colaboradorService.GetByIdAsync(id);

        if (colaborador is null)
        {
            return NotFound();
        }

        return Ok(new ColaboradorResponseDto(colaborador));
    }

    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        var colaboradores = await _colaboradorService.ListAllAsync();
        return Ok(colaboradores.Select(c => new ColaboradorResponseDto(c)));
    }

    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpPost]
    public async Task<IActionResult> Add(ColaboradorInsertionDto dto)
    {
        var novoColaborador = await _colaboradorService.AddAsync(dto);

        if (novoColaborador is null)
        {
            return BadRequest("Não foi possível adicionar o colaborador.");
        }

        return CreatedAtAction(nameof(GetById), new { id = novoColaborador.Id }, new ColaboradorResponseDto(novoColaborador));
    }

    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ColaboradorUpdateDto dto)
    {
        var colaboradorAtualizado = await _colaboradorService.UpdateAsync(id, dto);

        if (colaboradorAtualizado is null)
        {
            return NotFound();
        }

        return Ok(new ColaboradorResponseDto(colaboradorAtualizado));
    }

    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var colaborador = await _colaboradorService.GetByIdAsync(id);

        if (colaborador is null)
        {
            return NotFound();
        }

        await _colaboradorService.DeleteAsync(id);
        return NoContent();
    }
    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpPut("{id}/coordinator")]
    public async Task<IActionResult> TornarCoordenador(int id, ColaboradorUpdateDto dto)
    {
        var colaborador = await _colaboradorService.GetByIdAsync(id);

        if (colaborador is null)
        {
            return NotFound();
        }

        var resultado = await _colaboradorService.TornarCoordenadorAsync(id, dto);

        if (resultado is null)
        {
            return BadRequest("Não foi possível tornar o colaborador um coordenador.");
        }

        return Ok(new ColaboradorResponseDto(resultado));
    }
}