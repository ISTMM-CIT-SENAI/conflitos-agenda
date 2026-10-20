using ConflitosAgendaApi.Dtos.Colaboradores;
using ConflitosAgendaApi.Dtos.Periodos;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Dtos.Solicitacoes;

public class SolicitacaoResponseDto
{
    public int Id { get; private set; }
    public ColaboradorResponseDto Colaborador { get; private set; }
    public List<PeriodoResponseDto> Periodos { get; private set; } = new();
    public StatusSolicitacao Status { get; private set; } = StatusSolicitacao.Em_Analise;
    public DateTimeOffset CriadaEm { get; private set; } = DateTimeOffset.UtcNow;
    public ColaboradorResponseDto Coordenador { get; private set; }
    public string? Observacao { get; private set; }
    public int TotalDias { get; private set; }
    public bool Abono { get; private set; } = false;
    public bool isPessoaCritica { get; private set; } = false;
    /// <summary>Quem aprovou ou recusou; nulo enquanto não houver Decisão.</summary>
    public DecisorDto? DecididaPor { get; private set; }
    public DateTimeOffset? DecididaEm { get; private set; }

    public SolicitacaoResponseDto(Solicitacao solicitacao)
    {
        this.Id = solicitacao.Id;
        this.Colaborador = new ColaboradorResponseDto(solicitacao.Colaborador);
        this.Periodos = solicitacao.Periodos.Select(p => new PeriodoResponseDto(p)).ToList();
        this.Status = solicitacao.Status;
        this.CriadaEm = solicitacao.CriadaEm;
        this.Coordenador = new ColaboradorResponseDto(solicitacao.Coordenador);
        this.Observacao = solicitacao.Observacao;
        this.TotalDias = solicitacao.TotalDias;
        this.Abono = solicitacao.Abono;
        this.isPessoaCritica = solicitacao.isPessoaCritica;
        this.DecididaPor = solicitacao.DecididaPor is null ? null : new DecisorDto(solicitacao.DecididaPor);
        this.DecididaEm = solicitacao.DecididaEm;
    }
}

public class DecisorDto
{
    public int UsuarioId { get; }
    public string NomeUsuario { get; }
    public string NomeColaborador { get; }
    public bool IsAdministrador { get; }

    public DecisorDto(Usuario usuario)
    {
        UsuarioId = usuario.Id;
        NomeUsuario = usuario.NomeUsuario;
        NomeColaborador = usuario.Colaborador?.Nome ?? usuario.NomeUsuario;
        IsAdministrador = usuario.IsAdministrador;
    }
}
