using ConflitosAgendaApi.Dtos.Referencias;
using System.ComponentModel.DataAnnotations;
namespace ConflitosAgendaApi.Dtos.Projetos;

public class ProjetoInsertionDto
{
    [Required]
    public string Nome { get; set; } = string.Empty;
    [Required]
    public List<ColaboradorReferenciaDto> PessoasCriticas { get; set; } = new();
    [Required]
    public List<ColaboradorReferenciaDto> Colaboradores { get; set; } = new();
}
