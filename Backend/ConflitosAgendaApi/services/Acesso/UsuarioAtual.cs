using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Services.Acesso;

/// <summary>Quem está fazendo a requisição, com o nível de acesso já derivado.</summary>
public sealed record UsuarioAtual(
    int UsuarioId,
    string NomeUsuario,
    int ColaboradorId,
    string NomeColaborador,
    bool IsAdministrador,
    bool IsCoordenador,
    bool PrecisaTrocarSenha)
{
    public NivelAcesso Nivel => IsAdministrador
        ? NivelAcesso.Administrador
        : IsCoordenador ? NivelAcesso.Coordenador : NivelAcesso.Colaborador;

    public static UsuarioAtual De(Usuario usuario) => new(
        usuario.Id,
        usuario.NomeUsuario,
        usuario.ColaboradorId,
        usuario.Colaborador.Nome,
        usuario.IsAdministrador,
        usuario.Colaborador.IsCoordenador,
        usuario.PrecisaTrocarSenha);
}
