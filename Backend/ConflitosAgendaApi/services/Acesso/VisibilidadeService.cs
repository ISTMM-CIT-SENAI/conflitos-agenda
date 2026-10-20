using ConflitosAgendaApi.Dtos.Solicitacoes;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;

namespace ConflitosAgendaApi.Services.Acesso;

public interface IVisibilidadeService
{
    Task<IEnumerable<Periodo>> FiltrarPeriodosAsync(UsuarioAtual usuario, IEnumerable<Periodo> periodos);
    IEnumerable<SolicitacaoResponseDto> FiltrarSolicitacoes(UsuarioAtual usuario, IEnumerable<SolicitacaoResponseDto> solicitacoes);
}

/// <summary>
/// O Administrador vê tudo. Os demais veem as próprias solicitações (e as atribuídas,
/// se coordenadores) e, no calendário, as ausências planejadas dos colegas dos mesmos
/// projetos: apenas os períodos, sem os detalhes da solicitação.
/// </summary>
public sealed class VisibilidadeService : IVisibilidadeService
{
    private readonly IProjetoRepository _projetoRepository;
    private readonly ISolicitacaoRepository _solicitacaoRepository;

    public VisibilidadeService(IProjetoRepository projetoRepository, ISolicitacaoRepository solicitacaoRepository)
    {
        _projetoRepository = projetoRepository;
        _solicitacaoRepository = solicitacaoRepository;
    }

    public async Task<IEnumerable<Periodo>> FiltrarPeriodosAsync(UsuarioAtual usuario, IEnumerable<Periodo> periodos)
    {
        if (usuario.IsAdministrador)
        {
            return periodos;
        }

        var projetos = await _projetoRepository.ListAllAsync();
        var colegas = projetos
            .Where(projeto => projeto.Colaboradores.Any(c => c.Id == usuario.ColaboradorId))
            .SelectMany(projeto => projeto.Colaboradores.Select(c => c.Id))
            .ToHashSet();

        // Dos colegas, só as ausências que já fazem parte de uma solicitação não recusada.
        var solicitacoes = await _solicitacaoRepository.GetAllAsync();
        var periodosPlanejadosDeColegas = solicitacoes
            .Where(s => s.Status != StatusSolicitacao.Recusada && colegas.Contains(s.Colaborador.Id))
            .SelectMany(s => s.Periodos.Select(p => p.Id))
            .ToHashSet();

        return periodos.Where(periodo =>
            RegrasAcesso.EhDono(usuario, periodo.IdColaborador)
            || periodosPlanejadosDeColegas.Contains(periodo.Id));
    }

    public IEnumerable<SolicitacaoResponseDto> FiltrarSolicitacoes(
        UsuarioAtual usuario,
        IEnumerable<SolicitacaoResponseDto> solicitacoes) =>
        solicitacoes.Where(s => RegrasAcesso.PodeVerSolicitacao(usuario, s.Colaborador.Id, s.Coordenador.Id));
}
