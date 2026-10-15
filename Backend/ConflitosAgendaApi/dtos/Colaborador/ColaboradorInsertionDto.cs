using System.ComponentModel.DataAnnotations;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Dtos.Colaboradores;

public class ColaboradorInsertionDto
{
    public ColaboradorInsertionDto()
    {
    }

    [Required]
    public string Nome { get; set; } = string.Empty;
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    public ColaboradorInsertionDto(Colaborador colaborador)
    {
        Nome = colaborador.Nome;
        Email = colaborador.Email;
    }
}

