using ConflitosAgendaApi.Data;
using ConflitosAgendaApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ConflitosAgendaApi.Tests.Data;

public sealed class CargaInicialTests : IDisposable
{
    private readonly BancoEmMemoria _banco = new();
    private readonly string _csv = Path.Combine(Path.GetTempPath(), $"credenciais-{Guid.NewGuid():N}.csv");
    private static readonly string Dados = Path.Combine(AppContext.BaseDirectory, "data", "seed-istmm.json");

    public void Dispose()
    {
        _banco.Dispose();
        File.Delete(_csv);
    }

    [Fact]
    public async Task Carregar_CadastraOIstmmComUmUsuarioPorPessoa()
    {
        var hasher = new PasswordHasher<Usuario>();
        var criados = await CargaInicial.CarregarAsync(_banco.Contexto, hasher, Dados, _csv);

        var contexto = _banco.Contexto;
        var usuarios = await contexto.Usuarios.Include(u => u.Colaborador).ToListAsync();
        Assert.Equal(39, criados);
        Assert.Equal(39, await contexto.Colaboradores.CountAsync());
        Assert.Equal(39, usuarios.Count);
        Assert.Equal(10, await contexto.Projetos.CountAsync());
        Assert.All(usuarios, u => Assert.True(u.PrecisaTrocarSenha));

        var coordenador = Assert.Single(usuarios, u => u.IsCoordenador);
        Assert.Equal("hernane.moreira", coordenador.NomeUsuario);
        Assert.Null(coordenador.Colaborador.RespondeAId);
        Assert.Equal(4, usuarios.Count(u => u.Colaborador.IsSupervisor));
        // Todos, menos o Coordenador, respondem a alguém.
        Assert.Equal(38, await contexto.Colaboradores.CountAsync(c => c.RespondeAId != null));

        // A senha do CSV é a que entra: confere pelo hash.
        var linhas = await File.ReadAllLinesAsync(_csv);
        Assert.Equal(40, linhas.Length);
        var arthur = linhas.Single(l => l.StartsWith("Arthur Pereira Ramos Amaral;")).Split(';');
        Assert.Equal("arthur.amaral", arthur[1]);
        var usuarioArthur = usuarios.Single(u => u.NomeUsuario == "arthur.amaral");
        Assert.Equal(PasswordVerificationResult.Success, hasher.VerifyHashedPassword(usuarioArthur, usuarioArthur.SenhaHash, arthur[2]));
        Assert.Equal("Joao Henrique Rodrigues Costa", arthur[4]);
    }

    [Fact]
    public async Task Carregar_NaoFazNadaSeJaHouverColaboradores()
    {
        _banco.Contexto.Colaboradores.Add(new Colaborador("Alguém", new(), false));
        await _banco.Contexto.SaveChangesAsync();

        Assert.Equal(0, await CargaInicial.CarregarAsync(_banco.Contexto, new PasswordHasher<Usuario>(), Dados, _csv));
        Assert.False(File.Exists(_csv));
    }

    [Fact]
    public void NomesUsuario_PrimeiroEUltimoNome_ComNomeDoMeioQuandoCoincidem()
    {
        var nomes = CargaInicial.GerarNomesUsuario([
            "João Pedro Silva", "Joao Paulo Silva", "João Pedro Pereira", "Ítalo Magalhaes Dias", "Lucas Amaral de Alvarenga Pires",
        ]);

        Assert.Equal("joao.pedro.silva", nomes["João Pedro Silva"]);
        Assert.Equal("joao.paulo.silva", nomes["Joao Paulo Silva"]);
        Assert.Equal("joao.pereira", nomes["João Pedro Pereira"]);
        Assert.Equal("italo.dias", nomes["Ítalo Magalhaes Dias"]);
        Assert.Equal("lucas.pires", nomes["Lucas Amaral de Alvarenga Pires"]);
    }

    [Fact]
    public void NomesUsuario_FalhaSeAindaAssimCoincidirem() =>
        Assert.Throws<InvalidOperationException>(
            () => CargaInicial.GerarNomesUsuario(["Ana Maria Souza", "Ana Maria da Souza Lima Souza"]));
}
