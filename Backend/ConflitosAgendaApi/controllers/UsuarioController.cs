using ConflitosAgendaApi.Dtos.Acesso;
using ConflitosAgendaApi.Services.Acesso;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConflitosAgendaApi.Controllers;

/// <summary>Contas de acesso. Exclusivo do Administrador.</summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = SessaoCookie.PoliticaAdministrador)]
public class UsuarioController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;
    private readonly IUsuarioAtualAccessor _usuarioAtual;
    private readonly TimeProvider _relogio;

    public UsuarioController(IUsuarioService usuarioService, IUsuarioAtualAccessor usuarioAtual, TimeProvider relogio)
    {
        _usuarioService = usuarioService;
        _usuarioAtual = usuarioAtual;
        _relogio = relogio;
    }

    private UsuarioResponseDto Dto(Models.Usuario usuario) =>
        UsuarioResponseDto.De(usuario, _relogio.GetUtcNow().UtcDateTime);

    [HttpGet]
    public async Task<IActionResult> ListAll()
    {
        var usuarios = await _usuarioService.ListarAsync();
        return Ok(usuarios.Select(Dto));
    }

    [HttpPost]
    public async Task<IActionResult> Add(UsuarioInsertionDto dto)
    {
        var usuario = await _usuarioService.CriarAsync(dto.ColaboradorId, dto.NomeUsuario, dto.SenhaTemporaria, dto.IsAdministrador);
        return Created($"/api/Usuario/{usuario.Id}", Dto(usuario));
    }

    [HttpPut("{id}/administrador")]
    public async Task<IActionResult> DefinirAdministrador(int id, DefinirAdministradorDto dto)
    {
        var usuario = await _usuarioService.DefinirAdministradorAsync(id, dto.IsAdministrador, await _usuarioAtual.ObterAsync());
        return Ok(Dto(usuario));
    }

    [HttpPost("{id}/redefinir-senha")]
    public async Task<IActionResult> RedefinirSenha(int id, RedefinirSenhaDto dto)
    {
        return Ok(Dto(await _usuarioService.RedefinirSenhaAsync(id, dto.SenhaTemporaria)));
    }

    [HttpPost("{id}/desativar")]
    public async Task<IActionResult> Desativar(int id)
    {
        return Ok(Dto(await _usuarioService.DesativarAsync(id, await _usuarioAtual.ObterAsync())));
    }

    [HttpPost("{id}/reativar")]
    public async Task<IActionResult> Reativar(int id)
    {
        return Ok(Dto(await _usuarioService.ReativarAsync(id)));
    }
}
