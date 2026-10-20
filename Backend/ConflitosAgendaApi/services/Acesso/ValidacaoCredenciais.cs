using System.Text.RegularExpressions;

namespace ConflitosAgendaApi.Services.Acesso;

public static partial class ValidacaoCredenciais
{
    public const int TamanhoMinimoSenha = 8;
    public const int TamanhoMaximoSenha = 128;

    [GeneratedRegex("^[A-Za-z0-9._-]{3,30}$")]
    private static partial Regex PadraoNomeUsuario();

    public static void ValidarNomeUsuario(string? nomeUsuario)
    {
        if (string.IsNullOrWhiteSpace(nomeUsuario) || !PadraoNomeUsuario().IsMatch(nomeUsuario.Trim()))
        {
            throw new ArgumentException(
                "O nome de usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado.");
        }
    }

    public static void ValidarSenha(string? senha)
    {
        if (string.IsNullOrEmpty(senha) || senha.Length < TamanhoMinimoSenha)
        {
            throw new ArgumentException($"A senha deve ter no mínimo {TamanhoMinimoSenha} caracteres.");
        }
        if (senha.Length > TamanhoMaximoSenha)
        {
            throw new ArgumentException($"A senha deve ter no máximo {TamanhoMaximoSenha} caracteres.");
        }
    }
}
