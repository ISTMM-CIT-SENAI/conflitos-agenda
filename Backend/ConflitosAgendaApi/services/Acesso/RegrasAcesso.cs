using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Services.Acesso;

/// <summary>
/// O que cada nível de acesso pode fazer. Funções puras, sem banco nem HTTP:
/// o frontend espelha as mesmas regras em <c>src/domain/acesso.ts</c>.
/// </summary>
public static class RegrasAcesso
{
    public static bool EhDono(UsuarioAtual usuario, int colaboradorId) =>
        usuario.ColaboradorId == colaboradorId;

    /// <summary>Administrador vê todas; os demais veem as próprias e, se coordenador, as atribuídas a ele.</summary>
    public static bool PodeVerSolicitacao(UsuarioAtual usuario, int colaboradorId, int coordenadorId) =>
        usuario.IsAdministrador
        || EhDono(usuario, colaboradorId)
        || usuario.ColaboradorId == coordenadorId;

    /// <summary>Criar ou alterar períodos, colaborador, coordenador e abono de uma Solicitação.</summary>
    public static bool PodeEditarSolicitacao(UsuarioAtual usuario, int colaboradorId) =>
        usuario.IsAdministrador || EhDono(usuario, colaboradorId);

    /// <summary>
    /// Aprovar ou recusar: o Coordenador escolhido ou um Administrador, nunca o próprio solicitante.
    /// </summary>
    public static bool PodeDecidir(UsuarioAtual usuario, int colaboradorId, int coordenadorId) =>
        !EhDono(usuario, colaboradorId)
        && (usuario.IsAdministrador || usuario.ColaboradorId == coordenadorId);

    public static bool PodeValidarConflito(UsuarioAtual usuario, int colaboradorId, int coordenadorId) =>
        PodeVerSolicitacao(usuario, colaboradorId, coordenadorId);

    /// <summary>Administrador exclui qualquer uma; o dono, só enquanto não foi decidida.</summary>
    public static bool PodeExcluirSolicitacao(UsuarioAtual usuario, int colaboradorId, StatusSolicitacao status) =>
        usuario.IsAdministrador
        || (EhDono(usuario, colaboradorId)
            && status is not (StatusSolicitacao.Aprovada or StatusSolicitacao.Recusada));

    public static bool PodeGerenciarPeriodo(UsuarioAtual usuario, int idColaborador) =>
        usuario.IsAdministrador || EhDono(usuario, idColaborador);
}
