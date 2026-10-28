using System.Security.Claims;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace ConflitosAgendaApi.Services.Acesso;

/// <summary>
/// Sessão em cookie HttpOnly emitido pela API. O cookie guarda só o ID do Usuário e o
/// carimbo de segurança; nível de acesso e situação da conta são relidos do banco a cada requisição.
/// </summary>
public static class SessaoCookie
{
    public const string NomeCookie = "conflitos-agenda.sessao";
    public const string PoliticaCoordenador = "Coordenador";
    public const string PapelCoordenador = "Coordenador";
    private const string ClaimCarimbo = "carimbo-seguranca";

    public static ClaimsPrincipal CriarPrincipal(Usuario usuario)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
            new(ClaimTypes.Name, usuario.NomeUsuario),
            new(ClaimCarimbo, usuario.CarimboSeguranca),
        };
        if (usuario.IsCoordenador)
        {
            claims.Add(new Claim(ClaimTypes.Role, PapelCoordenador));
        }
        return new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme));
    }

    public static Task EntrarAsync(HttpContext contexto, Usuario usuario) =>
        contexto.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            CriarPrincipal(usuario),
            new AuthenticationProperties { IsPersistent = false });

    /// <summary>
    /// Rejeita a sessão se o Usuário não existe mais, foi desativado ou teve a senha
    /// trocada/redefinida; caso contrário, renova os claims com o estado atual.
    /// </summary>
    public static async Task ValidarAsync(CookieValidatePrincipalContext contexto)
    {
        var id = contexto.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
        var carimbo = contexto.Principal?.FindFirstValue(ClaimCarimbo);
        var repositorio = contexto.HttpContext.RequestServices.GetRequiredService<IUsuarioRepository>();
        var usuario = int.TryParse(id, out var usuarioId) ? await repositorio.GetByIdAsync(usuarioId) : null;

        if (usuario is null || !usuario.Ativo || usuario.CarimboSeguranca != carimbo)
        {
            contexto.RejectPrincipal();
            await contexto.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }

        contexto.ReplacePrincipal(CriarPrincipal(usuario));
    }
}
