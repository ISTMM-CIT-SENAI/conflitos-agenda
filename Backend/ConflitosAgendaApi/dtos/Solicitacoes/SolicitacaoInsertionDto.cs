using ConflitosAgendaApi.Dtos.Referencias;
using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Solicitacoes;
public class SolicitacaoInsertionDto
{
    [Required]
    public ColaboradorReferenciaDto Colaborador { get; set; } = null!;
    [Required]
    public List<PeriodoReferenciaDto> Periodos { get; set; } = new();
    [Required]
    public DateTimeOffset CriadaEm { get; set; } = DateTimeOffset.UtcNow;
    public string? Observacao { get; set; }
    [Required]
    public bool Abono { get; set; } = false;
    [Required]
    public bool isPessoaCritica { get; set; } = false;
}
