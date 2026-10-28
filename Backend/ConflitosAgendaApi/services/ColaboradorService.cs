using ConflitosAgendaApi.Dtos.Colaboradores;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Services;

public class ColaboradorService : IColaboradorService
{
    private readonly IColaboradorRepository _colaboradorRepository;
    private readonly IUsuarioRepository _usuarioRepository;

    public ColaboradorService(IColaboradorRepository colaboradorRepository, IUsuarioRepository usuarioRepository)
    {
        _colaboradorRepository = colaboradorRepository;
        _usuarioRepository = usuarioRepository;
    }

    /// <summary>O nome completo é o único identificador do Colaborador: não pode se repetir.</summary>
    private async Task<string> ValidarNomeAsync(string nome, int? ignorarId = null)
    {
        var nomeLimpo = (nome ?? string.Empty).Trim();
        if (nomeLimpo.Length == 0)
        {
            throw new ArgumentException("Informe o nome completo.");
        }
        if (await _colaboradorRepository.ExisteComNomeAsync(nomeLimpo, ignorarId))
        {
            throw new ArgumentException($"Já existe um colaborador chamado \"{nomeLimpo}\". Diferencie o nome completo.");
        }
        return nomeLimpo;
    }

    private async Task<Colaborador?> ObterRespondeAAsync(int? id) =>
        id is null
            ? null
            : await _colaboradorRepository.GetByIdAsync(id.Value)
                ?? throw new ArgumentException($"Colaborador com ID {id} não encontrado.");

    public async Task<Colaborador?> GetByIdAsync(int id)
    {
        var colaborador =  await _colaboradorRepository.GetByIdAsync(id);

        if (colaborador == null)
        {
            return null;
        }
        return colaborador;
    }
    public async Task<IEnumerable<Colaborador>> ListAllAsync()
    {
        return await _colaboradorRepository.ListAllAsync();
    }
    public async Task<Colaborador?> AddAsync(
        ColaboradorInsertionDto dto)
    {
        var colaborador = new Colaborador(
            await ValidarNomeAsync(dto.Nome),
            new List<Projeto>(),
            false);
        colaborador.DefinirRespondeA(await ObterRespondeAAsync(dto.RespondeAId));

        var novoColaborador = await _colaboradorRepository.AddAsync(colaborador);

        if (novoColaborador is null)
        {
            return null;
        }

        return novoColaborador;
    }

    public async Task<Colaborador?> UpdateAsync(int id, ColaboradorUpdateDto dto)
    {
        var colaborador = await _colaboradorRepository.GetByIdAsync(id);

        if (colaborador is null)
        {
            return null;
        }

        colaborador.AtualizarDados(await ValidarNomeAsync(dto.Nome, id));
        colaborador.DefinirRespondeA(await ObterRespondeAAsync(dto.RespondeAId));

        var colaboradorAtualizado = await _colaboradorRepository.UpdateAsync(colaborador);

        if (colaboradorAtualizado is null)
        {
            return null;
        }

        return colaboradorAtualizado;
    }

    public async Task<bool?> DeleteAsync(int id)
    {
        var colaborador = await _colaboradorRepository.GetByIdAsync(id);
        if (colaborador == null)
        {
            throw new ArgumentNullException("O colaborador informado não existe.");
        }

        // Quem tem acesso ativo precisa ser desativado antes; uma conta já desativada
        // sai junto (se ela registrou decisões, o banco bloqueia e a API responde 409).
        var usuario = await _usuarioRepository.GetByColaboradorIdAsync(id);
        if (usuario is not null)
        {
            if (usuario.Ativo)
            {
                throw new ArgumentException(
                    $"{colaborador.Nome} tem acesso ativo ao sistema. Desative o usuário \"{usuario.NomeUsuario}\" antes de excluir.");
            }
            await _usuarioRepository.RemoveAsync(usuario);
        }

        await _colaboradorRepository.DeleteAsync(id);
        return true;
    }
    public async Task<Colaborador?> TornarSupervisorAsync(int id, ColaboradorUpdateDto dto)
    {
        var colaborador = await _colaboradorRepository.GetByIdAsync(id);

        if (colaborador is null)
        {
            return null;
        }
        colaborador.TornarSupervisor();

        var colaboradorAtualizado = await _colaboradorRepository.UpdateAsync(colaborador);

        if (colaboradorAtualizado is null)
        {
            return null;
        }

        return colaboradorAtualizado;
    }

}
