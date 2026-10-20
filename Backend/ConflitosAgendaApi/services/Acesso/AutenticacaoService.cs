using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ConflitosAgendaApi.Services.Acesso;

public sealed record ResultadoLogin(Usuario? Usuario, string? Erro)
{
    public bool Sucesso => Usuario is not null;
}

public interface IAutenticacaoService
{
    Task<ResultadoLogin> EntrarAsync(string nomeUsuario, string senha);
    Task<Usuario> TrocarSenhaAsync(int usuarioId, string senhaAtual, string novaSenha);
}

/// <summary>
/// Verifica credenciais com o PasswordHasher do ASP.NET Core (PBKDF2, HMAC-SHA512,
/// sal aleatório por senha) e aplica o bloqueio após tentativas incorretas.
/// </summary>
public sealed class AutenticacaoService : IAutenticacaoService
{
    public const string MensagemCredenciaisInvalidas = "Usuário ou senha inválidos.";

    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly TimeProvider _relogio;

    public AutenticacaoService(
        IUsuarioRepository usuarioRepository,
        IPasswordHasher<Usuario> hasher,
        TimeProvider relogio)
    {
        _usuarioRepository = usuarioRepository;
        _hasher = hasher;
        _relogio = relogio;
    }

    public async Task<ResultadoLogin> EntrarAsync(string nomeUsuario, string senha)
    {
        var agora = _relogio.GetUtcNow().UtcDateTime;
        var usuario = string.IsNullOrWhiteSpace(nomeUsuario)
            ? null
            : await _usuarioRepository.GetByNomeUsuarioAsync(nomeUsuario);

        // Mesma mensagem para usuário inexistente, desativado ou senha errada:
        // não revela quais nomes de usuário existem.
        if (usuario is null || !usuario.Ativo)
        {
            return new ResultadoLogin(null, MensagemCredenciaisInvalidas);
        }

        if (usuario.EstaBloqueado(agora))
        {
            return new ResultadoLogin(null, MensagemBloqueio(usuario, agora));
        }

        var resultado = _hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, senha ?? string.Empty);
        if (resultado == PasswordVerificationResult.Failed)
        {
            usuario.RegistrarFalhaDeLogin(agora);
            await _usuarioRepository.SaveChangesAsync();
            return new ResultadoLogin(
                null,
                usuario.EstaBloqueado(agora) ? MensagemBloqueio(usuario, agora) : MensagemCredenciaisInvalidas);
        }

        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.AtualizarHash(_hasher.HashPassword(usuario, senha!));
        }

        usuario.RegistrarLoginBemSucedido();
        await _usuarioRepository.SaveChangesAsync();
        return new ResultadoLogin(usuario, null);
    }

    public async Task<Usuario> TrocarSenhaAsync(int usuarioId, string senhaAtual, string novaSenha)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(usuarioId)
            ?? throw new KeyNotFoundException("Usuário não encontrado.");

        if (_hasher.VerifyHashedPassword(usuario, usuario.SenhaHash, senhaAtual ?? string.Empty)
            == PasswordVerificationResult.Failed)
        {
            throw new ArgumentException("A senha atual está incorreta.");
        }

        ValidacaoCredenciais.ValidarSenha(novaSenha);
        if (novaSenha == senhaAtual)
        {
            throw new ArgumentException("A nova senha deve ser diferente da atual.");
        }

        usuario.DefinirSenha(_hasher.HashPassword(usuario, novaSenha));
        await _usuarioRepository.SaveChangesAsync();
        return usuario;
    }

    private static string MensagemBloqueio(Usuario usuario, DateTime agora)
    {
        var minutos = Math.Max(1, (int)Math.Ceiling((usuario.BloqueadoAteUtc!.Value - agora).TotalMinutes));
        return $"Muitas tentativas incorretas. Tente novamente em {minutos} minuto(s).";
    }
}
