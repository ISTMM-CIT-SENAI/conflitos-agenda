using ConflitosAgendaApi.Models;
using System.ComponentModel.DataAnnotations;
namespace ConflitosAgendaApi.Dtos.Colaboradores;
public class ColaboradorResponseDto
{
    public int Id { get; private set; }
    public string Nome { get; private set; }
    public string Email { get; private set; }
    public bool IsCoordenador { get; private set; } = false;

    public ColaboradorResponseDto(Colaborador colaborador)
    {
        Id = colaborador.Id;
        Nome = colaborador.Nome;
        Email = colaborador.Email;
        IsCoordenador = colaborador.IsCoordenador;
    }
}