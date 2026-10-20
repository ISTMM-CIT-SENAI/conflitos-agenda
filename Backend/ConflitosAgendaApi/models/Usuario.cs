namespace ConflitosAgendaApi.Models;

/// <summary>
/// Conta de acesso ao sistema. Sempre pertence a exatamente um Colaborador.
/// O nível de acesso é Administrador quando marcado aqui; caso contrário, é
/// derivado do Colaborador (Coordenador ou Colaborador).
/// </summary>
public sealed class Usuario
{
    public const int MaximoTentativasFalhas = 5;
    public static readonly TimeSpan DuracaoBloqueio = TimeSpan.FromMinutes(15);

    public Usuario()
    {
    }

    public Usuario(string nomeUsuario, string senhaHash, Colaborador colaborador, bool isAdministrador)
    {
        NomeUsuario = nomeUsuario;
        NomeUsuarioNormalizado = Normalizar(nomeUsuario);
        SenhaHash = senhaHash;
        Colaborador = colaborador;
        IsAdministrador = isAdministrador;
        Ativo = true;
        PrecisaTrocarSenha = true;
        RenovarCarimboSeguranca();
    }

    public int Id { get; private set; }
    public string NomeUsuario { get; private set; } = string.Empty;
    /// <summary>Versão em minúsculas, usada para garantir unicidade sem diferenciar maiúsculas.</summary>
    public string NomeUsuarioNormalizado { get; private set; } = string.Empty;
    public string SenhaHash { get; private set; } = string.Empty;
    public bool IsAdministrador { get; private set; }
    public bool Ativo { get; private set; }
    public bool PrecisaTrocarSenha { get; private set; }
    public int TentativasFalhas { get; private set; }
    /// <summary>Instante (UTC) até o qual o login fica bloqueado.</summary>
    public DateTime? BloqueadoAteUtc { get; private set; }
    /// <summary>
    /// Muda quando a senha é trocada ou redefinida, ou quando a conta é desativada.
    /// Sessões emitidas com um carimbo antigo deixam de valer.
    /// </summary>
    public string CarimboSeguranca { get; private set; } = string.Empty;
    public int ColaboradorId { get; private set; }
    public Colaborador Colaborador { get; private set; } = null!;

    public static string Normalizar(string nomeUsuario) => nomeUsuario.Trim().ToLowerInvariant();

    public bool EstaBloqueado(DateTime agoraUtc) => BloqueadoAteUtc is not null && BloqueadoAteUtc > agoraUtc;

    public void RegistrarFalhaDeLogin(DateTime agoraUtc)
    {
        TentativasFalhas++;
        if (TentativasFalhas >= MaximoTentativasFalhas)
        {
            BloqueadoAteUtc = agoraUtc.Add(DuracaoBloqueio);
            TentativasFalhas = 0;
        }
    }

    public void RegistrarLoginBemSucedido()
    {
        TentativasFalhas = 0;
        BloqueadoAteUtc = null;
    }

    /// <summary>Senha definida pelo próprio Usuário: deixa de ser temporária.</summary>
    public void DefinirSenha(string senhaHash)
    {
        SenhaHash = senhaHash;
        PrecisaTrocarSenha = false;
        RenovarCarimboSeguranca();
    }

    /// <summary>Senha temporária definida pelo Administrador: precisa ser trocada no próximo login.</summary>
    public void RedefinirSenhaTemporaria(string senhaHash)
    {
        SenhaHash = senhaHash;
        PrecisaTrocarSenha = true;
        TentativasFalhas = 0;
        BloqueadoAteUtc = null;
        RenovarCarimboSeguranca();
    }

    /// <summary>Usado quando o algoritmo de hash é atualizado: mantém o estado da senha.</summary>
    public void AtualizarHash(string senhaHash)
    {
        SenhaHash = senhaHash;
    }

    public void DefinirAdministrador(bool isAdministrador) => IsAdministrador = isAdministrador;

    public void Desativar()
    {
        Ativo = false;
        RenovarCarimboSeguranca();
    }

    public void Reativar() => Ativo = true;

    private void RenovarCarimboSeguranca() => CarimboSeguranca = Guid.NewGuid().ToString("N");
}
