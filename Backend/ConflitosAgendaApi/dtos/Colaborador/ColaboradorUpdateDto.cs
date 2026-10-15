using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Colaboradores;

public class ColaboradorUpdateDto
{
    [Required]
    public string Nome { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}