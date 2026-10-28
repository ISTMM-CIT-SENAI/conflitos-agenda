using ConflitosAgendaApi.Dtos.Referencias;
using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories;
using ConflitosAgendaApi.Services;

namespace ConflitosAgendaApi.Tests.Services;

public sealed class SolicitacaoServiceTests : IDisposable
{
    private readonly BancoEmMemoria _banco = new();
    private readonly SolicitacaoService _service;
    private readonly Colaborador _coordenador;
    private readonly Colaborador _supervisor;
    private readonly Colaborador _colaborador;
    private readonly Usuario _usuarioCoordenador;

    public SolicitacaoServiceTests()
    {
        var contexto = _banco.Contexto;
        _service = new SolicitacaoService(
            new SolicitacaoRepository(contexto),
            new ConflitoSolicitacaoService(new ProjetoRepository(contexto), new SolicitacaoRepository(contexto)),
            new ColaboradorRepository(contexto),
            new PeriodoRepository(contexto),
            new UsuarioRepository(contexto));

        _coordenador = new Colaborador("Hernane", new(), isSupervisor: true);
        _supervisor = new Colaborador("Italo", new(), isSupervisor: true);
        _colaborador = new Colaborador("Carlos", new(), isSupervisor: false);
        _supervisor.DefinirRespondeA(_coordenador);
        _colaborador.DefinirRespondeA(_supervisor);
        contexto.Colaboradores.AddRange(_coordenador, _supervisor, _colaborador);
        _usuarioCoordenador = new Usuario("hernane", "hash", _coordenador, isCoordenador: true);
        contexto.Usuarios.Add(_usuarioCoordenador);
        contexto.SaveChanges();
    }

    public void Dispose() => _banco.Dispose();

    private PeriodoReferenciaDto Periodo(Colaborador dono, DateTime inicio, int dias)
    {
        var periodo = new Periodo(inicio, inicio.AddDays(dias), dono.Id);
        _banco.Contexto.Periodos.Add(periodo);
        _banco.Contexto.SaveChanges();
        return new PeriodoReferenciaDto { Id = periodo.Id };
    }

    private static SolicitacaoInsertionDto Nova(Colaborador colaborador, bool abono = false, params PeriodoReferenciaDto[] periodos) => new()
    {
        Colaborador = new ColaboradorReferenciaDto { Id = colaborador.Id },
        Periodos = periodos.ToList(),
        Abono = abono,
    };

    [Fact]
    public async Task Add_EncaminhaParaQuemOColaboradorRespondeECalculaOTotal()
    {
        var solicitacao = await _service.AddAsync(Nova(_colaborador, false,
            Periodo(_colaborador, new DateTime(2027, 1, 4), 14),
            Periodo(_colaborador, new DateTime(2027, 3, 1), 16)));

        Assert.Equal(_supervisor.Id, solicitacao.Supervisor.Id);
        Assert.Equal(StatusSolicitacao.Em_Analise, solicitacao.Status);
        Assert.Equal(30, solicitacao.TotalDias);
    }

    [Fact]
    public async Task Add_DoSupervisorVaiParaOCoordenador()
    {
        var solicitacao = await _service.AddAsync(Nova(_supervisor, false, Periodo(_supervisor, new DateTime(2027, 1, 4), 30)));

        Assert.Equal(_coordenador.Id, solicitacao.Supervisor.Id);
    }

    [Fact]
    public async Task Add_DoCoordenadorJaNasceAprovadaComADecisaoRegistrada()
    {
        var solicitacao = await _service.AddAsync(Nova(_coordenador, false, Periodo(_coordenador, new DateTime(2027, 1, 4), 30)));

        Assert.Equal(StatusSolicitacao.Aprovada, solicitacao.Status);
        Assert.Equal(_usuarioCoordenador.Id, solicitacao.DecididaPorId);
        Assert.NotNull(solicitacao.DecididaEm);
    }

    [Fact]
    public async Task Add_SemRespondeAFalha()
    {
        var semSuperior = new Colaborador("Sem Superior", new(), false);
        _banco.Contexto.Colaboradores.Add(semSuperior);
        await _banco.Contexto.SaveChangesAsync();

        var erro = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddAsync(Nova(semSuperior, false, Periodo(semSuperior, new DateTime(2027, 1, 4), 30))));
        Assert.Contains("Responde a", erro.Message);
    }

    [Fact]
    public async Task Add_FeriasEmPartesAteOSaldoDoAno_RecusadaNaoConta()
    {
        // 15 dias agora e 15 depois: cada pedido é uma parte das férias de 2027.
        var primeira = await _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2027, 1, 4), 15)));
        await _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2027, 8, 2), 15)));

        var erro = await Assert.ThrowsAsync<ArgumentException>(
            () => _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2027, 10, 4), 5))));
        Assert.Contains("35 dias de férias em 2027", erro.Message);

        // Em outro ano, o saldo é outro.
        await _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2028, 1, 3), 30)));

        primeira.Reprovar("Conflito com o projeto.");
        await _banco.Contexto.SaveChangesAsync();
        await _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2027, 10, 4), 15)));
    }

    [Fact]
    public async Task Update_ValidaAntesDeAlterarENaoMudaOSupervisor()
    {
        var original = Periodo(_colaborador, new DateTime(2027, 1, 4), 30);
        var solicitacao = await _service.AddAsync(Nova(_colaborador, false, original));

        var invalido = new SolicitacaoUpdateDto
        {
            Colaborador = new ColaboradorReferenciaDto { Id = _colaborador.Id },
            Periodos = [Periodo(_colaborador, new DateTime(2027, 6, 7), 4)],
        };
        await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(solicitacao.Id, invalido));
        Assert.Equal(original.Id, Assert.Single(solicitacao.Periodos).Id);

        var atualizada = await _service.UpdateAsync(solicitacao.Id, new SolicitacaoUpdateDto
        {
            Colaborador = new ColaboradorReferenciaDto { Id = _colaborador.Id },
            Periodos = [Periodo(_colaborador, new DateTime(2027, 6, 7), 14), Periodo(_colaborador, new DateTime(2027, 9, 6), 16)],
        });
        Assert.Equal(_supervisor.Id, atualizada!.Supervisor.Id);
        Assert.Equal(30, atualizada.TotalDias);
    }

    [Fact]
    public async Task NaoAceitaPeriodoDeOutraPessoa()
    {
        var doSupervisor = Periodo(_supervisor, new DateTime(2027, 1, 4), 30);
        await _service.AddAsync(Nova(_supervisor, false, doSupervisor));

        var erro = await Assert.ThrowsAsync<ArgumentException>(() => _service.AddAsync(Nova(_colaborador, false, doSupervisor)));
        Assert.Contains("devem pertencer ao colaborador", erro.Message);
    }

    [Fact]
    public async Task Update_NaoTrocaOColaborador()
    {
        var solicitacao = await _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2027, 1, 4), 30)));

        var erro = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateAsync(solicitacao.Id, new SolicitacaoUpdateDto
        {
            Colaborador = new ColaboradorReferenciaDto { Id = _supervisor.Id },
            Periodos = [Periodo(_supervisor, new DateTime(2027, 1, 4), 30)],
        }));
        Assert.Contains("não pode ser trocado", erro.Message);
    }

    [Fact]
    public async Task GetByIdAsync_DeveRetornarNullQuandoNaoEncontrar() =>
        Assert.Null(await _service.GetByIdAsync(99));

    [Fact]
    public async Task PessoaCriticaPodeSerColaboradorDeQualquerNivel()
    {
        var colega = new Colaborador("Domisley", new(), isSupervisor: false);
        colega.DefinirRespondeA(_supervisor);
        _banco.Contexto.Colaboradores.Add(colega);
        _banco.Contexto.Projetos.Add(new Projeto("SOAR", [_colaborador, colega], [_colaborador, colega]));
        await _banco.Contexto.SaveChangesAsync();
        await _service.AddAsync(Nova(colega, false, Periodo(colega, new DateTime(2027, 1, 11), 30)));

        var solicitacao = await _service.AddAsync(Nova(_colaborador, false, Periodo(_colaborador, new DateTime(2027, 1, 4), 30)));

        Assert.False(await _service.ValidateSolicitacaoAsync(solicitacao.Id));
    }
}
