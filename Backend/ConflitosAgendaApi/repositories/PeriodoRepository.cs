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
        try
        {
            var periodo = await _context.Periodos.FindAsync(id);
            return periodo;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao buscar o período com ID {id}: {ex.Message}", ex);
        }
    }

    public async Task<IEnumerable<Periodo>> ListAllAsync()
    {
        try
        {
            return await _context.Periodos.ToListAsync();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao listar todos os períodos: {ex.Message}", ex);
        }
    }
    
    public async Task<Periodo?> AddAsync(Periodo periodo)
    {
        try
        {
            _context.Periodos.Add(periodo);
            await _context.SaveChangesAsync();
            return periodo;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao adicionar o período: {ex.Message}", ex);
        }
    }

    public async Task<Periodo?> UpdateAsync(Periodo periodo)
    {

        try
        {
            _context.Periodos.Update(periodo);
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (periodo == null)
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
        
        return periodo;
    }

    public async Task<Periodo?> DeleteAsync(int id)
    {
        try
        {
         var periodo = await _context.Periodos.FindAsync(id);
         if (periodo == null)
         {
             throw new KeyNotFoundException($"Período com ID {id} não encontrado.");
         }
        _context.Periodos.Remove(periodo);
        await _context.SaveChangesAsync();
        return periodo;
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao deletar o período com ID {id}: {ex.Message}", ex);
        }
       
        
    }

    public async Task<IEnumerable<Periodo>> ListByColaboradorIdAsync(int colaboradorId)
    {
        try
        {
            return await _context.Periodos
                .Where(p => p.IdColaborador == colaboradorId)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao listar períodos para o colaborador com ID {colaboradorId}: {ex.Message}", ex);
        }
    }
}