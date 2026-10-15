using ConflitosAgendaApi.Dtos.Colaboradores;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Dtos.Projetos;

public class ProjetoResponseDto
{
    public int Id { get; private set; }
    public string Nome { get; private set; } = string.Empty;
    public List<ColaboradorResponseDto> PessoasCriticas { get; private set; } = new();
    public List<ColaboradorResponseDto> Colaboradores { get; private set; } = new();

    public ProjetoResponseDto(Projeto projeto)
    {
        Id = projeto.Id;
        Nome = projeto.Nome;
        PessoasCriticas = projeto.PessoasCriticas.Select(c => new ColaboradorResponseDto(c)).ToList();
        Colaboradores = projeto.Colaboradores.Select(c => new ColaboradorResponseDto(c)).ToList();
    }
}
