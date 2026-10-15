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
    }
}
