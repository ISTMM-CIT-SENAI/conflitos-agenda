namespace ConflitosAgendaApi.Models;
public sealed class Periodo
{
    public Periodo()
    {
    }
    public Periodo(DateTime dataInicio, DateTime dataFim, int idColaborador = 0)
    {
            DataInicio = dataInicio;
            DataFim = dataFim;
            IdColaborador = idColaborador;
    }
    public void Atualizar(DateTime dataInicio, DateTime dataFim, int? idColaborador = null)
    {
        DataInicio = dataInicio;
        DataFim = dataFim;
        if (idColaborador is > 0)
        {
            IdColaborador = idColaborador.Value;
        }
    }

    public int Id { get; private set; }
    public DateTime DataInicio { get; private set; }
    public DateTime DataFim { get; private set; }
    public int IdColaborador { get; private set; }
    
}