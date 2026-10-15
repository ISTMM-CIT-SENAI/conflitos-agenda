namespace ConflitosAgendaApi.Repositories;

using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using ConflitosAgendaApi.Data;

public class ProjetoRepository : IProjetoRepository
{
    private readonly AppDbContext _context;

    public ProjetoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Projeto?> GetByIdAsync(int id)
    {
        return await _context.Projetos
            .Include(projeto => projeto.Colaboradores)
            .Include(projeto => projeto.PessoasCriticas)
            .FirstOrDefaultAsync(projeto => projeto.Id == id);
    }

    public async Task<IEnumerable<Projeto>> ListAllAsync()
    {
        return await _context.Projetos
            .Include(projeto => projeto.Colaboradores)
            .Include(projeto => projeto.PessoasCriticas)
            .ToListAsync();
    }

    public async Task<Projeto?> AddAsync(Projeto projeto)
    {
        _context.Projetos.Add(projeto);
        await _context.SaveChangesAsync();
        return projeto;
    }

    public async Task<Projeto?> UpdateAsync(Projeto projeto)
    {
        // O serviço altera a entidade já rastreada (carregada com as coleções);
        // basta persistir. Chamar Atualizar/Update aqui de novo duplicava o trabalho.
        if (_context.Entry(projeto).State == EntityState.Detached)
        {
            return null;
        }
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw;
        }
        catch (DbUpdateException)
        {
            throw;
        }
        return projeto;
    }

    public async Task<Projeto?> DeleteAsync(int id)
    {
        var projeto = await _context.Projetos.FindAsync(id);
        if (projeto == null)
        {
            return null;
        }

        _context.Projetos.Remove(projeto);
        await _context.SaveChangesAsync();
        return projeto;
    }

    public async Task<IEnumerable<Projeto>> ListProjetosByColaboradorIdAsync(int colaboradorId)
    {
        var projetos = await _context.Projetos
            .Include(projeto => projeto.PessoasCriticas)
            .Where(p => p.Colaboradores.Any(c => c.Id == colaboradorId))
            .ToListAsync();

        return projetos;
    }

    public async Task<IEnumerable<Projeto>> ListProjetosByPessoasCriticasIdAsync(int pessoacriticaId)
    {
        var projetos = await _context.Projetos
            .Include(projeto => projeto.PessoasCriticas)
            .Where(p => p.PessoasCriticas.Any(c => c.Id == pessoacriticaId))
            .ToListAsync();

        return projetos;
    }
}