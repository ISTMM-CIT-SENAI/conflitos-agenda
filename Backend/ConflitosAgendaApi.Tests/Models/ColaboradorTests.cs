using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Tests.Models;

public class ColaboradorTests
{
    [Fact]
    public void DefinirRespondeA_AceitaSupervisorERejeitaColaboradorComumOuASiMesmo()
    {
        var supervisor = new Colaborador("Italo", new(), isSupervisor: true);
        var colega = new Colaborador("Carlos", new(), isSupervisor: false);
        var pessoa = new Colaborador("Domisley", new(), isSupervisor: true);

        pessoa.DefinirRespondeA(supervisor);
        Assert.Same(supervisor, pessoa.RespondeA);

        Assert.Contains("não é supervisor", Assert.Throws<ArgumentException>(() => pessoa.DefinirRespondeA(colega)).Message);
        Assert.Contains("si mesmo", Assert.Throws<ArgumentException>(() => pessoa.DefinirRespondeA(pessoa)).Message);
        Assert.Same(supervisor, pessoa.RespondeA);

        pessoa.DefinirRespondeA(null);
        Assert.Null(pessoa.RespondeA);
        Assert.Null(pessoa.RespondeAId);
    }
}
