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
    public Colaborador(string nome, List<Projeto> projetos, bool isCoordenador)
    {
        this.Nome = nome;
        this.Projetos = projetos;
        this.IsCoordenador = isCoordenador;
    }
    public int Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public bool IsCoordenador { get; private set;}
    public List<Projeto> Projetos { get; private set; } = new();

    public void TornarCoordenador()
    {
        IsCoordenador = true;
    }

    public void AtualizarDados(string nome)
    {
        Nome = nome;
    }
}
