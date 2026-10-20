using ConflitosAgendaApi.Services.Acesso;
using Microsoft.AspNetCore.Authorization;
using ConflitosAgendaApi.Dtos.Colaboradores;
using Microsoft.AspNetCore.Mvc;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Dtos.Projetos;

namespace ConflitosAgendaApi.Controllers;
[ApiController]
[Route("api/[controller]")]
public class ProjetoController : ControllerBase
{
    private readonly IProjetoService _projetoService;

    public ProjetoController(IProjetoService projetoService)
    {
        _projetoService = projetoService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var projeto = await _projetoService.GetByIdAsync(id);

        if (projeto is null)
        {
            return NotFound();
        }

        return Ok(new ProjetoResponseDto(projeto));
    }
    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        var projetos = await _projetoService.ListAllAsync();
        return Ok(projetos.Select(p => new ProjetoResponseDto(p)));
    }

    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpPost]
    public async Task<IActionResult> Add(ProjetoInsertionDto dto)
    {
        var novoProjeto = await _projetoService.AddAsync(dto);

        if (novoProjeto is null)
        {
            return BadRequest("Não foi possível adicionar o projeto.");
        }

        return CreatedAtAction(nameof(GetById), new { id = novoProjeto.Id }, new ProjetoResponseDto(novoProjeto));
    }

    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, ProjetoUpdateDto dto)
    {
        var projetoAtualizado = await _projetoService.UpdateAsync(id, dto);

        if (projetoAtualizado is null)
        {
            return NotFound();
        }

        return Ok(new ProjetoResponseDto(projetoAtualizado));
    }

    [Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var resultado = await _projetoService.DeleteAsync(id);

        if (resultado is null)
        {
            return NotFound();
        }

        if (resultado == false)
        {
            return BadRequest("Não foi possível deletar o projeto.");
        }

        return NoContent();
    }

    [HttpGet("{id}/colaboradores")]
    public async Task<IActionResult> ListColaboradores(int id)
    {
        try
        {
            var colaboradores = await _projetoService.ListColaboradoresAsync(id);
            return Ok(colaboradores.Select(c => new ColaboradorResponseDto(c)));
        }
        catch (ArgumentNullException ex)
        {
            return NotFound(ex.Message);
        }
    }
}