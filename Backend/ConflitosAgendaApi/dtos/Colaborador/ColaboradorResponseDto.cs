using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Dtos.Colaboradores;

public class ColaboradorResponseDto
{
    public int Id { get; private set; }
    public string Nome { get; private set; }
    public bool IsCoordenador { get; private set; }

    public ColaboradorResponseDto(Colaborador colaborador)
    {
        Id = colaborador.Id;
        Nome = colaborador.Nome;
        IsCoordenador = colaborador.IsCoordenador;
    }
}
