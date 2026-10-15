using ConflitosAgendaApi.Models;
using System.ComponentModel.DataAnnotations;
namespace ConflitosAgendaApi.Dtos.Periodos;
public class PeriodoUpdateDto
{
    [Required]
    public DateTime DataInicio { get; set; }
    [Required]
    public DateTime DataFim { get; set; }
    public int IdColaborador { get; set; }

    public PeriodoUpdateDto()
    {
    }
    public PeriodoUpdateDto(Periodo periodo)
    {
        DataInicio = periodo.DataInicio;
        DataFim = periodo.DataFim;
    }
}