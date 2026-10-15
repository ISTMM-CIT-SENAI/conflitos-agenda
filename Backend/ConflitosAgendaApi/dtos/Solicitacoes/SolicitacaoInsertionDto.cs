using ConflitosAgendaApi.Dtos.Referencias;
using ConflitosAgendaApi.Models;
using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Solicitacoes;
public class SolicitacaoInsertionDto
{
    [Required]
    public ColaboradorReferenciaDto Colaborador { get; set; } = null!;
    [Required]
    public List<PeriodoReferenciaDto> Periodos { get; set; } = new();
    [Required]
    public StatusSolicitacao Status { get; set; } = StatusSolicitacao.Em_Analise;
    [Required]
    public DateTimeOffset CriadaEm { get; set; } = DateTimeOffset.UtcNow;
    [Required]
    public ColaboradorReferenciaDto Coordenador { get; set; } = null!;
    public string? Observacao { get; set; }
    [Required]
    public int TotalDias { get; set; }
    [Required]
    public bool Abono { get; set; } = false;
    [Required]
    public bool isPessoaCritica { get; set; } = false;
}
