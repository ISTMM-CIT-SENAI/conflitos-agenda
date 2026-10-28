using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Colaboradores;

public class ColaboradorUpdateDto
{
    [Required(ErrorMessage = "Informe o nome completo.")]
    [MaxLength(150, ErrorMessage = "O nome deve ter no máximo 150 caracteres.")]
    public string Nome { get; set; } = string.Empty;
    /// <summary>Supervisor (ou Coordenador) que recebe as solicitações; nulo só para o Coordenador.</summary>
    public int? RespondeAId { get; set; }
}
