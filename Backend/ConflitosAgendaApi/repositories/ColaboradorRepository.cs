namespace ConflitosAgendaApi.Repositories;

using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Data;
using Microsoft.EntityFrameworkCore;
using ConflitosAgendaApi.Dtos.Colaboradores;

 public class ColaboradorRepository : IColaboradorRepository
{
    public readonly AppDbContext _context;
    public ColaboradorRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Colaborador?> GetByIdAsync(int id)
    {
        return await _context.Colaboradores.FindAsync(id);
    }

    public async Task<IEnumerable<Colaborador>> ListAllAsync()
    {
        return await _context.Colaboradores.ToListAsync();
    }
    
    public async Task<Colaborador?> AddAsync(Colaborador colaborador)
    {
        _context.Colaboradores.Add(colaborador);
        await _context.SaveChangesAsync();
        return colaborador;
    }

    public async Task<Colaborador?> UpdateAsync(Colaborador colaborador)
    {

        try
        {
            _context.Colaboradores.Update(colaborador);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (colaborador == null)
            {
                return null;
            }
            else
            {
                throw;
            }
        }
        catch (DbUpdateException)
        {
            throw;
        }
        
        return colaborador;
    }

    public async Task<Colaborador?> DeleteAsync(int id)
    {
        var existingColaborador = await _context.Colaboradores.FindAsync(id);
        if (existingColaborador == null)
        {
            return null;
        }

        _context.Colaboradores.Remove(existingColaborador);
        await _context.SaveChangesAsync();
        return existingColaborador;
    }

    public async Task<Colaborador?> TornarCoordenadorAsync(int id)
    {
        var colaborador = await _context.Colaboradores.FindAsync(id);
        if (colaborador == null)
        {
            return null;
        }

        colaborador.TornarCoordenador();
        await _context.SaveChangesAsync();
        return colaborador;
    }
    public Task<bool> ExisteComNomeAsync(string nome, int? ignorarId = null)
    {
        // A coluna usa a collation NOCASE, então a comparação ignora maiúsculas.
        var nomeLimpo = nome.Trim();
        return _context.Colaboradores.AnyAsync(c => c.Nome == nomeLimpo && c.Id != ignorarId);
    }
}
