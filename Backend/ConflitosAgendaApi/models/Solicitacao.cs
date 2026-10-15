namespace ConflitosAgendaApi.Models;
public sealed class Solicitacao
{
    public Solicitacao()
    {
    }
    public Solicitacao(
        Colaborador colaborador,
        List<Periodo> periodos,
        StatusSolicitacao status,
        DateTimeOffset criadaEm,
        Colaborador coordenador,
        string? observacao = null,
        bool abono = false,
        bool isPessoaCritica = false,
        int totalDias = 0
    )
    {
        this.Colaborador = colaborador;
        this.Periodos = periodos;
        this.Coordenador = coordenador;
        this.Status = status;
        this.CriadaEm = criadaEm;
        this.Observacao = observacao;
        this.Abono = abono;
        this.isPessoaCritica = isPessoaCritica;
        this.TotalDias = totalDias;
    }
    public int Id { get; private set; }
    public Colaborador Colaborador { get; private set; } = null!;
    public List<Periodo> Periodos { get; private set; } = new();
    public StatusSolicitacao Status { get; private set; } = StatusSolicitacao.Em_Analise;
    public DateTimeOffset CriadaEm { get; private set; } = DateTimeOffset.UtcNow;
    public Colaborador Coordenador { get; private set; } = null!;
    public int TotalDias { get; private set; }
    public string? Observacao { get; private set; } 
    public bool Abono { get; private set; } = false;
    public bool isPessoaCritica { get; private set; } = false;

    public bool ValidarAbono(IEnumerable<Periodo>? periodos = null)
    {
        var quantidadePeriodos = (periodos ?? Periodos).Count();

        if (this.Abono && quantidadePeriodos > 2)
        {
            return false;
        }
        if(this.Abono && this.TotalDias > 20)
        {
            return false;
        }
        return true;
    }

    public bool ValidarNumPeriodos(IEnumerable<Periodo>? periodos = null)
    {
        var quantidadePeriodos = (periodos ?? Periodos).Count();
        return quantidadePeriodos is >= 1 and <= 3;
    }

    public void Aprovar()
    {
        this.Status = StatusSolicitacao.Aprovada;
    }

    public void Reprovar(string observacao)
    {
        this.Status = StatusSolicitacao.Recusada;
        this.Observacao = observacao;
    }

    public void Atualizar(
        Colaborador colaborador,
        List<Periodo> periodos,
        Colaborador coordenador,
        StatusSolicitacao status,
        string? observacao,
        int? totalDias = null,
        bool? abono = null,
        bool? pessoaCritica = null)
    {
        Colaborador = colaborador;
        // Altera a lista existente para o EF desvincular os períodos removidos.
        var novosPeriodos = periodos.ToList();
        Periodos.Clear();
        Periodos.AddRange(novosPeriodos);
        Coordenador = coordenador;
        Status = status;
        Observacao = observacao;
        TotalDias = totalDias ?? TotalDias;
        Abono = abono ?? Abono;
        isPessoaCritica = pessoaCritica ?? isPessoaCritica;
    }
}
