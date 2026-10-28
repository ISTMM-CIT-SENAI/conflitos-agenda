using ConflitosAgendaApi.Dtos.Solicitacoes;
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

    /// <summary>Coordenador vê todas; os demais veem as próprias e, se supervisor, as atribuídas a ele.</summary>
    public static bool PodeVerSolicitacao(UsuarioAtual usuario, int colaboradorId, int supervisorId) =>
        usuario.IsCoordenador
        || EhDono(usuario, colaboradorId)
        || usuario.ColaboradorId == supervisorId;

    /// <summary>Criar ou alterar períodos, colaborador, supervisor e abono de uma Solicitação.</summary>
    public static bool PodeEditarSolicitacao(UsuarioAtual usuario, int colaboradorId) =>
        usuario.IsCoordenador || EhDono(usuario, colaboradorId);

    /// <summary>
    /// Aprovar ou recusar: o Supervisor encaminhado ou um Coordenador, nunca o próprio solicitante.
    /// </summary>
    public static bool PodeDecidir(UsuarioAtual usuario, int colaboradorId, int supervisorId) =>
        !EhDono(usuario, colaboradorId)
        && (usuario.IsCoordenador || usuario.ColaboradorId == supervisorId);

    public static bool PodeValidarConflito(UsuarioAtual usuario, int colaboradorId, int supervisorId) =>
        PodeVerSolicitacao(usuario, colaboradorId, supervisorId);

    /// <summary>Coordenador exclui qualquer uma; o dono, só enquanto não foi decidida.</summary>
    public static bool PodeExcluirSolicitacao(UsuarioAtual usuario, int colaboradorId, StatusSolicitacao status) =>
        usuario.IsCoordenador
        || (EhDono(usuario, colaboradorId)
            && status is not (StatusSolicitacao.Aprovada or StatusSolicitacao.Recusada));

    public static bool PodeGerenciarPeriodo(UsuarioAtual usuario, int idColaborador) =>
        usuario.IsCoordenador || EhDono(usuario, idColaborador);

    /// <summary>
    /// O Supervisor que não é dono só muda o status (validar, aprovar, recusar):
    /// colaborador, períodos e abono precisam continuar iguais.
    /// </summary>
    public static bool AlteraSomenteStatus(SolicitacaoResponseDto atual, SolicitacaoUpdateDto dto)
    {
        var periodosAtuais = atual.Periodos.Select(p => p.Id).Order();
        var periodosNovos = dto.Periodos.Select(p => p.Id).Distinct().Order();
        return dto.Colaborador?.Id == atual.Colaborador.Id
            && periodosAtuais.SequenceEqual(periodosNovos)
            && (dto.Abono is null || dto.Abono == atual.Abono);
    }
}
