using ConflitosAgendaApi.Dtos.Acesso;
using ConflitosAgendaApi.Services.Acesso;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConflitosAgendaApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAutenticacaoService _autenticacaoService;
    private readonly IUsuarioAtualAccessor _usuarioAtual;

    public AuthController(IAutenticacaoService autenticacaoService, IUsuarioAtualAccessor usuarioAtual)
    {
        _autenticacaoService = autenticacaoService;
        _usuarioAtual = usuarioAtual;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var resultado = await _autenticacaoService.EntrarAsync(dto.NomeUsuario, dto.Senha);
        if (!resultado.Sucesso)
        {
            return Problem(detail: resultado.Erro, statusCode: StatusCodes.Status401Unauthorized, title: "Falha no login");
        }

        await SessaoCookie.EntrarAsync(HttpContext, resultado.Usuario!);
        return Ok(UsuarioLogadoDto.De(UsuarioAtual.De(resultado.Usuario!)));
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    /// <summary>Quem está logado. Responde 401 quando não há sessão.</summary>
    [HttpGet("eu")]
    public async Task<IActionResult> Eu()
    {
        return Ok(UsuarioLogadoDto.De(await _usuarioAtual.ObterAsync()));
    }

    /// <summary>Troca a própria senha. Obrigatória no primeiro acesso e após redefinição pelo Administrador.</summary>
    [HttpPost("trocar-senha")]
    public async Task<IActionResult> TrocarSenha(TrocarSenhaDto dto)
    {
        var atual = await _usuarioAtual.ObterAsync();
        var usuario = await _autenticacaoService.TrocarSenhaAsync(atual.UsuarioId, dto.SenhaAtual, dto.NovaSenha);

        // A troca renova o carimbo de segurança: reemite o cookie para manter esta sessão
        // e invalidar as demais.
        await SessaoCookie.EntrarAsync(HttpContext, usuario);
        return Ok(UsuarioLogadoDto.De(UsuarioAtual.De(usuario)));
    }
}
