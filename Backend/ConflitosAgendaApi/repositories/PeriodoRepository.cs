using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Data;
using Microsoft.EntityFrameworkCore;

public class PeriodoRepository : IPeriodoRepository
{
    public readonly AppDbContext _context;
    public PeriodoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Periodo?> GetByIdAsync(int id)
    {
        return await _context.Periodos.FindAsync(id);
    }

    public async Task<IEnumerable<Periodo>> ListAllAsync()
    {
        return await _context.Periodos.ToListAsync();
    }

    public async Task<Periodo?> AddAsync(Periodo periodo)
    {
        _context.Periodos.Add(periodo);
        await _context.SaveChangesAsync();
        return periodo;
    }

    public async Task<Periodo?> UpdateAsync(Periodo periodo)
    {
        _context.Periodos.Update(periodo);
        await _context.SaveChangesAsync();
        return periodo;
    }

    public async Task<Periodo?> DeleteAsync(int id)
    {
        var periodo = await _context.Periodos.FindAsync(id)
            ?? throw new KeyNotFoundException($"Período com ID {id} não encontrado.");
        _context.Periodos.Remove(periodo);
        await _context.SaveChangesAsync();
        return periodo;
    }

    public async Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId)
    {
        return await _context.Periodos
            .Where(p => p.IdColaborador == colaboradorId)
            .ToListAsync();
    }
}
