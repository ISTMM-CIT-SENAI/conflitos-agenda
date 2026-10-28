using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services.Acesso;
using Microsoft.AspNetCore.Identity;

namespace ConflitosAgendaApi.Tests.Services;

public class RegrasAcessoTests
{
    private static UsuarioAtual Usuario(int colaboradorId, bool coordenador = false, bool supervisor = false) =>
        new(UsuarioId: colaboradorId * 10, NomeUsuario: $"u{colaboradorId}", ColaboradorId: colaboradorId,
            NomeColaborador: $"Pessoa {colaboradorId}", IsCoordenador: coordenador, IsSupervisor: supervisor,
            PrecisaTrocarSenha: false);

    [Fact]
    public void Nivel_DeveSerDerivadoDoColaboradorQuandoNaoForCoordenador()
    {
        Assert.Equal(NivelAcesso.Coordenador, Usuario(1, coordenador: true).Nivel);
        Assert.Equal(NivelAcesso.Supervisor, Usuario(1, supervisor: true).Nivel);
        Assert.Equal(NivelAcesso.Colaborador, Usuario(1).Nivel);
    }

    [Fact]
    public void Colaborador_SoVeAsProprias()
    {
        var colaborador = Usuario(1);
        Assert.True(RegrasAcesso.PodeVerSolicitacao(colaborador, colaboradorId: 1, supervisorId: 2));
        Assert.False(RegrasAcesso.PodeVerSolicitacao(colaborador, colaboradorId: 3, supervisorId: 2));
    }

    [Fact]
    public void Supervisor_VeAsAtribuidasEDecideSoAsAtribuidas()
    {
        var supervisor = Usuario(2, supervisor: true);
        Assert.True(RegrasAcesso.PodeVerSolicitacao(supervisor, colaboradorId: 1, supervisorId: 2));
        Assert.True(RegrasAcesso.PodeDecidir(supervisor, colaboradorId: 1, supervisorId: 2));
        Assert.False(RegrasAcesso.PodeDecidir(supervisor, colaboradorId: 1, supervisorId: 5));
        Assert.False(RegrasAcesso.PodeEditarSolicitacao(supervisor, colaboradorId: 1));
    }

    [Fact]
    public void CoordenadorESupervisorVeemAMesmaSolicitacao_OutroSupervisorNao()
    {
        var coordenador = Usuario(9, coordenador: true, supervisor: true);
        var supervisor = Usuario(2, supervisor: true);
        var outroSupervisor = Usuario(3, supervisor: true);

        Assert.True(RegrasAcesso.PodeVerSolicitacao(coordenador, colaboradorId: 1, supervisorId: 2));
        Assert.True(RegrasAcesso.PodeVerSolicitacao(supervisor, colaboradorId: 1, supervisorId: 2));
        Assert.False(RegrasAcesso.PodeVerSolicitacao(outroSupervisor, colaboradorId: 1, supervisorId: 2));
        // Os dois podem decidir; o sistema registra quem decidiu.
        Assert.True(RegrasAcesso.PodeDecidir(coordenador, colaboradorId: 1, supervisorId: 2));
        Assert.True(RegrasAcesso.PodeDecidir(supervisor, colaboradorId: 1, supervisorId: 2));
    }

    [Fact]
    public void SupervisorSoMudaOStatus_NaoOsPeriodosNemOAbono()
    {
        var supervisor = new Colaborador("Bruno", new(), true);
        var atual = new ConflitosAgendaApi.Dtos.Solicitacoes.SolicitacaoResponseDto(new Solicitacao(
            new Colaborador("Carla", new(), false),
            [new Periodo(new DateTime(2027, 1, 4), new DateTime(2027, 2, 3))],
            StatusSolicitacao.Em_Analise, DateTimeOffset.UtcNow, supervisor));
        ConflitosAgendaApi.Dtos.Solicitacoes.SolicitacaoUpdateDto Pedido(int periodoId, bool? abono) => new()
        {
            Colaborador = new() { Id = atual.Colaborador.Id },
            Periodos = [new() { Id = periodoId }],
            Status = StatusSolicitacao.Aprovada,
            Abono = abono,
        };
        var periodoAtual = atual.Periodos[0].Id;

        Assert.True(RegrasAcesso.AlteraSomenteStatus(atual, Pedido(periodoAtual, abono: null)));
        Assert.False(RegrasAcesso.AlteraSomenteStatus(atual, Pedido(periodoAtual + 1, abono: null)));
        Assert.False(RegrasAcesso.AlteraSomenteStatus(atual, Pedido(periodoAtual, abono: true)));
    }

    [Fact]
    public void NinguemDecideAPropria_NemOCoordenador()
    {
        var coordenador = Usuario(9, coordenador: true, supervisor: true);
        Assert.True(RegrasAcesso.PodeDecidir(coordenador, colaboradorId: 1, supervisorId: 2));
        Assert.False(RegrasAcesso.PodeDecidir(coordenador, colaboradorId: 9, supervisorId: 2));
    }

    [Fact]
    public void Dono_SoExcluiAntesDaDecisao()
    {
        var colaborador = Usuario(1);
        Assert.True(RegrasAcesso.PodeExcluirSolicitacao(colaborador, 1, StatusSolicitacao.Em_Analise));
        Assert.False(RegrasAcesso.PodeExcluirSolicitacao(colaborador, 1, StatusSolicitacao.Aprovada));
        Assert.True(RegrasAcesso.PodeExcluirSolicitacao(Usuario(9, coordenador: true), 1, StatusSolicitacao.Aprovada));
    }

    [Theory]
    [InlineData("ab", false)]
    [InlineData("Arthur6890", true)]
    [InlineData("joao.silva", true)]
    [InlineData("com espaço", false)]
    [InlineData("nome-de-usuario-com-mais-de-trinta-caracteres", false)]
    public void NomeUsuario_DeveSeguirOPadrao(string nome, bool valido)
    {
        var excecao = Record.Exception(() => ValidacaoCredenciais.ValidarNomeUsuario(nome));
        Assert.Equal(valido, excecao is null);
    }

    [Fact]
    public void Senha_DeveTerNoMinimoOitoCaracteres()
    {
        Assert.Throws<ArgumentException>(() => ValidacaoCredenciais.ValidarSenha("1234567"));
        ValidacaoCredenciais.ValidarSenha("12345678");
    }
}

public class AutenticacaoServiceTests
{
    private static readonly DateTimeOffset Agora = new(2026, 10, 19, 12, 0, 0, TimeSpan.Zero);
    private readonly PasswordHasher<Usuario> _hasher = new();

    private (AutenticacaoService Servico, FakeUsuarioRepository Repositorio, Usuario Usuario) Criar(string senha = "senha-correta")
    {
        var usuario = new Usuario("Arthur6890", string.Empty, new Colaborador("Arthur Ramos", new(), false), false);
        usuario.DefinirSenha(_hasher.HashPassword(usuario, senha));
        var repositorio = new FakeUsuarioRepository(usuario);
        return (new AutenticacaoService(repositorio, _hasher, new RelogioFixo(Agora)), repositorio, usuario);
    }

    [Fact]
    public async Task Entrar_SemDiferenciarMaiusculasNoNomeDeUsuario()
    {
        var (servico, _, _) = Criar();
        var resultado = await servico.EntrarAsync("arthur6890", "senha-correta");
        Assert.True(resultado.Sucesso);
    }

    [Fact]
    public async Task Entrar_UsuarioInexistenteEDesativadoTemAMesmaMensagemDeSenhaErrada()
    {
        var (servico, _, usuario) = Criar();
        Assert.Equal(AutenticacaoService.MensagemCredenciaisInvalidas, (await servico.EntrarAsync("ninguem", "x")).Erro);
        Assert.Equal(AutenticacaoService.MensagemCredenciaisInvalidas, (await servico.EntrarAsync("Arthur6890", "errada")).Erro);
        usuario.Desativar();
        Assert.Equal(AutenticacaoService.MensagemCredenciaisInvalidas, (await servico.EntrarAsync("Arthur6890", "senha-correta")).Erro);
    }

    [Fact]
    public async Task Entrar_BloqueiaApos5TentativasErradas()
    {
        var (servico, _, usuario) = Criar();
        for (var i = 0; i < 5; i++)
        {
            await servico.EntrarAsync("Arthur6890", "errada");
        }

        Assert.True(usuario.EstaBloqueado(Agora.UtcDateTime));
        var resultado = await servico.EntrarAsync("Arthur6890", "senha-correta");
        Assert.False(resultado.Sucesso);
        Assert.Contains("Muitas tentativas", resultado.Erro);
    }

    [Fact]
    public async Task TrocarSenha_ExigeSenhaAtualCorretaELiberaOAcesso()
    {
        var (servico, _, usuario) = Criar();
        usuario.RedefinirSenhaTemporaria(_hasher.HashPassword(usuario, "temporaria"));

        await Assert.ThrowsAsync<ArgumentException>(() => servico.TrocarSenhaAsync(usuario.Id, "errada", "nova-senha-123"));
        await Assert.ThrowsAsync<ArgumentException>(() => servico.TrocarSenhaAsync(usuario.Id, "temporaria", "curta"));

        await servico.TrocarSenhaAsync(usuario.Id, "temporaria", "nova-senha-123");
        Assert.False(usuario.PrecisaTrocarSenha);
        Assert.True((await servico.EntrarAsync("Arthur6890", "nova-senha-123")).Sucesso);
    }

    [Fact]
    public void Senha_NuncaEGuardadaEmTextoPuro()
    {
        var (_, _, usuario) = Criar("senha-correta");
        Assert.DoesNotContain("senha-correta", usuario.SenhaHash);
    }
}

public class UsuarioServiceTests
{
    [Fact]
    public async Task NaoPermiteDesativarASiMesmoNemOUltimoCoordenador()
    {
        var coordenador = new Usuario("hernane", "hash", new Colaborador("Hernane", new(), true), isCoordenador: true);
        var repositorio = new FakeUsuarioRepository(coordenador);
        var servico = new UsuarioService(repositorio, null!, new PasswordHasher<Usuario>());
        var euMesmo = UsuarioAtual.De(coordenador);
        var outro = euMesmo with { UsuarioId = 999 };

        await Assert.ThrowsAsync<ArgumentException>(() => servico.DesativarAsync(coordenador.Id, euMesmo));
        var excecao = await Assert.ThrowsAsync<ArgumentException>(() => servico.DesativarAsync(coordenador.Id, outro));
        Assert.Contains("pelo menos um coordenador", excecao.Message);
    }

    [Fact]
    public async Task RedefinirSenha_ObrigaATrocaNoProximoLogin()
    {
        var usuario = new Usuario("joao", "hash", new Colaborador("João", new(), false), false);
        usuario.DefinirSenha("hash-definitivo");
        var servico = new UsuarioService(new FakeUsuarioRepository(usuario), null!, new PasswordHasher<Usuario>());

        await servico.RedefinirSenhaAsync(usuario.Id, "temporaria-123");

        Assert.True(usuario.PrecisaTrocarSenha);
    }
}

internal sealed class RelogioFixo(DateTimeOffset agora) : TimeProvider
{
    public override DateTimeOffset GetUtcNow() => agora;
}

/// <summary>Repositório em memória com um único Usuário (Id 0).</summary>
internal sealed class FakeUsuarioRepository(Usuario usuario) : IUsuarioRepository
{
    public Task<Usuario?> GetByIdAsync(int id) => Task.FromResult<Usuario?>(id == usuario.Id ? usuario : null);
    public Task<Usuario?> GetByNomeUsuarioAsync(string nomeUsuario) =>
        Task.FromResult<Usuario?>(Usuario.Normalizar(nomeUsuario) == usuario.NomeUsuarioNormalizado ? usuario : null);
    public Task<Usuario?> GetByColaboradorIdAsync(int colaboradorId) => Task.FromResult<Usuario?>(null);
    public Task<List<Usuario>> ListAllAsync() => Task.FromResult(new List<Usuario> { usuario });
    public Task<int> ContarCoordenadoresAtivosAsync() =>
        Task.FromResult(usuario.IsCoordenador && usuario.Ativo ? 1 : 0);
    public Task AddAsync(Usuario novo) => Task.CompletedTask;
    public Task RemoveAsync(Usuario removido) => Task.CompletedTask;
    public Task SaveChangesAsync() => Task.CompletedTask;
}
