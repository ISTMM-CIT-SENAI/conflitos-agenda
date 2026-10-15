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
            .Include(s => s.Coordenador)
            .FirstOrDefaultAsync(s => s.Id == id);
        return solicitacao;
    }

    public async Task<List<Solicitacao>> GetAllAsync()
    {
        var list = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Coordenador)
            .ToListAsync();
        
        return list;
    }

    public async Task<List<Solicitacao>> GetByColaboradorIdAsync(int colaboradorId)
    {
        var list = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Coordenador)
            .Where(s => s.Colaborador.Id == colaboradorId)
            .ToListAsync();
            
        return list;
    }

    public async Task<List<Solicitacao>> GetByStatusAsync(StatusSolicitacao status)
    {
        var list = await _context.Solicitacoes
            .Include(s => s.Colaborador)
            .Include(s => s.Periodos)
            .Include(s => s.Coordenador)
            .Where(s => s.Status == status)
            .ToListAsync();

        return list;
    }

    public async Task AddAsync(Solicitacao solicitacao)
    {
        try{
            await _context.Solicitacoes.AddAsync(solicitacao);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao adicionar solicitação: {ex.Message}");
        }
    }

    public async Task UpdateAsync(Solicitacao solicitacao)
    {
        try
        {
            _context.Solicitacoes.Update(solicitacao);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao atualizar solicitação: {ex.Message}");
        }
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
        try
        {
            _context.Solicitacoes.Remove(solicitacao);
            await _context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            throw new Exception($"Erro ao deletar a solicitação com ID {id}: {ex.Message}", ex);
        }
    }
    
}