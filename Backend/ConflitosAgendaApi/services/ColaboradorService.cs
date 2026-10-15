using ConflitosAgendaApi.Dtos.Colaboradores;
using ConflitosAgendaApi.Services.Interfaces;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Services;

public class ColaboradorService : IColaboradorService
{
    private readonly IColaboradorRepository _colaboradorRepository;

    public ColaboradorService(IColaboradorRepository colaboradorRepository)
    {
        _colaboradorRepository = colaboradorRepository;
    }

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
            dto.Nome,
            dto.Email,
            new List<Projeto>(),
            false);

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

        colaborador.AtualizarDados(dto.Nome, dto.Email);

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
        await _colaboradorRepository.DeleteAsync(id);
        return true;
    }
    public async Task<Colaborador?> TornarCoordenadorAsync(int id, ColaboradorUpdateDto dto)
    {
        var colaborador = await _colaboradorRepository.GetByIdAsync(id);

        if (colaborador is null)
        {
            return null;
        }
        colaborador.TornarCoordenador();

        var colaboradorAtualizado = await _colaboradorRepository.UpdateAsync(colaborador);

        if (colaboradorAtualizado is null)
        {
            return null;
        }

        return colaboradorAtualizado;
    }

}
