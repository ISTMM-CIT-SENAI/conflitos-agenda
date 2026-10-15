namespace ConflitosAgendaApi.Models;
public sealed class Projeto
{
    public Projeto(
    )
    {
    }
    public Projeto(
        string nome,
        List<Colaborador> pessoasCriticas,
        List<Colaborador> colaboradores
    )
    {
        this.Nome = nome;
        this.PessoasCriticas = pessoasCriticas;
        this.Colaboradores = colaboradores;
    }
    public void Atualizar(
        string nome,
        List<Colaborador> pessoasCriticas,
        List<Colaborador> colaboradores)
    {
        Nome = nome;
        // Altera as listas existentes para o EF detectar inclusões e remoções nas tabelas de junção.
        // Copia antes de limpar: o chamador pode passar as próprias listas desta entidade.
        var novasPessoasCriticas = pessoasCriticas.ToList();
        var novosColaboradores = colaboradores.ToList();
        PessoasCriticas.Clear();
        PessoasCriticas.AddRange(novasPessoasCriticas);
        Colaboradores.Clear();
        Colaboradores.AddRange(novosColaboradores);
    }
    public int Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public List<Colaborador> PessoasCriticas { get; private set; } = new();
    public List<Colaborador> Colaboradores { get; private set; } = new();

    
}