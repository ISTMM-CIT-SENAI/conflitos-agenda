using System.ComponentModel.DataAnnotations;
using ConflitosAgendaApi.Dtos.Referencias;

namespace ConflitosAgendaApi.Dtos.Projetos;

public class ProjetoUpdateDto
{
    [Required]
    public string Nome { get; set; } = string.Empty;
    [Required]
    public List<ColaboradorReferenciaDto> PessoasCriticas { get; set; } = new();
    [Required]
    public List<ColaboradorReferenciaDto> Colaboradores { get; set; } = new();
}
