using ConflitosAgendaApi.Data;
using ConflitosAgendaApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ConflitosAgendaApi.Services.Acesso;

/// <summary>
/// Num banco sem usuários, cria o primeiro Administrador e o Colaborador dele a partir
/// da configuração (Admin:Usuario, Admin:SenhaInicial, Admin:NomeCompleto).
/// A senha inicial é temporária: precisa ser trocada no primeiro acesso.
/// </summary>
public static class InicializacaoAdministrador
{
    public static async Task GarantirAsync(IServiceProvider servicos)
    {
        using var escopo = servicos.CreateScope();
        var contexto = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
        var configuracao = escopo.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = escopo.ServiceProvider.GetRequiredService<ILoggerFactory>()
            .CreateLogger(typeof(InicializacaoAdministrador));

        if (await contexto.Usuarios.AnyAsync())
        {
            return;
        }

        var nomeUsuario = configuracao["Admin:Usuario"];
        var senhaInicial = configuracao["Admin:SenhaInicial"];
        var nomeCompleto = configuracao["Admin:NomeCompleto"];
        if (string.IsNullOrWhiteSpace(nomeUsuario)
            || string.IsNullOrWhiteSpace(senhaInicial)
            || string.IsNullOrWhiteSpace(nomeCompleto))
        {
            logger.LogWarning(
                "Nenhum usuário cadastrado e configuração Admin:Usuario, Admin:SenhaInicial e Admin:NomeCompleto ausente. " +
                "Ninguém conseguirá entrar no sistema até que ela seja definida.");
            return;
        }

        ValidacaoCredenciais.ValidarNomeUsuario(nomeUsuario);

        var colaborador = await contexto.Colaboradores.FirstOrDefaultAsync(c => c.Nome == nomeCompleto.Trim());
        if (colaborador is null)
        {
            colaborador = new Colaborador(nomeCompleto.Trim(), new List<Projeto>(), isCoordenador: true);
            contexto.Colaboradores.Add(colaborador);
        }
        else
        {
            colaborador.TornarCoordenador();
        }

        var hasher = escopo.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>();
        var usuario = new Usuario(nomeUsuario.Trim(), string.Empty, colaborador, isAdministrador: true);
        // A senha inicial pode ser curta (ex.: "admin" em desenvolvimento): é obrigatório trocá-la no primeiro acesso.
        usuario.RedefinirSenhaTemporaria(hasher.HashPassword(usuario, senhaInicial));
        contexto.Usuarios.Add(usuario);
        await contexto.SaveChangesAsync();

        logger.LogInformation("Administrador inicial \"{Usuario}\" criado. Troque a senha no primeiro acesso.", usuario.NomeUsuario);
    }
}
