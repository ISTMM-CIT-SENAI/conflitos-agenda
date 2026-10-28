namespace ConflitosAgendaApi.Models;

/// <summary>
/// Pessoa cujas ausências são controladas. Identificada apenas pelo nome completo,
/// que é único; o sistema não guarda e-mail nem outros contatos (ver ADR 0003).
/// </summary>
public sealed class Colaborador
{
    public Colaborador(
    )
    {
    }
    public Colaborador(string nome, List<Projeto> projetos, bool isSupervisor)
    {
        this.Nome = nome;
        this.Projetos = projetos;
        this.IsSupervisor = isSupervisor;
    }
    public int Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public bool IsSupervisor { get; private set;}
    public List<Projeto> Projetos { get; private set; } = new();
    /// <summary>A quem o colaborador responde (supervisor ou o Coordenador): recebe as solicitações dele.</summary>
    public int? RespondeAId { get; private set; }
    public Colaborador? RespondeA { get; private set; }

    public void TornarSupervisor()
    {
        IsSupervisor = true;
    }

    public void AtualizarDados(string nome)
    {
        Nome = nome;
    }

    public void DefinirRespondeA(Colaborador? respondeA)
    {
        if (respondeA is not null && respondeA == this)
        {
            throw new ArgumentException("O colaborador não pode responder a si mesmo.");
        }
        if (respondeA is not null && !respondeA.IsSupervisor)
        {
            throw new ArgumentException($"{respondeA.Nome} não é supervisor.");
        }
        // O EF deriva RespondeAId da navegação ao salvar (o supervisor pode ainda não ter Id).
        RespondeA = respondeA;
        if (respondeA is null)
        {
            RespondeAId = null;
        }
    }
}
