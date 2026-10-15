using ConflitosAgendaApi.Models;
using System.ComponentModel.DataAnnotations;
namespace ConflitosAgendaApi.Dtos.Periodos;

public class PeriodoResponseDto
{
    [Required]
    public int Id { get; private set; }
    [Required]
    public DateTime DataInicio { get; private set; }
    [Required]
    public DateTime DataFim { get; private set; }
    public int IdColaborador { get; private set; }

    public PeriodoResponseDto(Periodo periodo)
    {
        Id = periodo.Id;
        DataInicio = periodo.DataInicio;
        DataFim = periodo.DataFim;
        IdColaborador = periodo.IdColaborador;
    }
}