using System.ComponentModel.DataAnnotations;

namespace ConflitosAgendaApi.Dtos.Referencias;

/// <summary>
/// Referência a um colaborador existente dentro de outro payload.
/// Apenas o <see cref="Id"/> é usado; os demais campos são aceitos por
/// compatibilidade com o contrato atual e ignorados.
/// </summary>
public class ColaboradorReferenciaDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Informe o ID de um colaborador existente.")]
    public int Id { get; set; }
    public string? Nome { get; set; }
    public bool IsSupervisor { get; set; }
}
