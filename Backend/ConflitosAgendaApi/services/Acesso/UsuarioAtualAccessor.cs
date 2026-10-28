using System.Security.Claims;
using ConflitosAgendaApi.Repositories.Interfaces;

namespace ConflitosAgendaApi.Services.Acesso;

public interface IUsuarioAtualAccessor
{
    /// <summary>O Usuário da requisição. Lança <see cref="UnauthorizedAccessException"/> se não houver sessão válida.</summary>
    Task<UsuarioAtual> ObterAsync();
}

/// <summary>
/// Carrega o Usuário da sessão a partir do banco uma vez por requisição. O nível de acesso
/// vem sempre do estado atual (ex.: alguém que acabou de virar supervisor), não do cookie.
/// </summary>
public sealed class UsuarioAtualAccessor : IUsuarioAtualAccessor
{
    private const string ChaveCache = "conflitos-agenda:usuario-atual";
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IUsuarioRepository _usuarioRepository;

    public UsuarioAtualAccessor(IHttpContextAccessor httpContextAccessor, IUsuarioRepository usuarioRepository)
    {
        _httpContextAccessor = httpContextAccessor;
        _usuarioRepository = usuarioRepository;
    }

    public async Task<UsuarioAtual> ObterAsync()
    {
        var contexto = _httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("Sem requisição HTTP em andamento.");

        if (contexto.Items.TryGetValue(ChaveCache, out var cache) && cache is UsuarioAtual emCache)
        {
            return emCache;
        }

        var id = contexto.User.FindFirstValue(ClaimTypes.NameIdentifier);
        var usuario = int.TryParse(id, out var usuarioId)
            ? await _usuarioRepository.GetByIdAsync(usuarioId)
            : null;

        if (usuario is null || !usuario.Ativo)
        {
            throw new UnauthorizedAccessException("Sessão inválida. Entre novamente.");
        }

        var atual = UsuarioAtual.De(usuario);
        contexto.Items[ChaveCache] = atual;
        return atual;
    }
}
