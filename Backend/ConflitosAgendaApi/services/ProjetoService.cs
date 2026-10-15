namespace ConflitosAgendaApi.Services;
using ConflitosAgendaApi.Dtos.Projetos;
using ConflitosAgendaApi.Dtos.Colaboradores;
using ConflitosAgendaApi.Models;

using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services.Interfaces;

public class ProjetoService : IProjetoService
{
    private readonly IProjetoRepository _projetoRepository;
    private readonly IColaboradorRepository _colaboradorRepository;

    public ProjetoService(IProjetoRepository projetoRepository, IColaboradorRepository colaboradorRepository)
    {
        _projetoRepository = projetoRepository;
        _colaboradorRepository = colaboradorRepository;
    }

    public async Task<Projeto?> GetByIdAsync(int id)
    {
        var projeto = await _projetoRepository.GetByIdAsync(id);
        if (projeto == null) return null;
        return projeto;
    }

    public async Task<IEnumerable<Projeto>> ListAllAsync()
    {
        return await _projetoRepository.ListAllAsync();
    }

    public async Task<Projeto?> AddAsync(ProjetoInsertionDto projeto)
    {
        if (projeto == null)
        {
            throw new ArgumentNullException("O projeto informado não pode ser adicionado.");
        }
        var novoProjeto = await _projetoRepository.AddAsync(
            new Projeto(
                projeto.Nome,
                await _colaboradorRepository.ObterColaboradoresAsync(projeto.PessoasCriticas),
                await _colaboradorRepository.ObterColaboradoresAsync(projeto.Colaboradores)));

        return novoProjeto;
    }

    public async Task<Projeto?> UpdateAsync(int id, ProjetoUpdateDto projeto)
    {
        var existingProjeto = await _projetoRepository.GetByIdAsync(id);

        if (existingProjeto == null) return null;

        existingProjeto.Atualizar(
            projeto.Nome,
            await _colaboradorRepository.ObterColaboradoresAsync(projeto.PessoasCriticas),
            await _colaboradorRepository.ObterColaboradoresAsync(projeto.Colaboradores));

        var updatedProjeto = await _projetoRepository.UpdateAsync(existingProjeto);

        if (updatedProjeto == null) return null;
        
        return updatedProjeto;
    }

    public async Task<bool?> DeleteAsync(int id)
    {
        var deleted = await _projetoRepository.DeleteAsync(id);
        return deleted != null;
    }

    public async Task<IEnumerable<Colaborador>> ListColaboradoresAsync(int projetoId)
    {
        var projeto = await _projetoRepository.GetByIdAsync(projetoId);
        if (projeto == null)
        {
            throw new ArgumentNullException("O projeto informado não existe.");
        }
        return projeto.Colaboradores;
    }
}