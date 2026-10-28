using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Repositories.Interfaces;

public interface IUsuarioRepository
{
    /// <summary>Carrega o Usuário com o Colaborador ligado.</summary>
    Task<Usuario?> GetByIdAsync(int id);
    Task<Usuario?> GetByNomeUsuarioAsync(string nomeUsuario);
    Task<Usuario?> GetByColaboradorIdAsync(int colaboradorId);
    Task<List<Usuario>> ListAllAsync();
    Task<int> ContarCoordenadoresAtivosAsync();
    Task AddAsync(Usuario usuario);
    Task RemoveAsync(Usuario usuario);
    Task SaveChangesAsync();
}
