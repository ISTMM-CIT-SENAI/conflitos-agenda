namespace ConflitosAgendaApi.Repositories;

using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Data;
using Microsoft.EntityFrameworkCore;
public class SolicitacaoRepository : ISolicitacaoRepository
{
    private readonly AppDbContext _context;

    public SolicitacaoRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Solicitacao?> GetByIdAsync(int id)
    {
        var solicitacao = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Supervisor)
            .Include(s => s.DecididaPor).ThenInclude(u => u!.Colaborador)
            .FirstOrDefaultAsync(s => s.Id == id);
        return solicitacao;
    }

    public async Task<List<Solicitacao>> GetAllAsync()
    {
        var list = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Supervisor)
            .Include(s => s.DecididaPor).ThenInclude(u => u!.Colaborador)
            .ToListAsync();
        
        return list;
    }

    public async Task<List<Solicitacao>> GetByColaboradorIdAsync(int colaboradorId)
    {
        var list = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Supervisor)
            .Include(s => s.DecididaPor).ThenInclude(u => u!.Colaborador)
            .Where(s => s.Colaborador.Id == colaboradorId)
            .ToListAsync();
            
        return list;
    }

    public async Task<List<Solicitacao>> GetByStatusAsync(StatusSolicitacao status)
    {
        var list = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Supervisor)
            .Include(s => s.DecididaPor).ThenInclude(u => u!.Colaborador)
            .Where(s => s.Status == status)
            .ToListAsync();

        return list;
    }

    public async Task AddAsync(Solicitacao solicitacao)
    {
        await _context.Solicitacoes.AddAsync(solicitacao);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Solicitacao solicitacao)
    {
        _context.Solicitacoes.Update(solicitacao);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        // Carrega os períodos para o EF desvinculá-los (SolicitacaoId = null) antes de excluir;
        // sem isso a FK de Periodos bloqueia a exclusão.
        var solicitacao = await _context.Solicitacoes
            .Include(s => s.Periodos)
            .FirstOrDefaultAsync(s => s.Id == id);
        if (solicitacao == null)
        {
            throw new KeyNotFoundException($"Solicitação com ID {id} não encontrada.");
        }
        _context.Solicitacoes.Remove(solicitacao);
        await _context.SaveChangesAsync();
    }
    
}