using System.ComponentModel.DataAnnotations;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Services.Acesso;

namespace ConflitosAgendaApi.Dtos.Acesso;

public class LoginDto
{
    [Required(ErrorMessage = "Informe o nome de usuário.")]
    public string NomeUsuario { get; set; } = string.Empty;
    [Required(ErrorMessage = "Informe a senha.")]
    public string Senha { get; set; } = string.Empty;
}

public class TrocarSenhaDto
{
    [Required(ErrorMessage = "Informe a senha atual.")]
    public string SenhaAtual { get; set; } = string.Empty;
    [Required(ErrorMessage = "Informe a nova senha.")]
    public string NovaSenha { get; set; } = string.Empty;
}

public class UsuarioInsertionDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Informe o colaborador.")]
    public int ColaboradorId { get; set; }
    [Required(ErrorMessage = "Informe o nome de usuário.")]
    public string NomeUsuario { get; set; } = string.Empty;
    [Required(ErrorMessage = "Informe a senha temporária.")]
    public string SenhaTemporaria { get; set; } = string.Empty;
    public bool IsAdministrador { get; set; }
}

public class RedefinirSenhaDto
{
    [Required(ErrorMessage = "Informe a senha temporária.")]
    public string SenhaTemporaria { get; set; } = string.Empty;
}

public class DefinirAdministradorDto
{
    public bool IsAdministrador { get; set; }
}

public class ColaboradorDoUsuarioDto
{
    public int Id { get; init; }
    public string Nome { get; init; } = string.Empty;
    public bool IsCoordenador { get; init; }
}

internal static class NivelAcessoTexto
{
    public static string De(NivelAcesso nivel) => nivel switch
    {
        NivelAcesso.Administrador => "administrador",
        NivelAcesso.Coordenador => "coordenador",
        _ => "colaborador",
    };
}

/// <summary>Quem está logado, devolvido no login e em GET /api/Auth/eu.</summary>
public class UsuarioLogadoDto
{
    public int Id { get; init; }
    public string NomeUsuario { get; init; } = string.Empty;
    /// <summary>"administrador", "coordenador" ou "colaborador".</summary>
    public string Nivel { get; init; } = string.Empty;
    public bool PrecisaTrocarSenha { get; init; }
    public ColaboradorDoUsuarioDto Colaborador { get; init; } = new();

    public static UsuarioLogadoDto De(UsuarioAtual usuario) => new()
    {
        Id = usuario.UsuarioId,
        NomeUsuario = usuario.NomeUsuario,
        Nivel = NivelAcessoTexto.De(usuario.Nivel),
        PrecisaTrocarSenha = usuario.PrecisaTrocarSenha,
        Colaborador = new ColaboradorDoUsuarioDto
        {
            Id = usuario.ColaboradorId,
            Nome = usuario.NomeColaborador,
            IsCoordenador = usuario.IsCoordenador,
        },
    };
}

/// <summary>Conta de acesso vista pelo Administrador na tela de Usuários.</summary>
public class UsuarioResponseDto
{
    public int Id { get; init; }
    public string NomeUsuario { get; init; } = string.Empty;
    public string Nivel { get; init; } = string.Empty;
    public bool IsAdministrador { get; init; }
    public bool Ativo { get; init; }
    public bool PrecisaTrocarSenha { get; init; }
    public bool Bloqueado { get; init; }
    public ColaboradorDoUsuarioDto Colaborador { get; init; } = new();

    public static UsuarioResponseDto De(Usuario usuario, DateTime agoraUtc)
    {
        var atual = UsuarioAtual.De(usuario);
        return new UsuarioResponseDto
        {
            Id = usuario.Id,
            NomeUsuario = usuario.NomeUsuario,
            Nivel = NivelAcessoTexto.De(atual.Nivel),
            IsAdministrador = usuario.IsAdministrador,
            Ativo = usuario.Ativo,
            PrecisaTrocarSenha = usuario.PrecisaTrocarSenha,
            Bloqueado = usuario.EstaBloqueado(agoraUtc),
            Colaborador = new ColaboradorDoUsuarioDto
            {
                Id = usuario.ColaboradorId,
                Nome = usuario.Colaborador.Nome,
                IsCoordenador = usuario.Colaborador.IsCoordenador,
            },
        };
    }
}
