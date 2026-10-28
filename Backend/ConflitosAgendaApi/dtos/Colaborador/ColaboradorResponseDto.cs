using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Dtos.Colaboradores;

public class ColaboradorResponseDto
{
    public int Id { get; private set; }
    public string Nome { get; private set; }
    public bool IsSupervisor { get; private set; }
    public ColaboradorResumoDto? RespondeA { get; private set; }

    public ColaboradorResponseDto(Colaborador colaborador)
    {
        Id = colaborador.Id;
        Nome = colaborador.Nome;
        IsSupervisor = colaborador.IsSupervisor;
        RespondeA = colaborador.RespondeA is null
            ? null
            : new ColaboradorResumoDto(colaborador.RespondeA.Id, colaborador.RespondeA.Nome);
    }
}

public record ColaboradorResumoDto(int Id, string Nome);
