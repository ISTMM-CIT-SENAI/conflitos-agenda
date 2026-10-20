using ConflitosAgendaApi.Data;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ConflitosAgendaApi.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly AppDbContext _context;

    public UsuarioRepository(AppDbContext context)
    {
        _context = context;
    }

    public Task<Usuario?> GetByIdAsync(int id) =>
        _context.Usuarios
            .Include(usuario => usuario.Colaborador)
            .FirstOrDefaultAsync(usuario => usuario.Id == id);

    public Task<Usuario?> GetByNomeUsuarioAsync(string nomeUsuario)
    {
        var normalizado = Usuario.Normalizar(nomeUsuario);
        return _context.Usuarios
            .Include(usuario => usuario.Colaborador)
            .FirstOrDefaultAsync(usuario => usuario.NomeUsuarioNormalizado == normalizado);
    }

    public Task<Usuario?> GetByColaboradorIdAsync(int colaboradorId) =>
        _context.Usuarios
            .Include(usuario => usuario.Colaborador)
            .FirstOrDefaultAsync(usuario => usuario.ColaboradorId == colaboradorId);

    public Task<List<Usuario>> ListAllAsync() =>
        _context.Usuarios
            .Include(usuario => usuario.Colaborador)
            .OrderBy(usuario => usuario.NomeUsuarioNormalizado)
            .ToListAsync();

    public Task<bool> ExisteAlgumAsync() => _context.Usuarios.AnyAsync();

    public Task<int> ContarAdministradoresAtivosAsync() =>
        _context.Usuarios.CountAsync(usuario => usuario.IsAdministrador && usuario.Ativo);

    public async Task AddAsync(Usuario usuario)
    {
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
    }

    public async Task RemoveAsync(Usuario usuario)
    {
        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
    }

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}
