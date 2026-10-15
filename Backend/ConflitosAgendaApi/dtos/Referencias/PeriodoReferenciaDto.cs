using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Referencias;

/// <summary>
/// Referência a um período existente dentro de outro payload.
/// Apenas o <see cref="Id"/> é usado; as datas são lidas do banco.
/// </summary>
public class PeriodoReferenciaDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Informe o ID de um período existente.")]
    public int Id { get; set; }
    public DateTime DataInicio { get; set; }
    public DateTime DataFim { get; set; }
    public int IdColaborador { get; set; }
}
