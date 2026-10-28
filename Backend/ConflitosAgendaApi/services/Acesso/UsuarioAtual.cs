using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Services.Acesso;

/// <summary>Quem está fazendo a requisição, com o nível de acesso já derivado.</summary>
public sealed record UsuarioAtual(
    int UsuarioId,
    string NomeUsuario,
    int ColaboradorId,
    string NomeColaborador,
    bool IsCoordenador,
    bool IsSupervisor,
    bool PrecisaTrocarSenha)
{
    public NivelAcesso Nivel => IsCoordenador
        ? NivelAcesso.Coordenador
        : IsSupervisor ? NivelAcesso.Supervisor : NivelAcesso.Colaborador;

    public static UsuarioAtual De(Usuario usuario) => new(
        usuario.Id,
        usuario.NomeUsuario,
        usuario.ColaboradorId,
        usuario.Colaborador.Nome,
        usuario.IsCoordenador,
        usuario.Colaborador.IsSupervisor,
        usuario.PrecisaTrocarSenha);
}
