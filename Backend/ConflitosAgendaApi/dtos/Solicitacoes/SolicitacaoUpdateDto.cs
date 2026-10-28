using ConflitosAgendaApi.Dtos.Referencias;
using ConflitosAgendaApi.Models;
using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Solicitacoes;

public class SolicitacaoUpdateDto
{
    [Required]
    public ColaboradorReferenciaDto Colaborador { get; set; } = null!;
    [Required]
    public List<PeriodoReferenciaDto> Periodos { get; set; } = new();
    public StatusSolicitacao Status { get; set; }
    public DateTimeOffset CriadaEm { get; set; }
    public string? Observacao { get; set; }
    /// <summary>Quando omitido, mantém o valor atual.</summary>
    public bool? Abono { get; set; }
    /// <summary>Quando omitido, mantém o valor atual.</summary>
    public bool? isPessoaCritica { get; set; }
}
