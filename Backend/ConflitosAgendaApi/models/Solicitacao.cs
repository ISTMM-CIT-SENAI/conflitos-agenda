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
        Colaborador supervisor,
        string? observacao = null,
        bool abono = false,
        bool isPessoaCritica = false,
        int totalDias = 0
    )
    {
        this.Colaborador = colaborador;
        this.Periodos = periodos;
        this.Supervisor = supervisor;
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
    public Colaborador Supervisor { get; private set; } = null!;
    public int TotalDias { get; private set; }
    public string? Observacao { get; private set; } 
    public bool Abono { get; private set; } = false;
    public bool isPessoaCritica { get; private set; } = false;
    /// <summary>Usuário que aprovou ou recusou; pode ser o Supervisor encaminhado ou um Coordenador.</summary>
    public int? DecididaPorId { get; private set; }
    public Usuario? DecididaPor { get; private set; }
    public DateTimeOffset? DecididaEm { get; private set; }

    public bool EstaDecidida => Status is StatusSolicitacao.Aprovada or StatusSolicitacao.Recusada;

    public void RegistrarDecisao(Usuario usuario, DateTimeOffset quando)
    {
        DecididaPor = usuario;
        DecididaPorId = usuario.Id;
        DecididaEm = quando;
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
        List<Periodo> periodos,
        StatusSolicitacao status,
        string? observacao,
        int? totalDias = null,
        bool? abono = null,
        bool? pessoaCritica = null)
    {
        // Altera a lista existente para o EF desvincular os períodos removidos.
        var novosPeriodos = periodos.ToList();
        Periodos.Clear();
        Periodos.AddRange(novosPeriodos);
        Status = status;
        Observacao = observacao;
        TotalDias = totalDias ?? TotalDias;
        Abono = abono ?? Abono;
        isPessoaCritica = pessoaCritica ?? isPessoaCritica;
    }
}
