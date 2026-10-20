namespace ConflitosAgendaApi.Services.Acesso;

/// <summary>O Usuário está autenticado, mas seu nível de acesso não permite a operação (HTTP 403).</summary>
public sealed class AcessoNegadoException : Exception
{
    public AcessoNegadoException(string mensagem = "Você não tem permissão para realizar esta operação.")
        : base(mensagem)
    {
    }
}
