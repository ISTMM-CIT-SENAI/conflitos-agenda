using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace ConflitosAgendaApi.Services.Acesso;

public interface IUsuarioService
{
    Task<List<Usuario>> ListarAsync();
    Task<Usuario> CriarAsync(int colaboradorId, string nomeUsuario, string senhaTemporaria, bool isCoordenador);
    Task<Usuario> DefinirCoordenadorAsync(int usuarioId, bool isCoordenador, UsuarioAtual quemAltera);
    Task<Usuario> RedefinirSenhaAsync(int usuarioId, string senhaTemporaria);
    Task<Usuario> DesativarAsync(int usuarioId, UsuarioAtual quemAltera);
    Task<Usuario> ReativarAsync(int usuarioId);
}

/// <summary>Operações do Coordenador sobre as contas de acesso.</summary>
public sealed class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IColaboradorRepository _colaboradorRepository;
    private readonly IPasswordHasher<Usuario> _hasher;

    public UsuarioService(
        IUsuarioRepository usuarioRepository,
        IColaboradorRepository colaboradorRepository,
        IPasswordHasher<Usuario> hasher)
    {
        _usuarioRepository = usuarioRepository;
        _colaboradorRepository = colaboradorRepository;
        _hasher = hasher;
    }

    public Task<List<Usuario>> ListarAsync() => _usuarioRepository.ListAllAsync();

    public async Task<Usuario> CriarAsync(int colaboradorId, string nomeUsuario, string senhaTemporaria, bool isCoordenador)
    {
        ValidacaoCredenciais.ValidarNomeUsuario(nomeUsuario);
        ValidacaoCredenciais.ValidarSenha(senhaTemporaria);

        var colaborador = await _colaboradorRepository.GetByIdAsync(colaboradorId)
            ?? throw new ArgumentException($"Colaborador com ID {colaboradorId} não encontrado.");

        if (await _usuarioRepository.GetByColaboradorIdAsync(colaboradorId) is not null)
        {
            throw new ArgumentException($"{colaborador.Nome} já possui acesso ao sistema.");
        }
        if (await _usuarioRepository.GetByNomeUsuarioAsync(nomeUsuario) is not null)
        {
            throw new ArgumentException($"O nome de usuário \"{nomeUsuario.Trim()}\" já está em uso.");
        }

        var usuario = new Usuario(nomeUsuario.Trim(), string.Empty, colaborador, isCoordenador);
        usuario.RedefinirSenhaTemporaria(_hasher.HashPassword(usuario, senhaTemporaria));
        await _usuarioRepository.AddAsync(usuario);
        return usuario;
    }

    public async Task<Usuario> DefinirCoordenadorAsync(int usuarioId, bool isCoordenador, UsuarioAtual quemAltera)
    {
        var usuario = await ObterAsync(usuarioId);
        if (!isCoordenador && usuario.IsCoordenador)
        {
            if (usuario.Id == quemAltera.UsuarioId)
            {
                throw new ArgumentException("Você não pode remover seu próprio acesso de coordenador.");
            }
            await GarantirOutroCoordenadorAtivoAsync(usuario);
        }

        usuario.DefinirCoordenador(isCoordenador);
        await _usuarioRepository.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario> RedefinirSenhaAsync(int usuarioId, string senhaTemporaria)
    {
        ValidacaoCredenciais.ValidarSenha(senhaTemporaria);
        var usuario = await ObterAsync(usuarioId);
        usuario.RedefinirSenhaTemporaria(_hasher.HashPassword(usuario, senhaTemporaria));
        await _usuarioRepository.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario> DesativarAsync(int usuarioId, UsuarioAtual quemAltera)
    {
        var usuario = await ObterAsync(usuarioId);
        if (usuario.Id == quemAltera.UsuarioId)
        {
            throw new ArgumentException("Você não pode desativar o seu próprio acesso.");
        }
        if (usuario.IsCoordenador && usuario.Ativo)
        {
            await GarantirOutroCoordenadorAtivoAsync(usuario);
        }

        usuario.Desativar();
        await _usuarioRepository.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario> ReativarAsync(int usuarioId)
    {
        var usuario = await ObterAsync(usuarioId);
        usuario.Reativar();
        await _usuarioRepository.SaveChangesAsync();
        return usuario;
    }

    private async Task<Usuario> ObterAsync(int usuarioId) =>
        await _usuarioRepository.GetByIdAsync(usuarioId)
        ?? throw new KeyNotFoundException($"Usuário com ID {usuarioId} não encontrado.");

    private async Task GarantirOutroCoordenadorAtivoAsync(Usuario usuario)
    {
        var ativos = await _usuarioRepository.ContarCoordenadoresAtivosAsync();
        if (usuario.Ativo && ativos <= 1)
        {
            throw new ArgumentException("O sistema precisa de pelo menos um coordenador ativo.");
        }
    }
}
