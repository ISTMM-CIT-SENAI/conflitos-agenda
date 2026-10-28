using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Services.Acesso;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ConflitosAgendaApi.Data;

/// <summary>
/// Num banco sem colaboradores, cadastra o ISTMM a partir de <c>data/seed-istmm.json</c>
/// (gerado de funcionarios.xlsx e pontos focais.xlsx): pessoas, hierarquia, projetos e um
/// usuário por pessoa com senha temporária aleatória. As senhas vão uma única vez para um
/// CSV, que fica fora do git, para o Coordenador entregar individualmente.
/// </summary>
public static class CargaInicial
{
    public const string ArquivoCredenciais = "credenciais-iniciais.csv";
    private static readonly string[] Particulas = ["de", "da", "do", "das", "dos", "e"];
    // Sem caracteres ambíguos (0/O, 1/l/I) para a senha ser digitada sem erro.
    private const string AlfabetoSenha = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

    public sealed record Dados(string Coordenador, List<PessoaDados> Pessoas, List<ProjetoDados> Projetos);
    public sealed record PessoaDados(string Nome, string? RespondeA, bool Supervisor);
    public sealed record ProjetoDados(string Nome, List<string> PessoasCriticas);

    public static async Task GarantirAsync(IServiceProvider servicos)
    {
        using var escopo = servicos.CreateScope();
        var contexto = escopo.ServiceProvider.GetRequiredService<AppDbContext>();
        var ambiente = escopo.ServiceProvider.GetRequiredService<IHostEnvironment>();
        var logger = escopo.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger(typeof(CargaInicial));

        var csv = Path.Combine(ambiente.ContentRootPath, ArquivoCredenciais);
        var quantidade = await CarregarAsync(
            contexto,
            escopo.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>(),
            Path.Combine(AppContext.BaseDirectory, "data", "seed-istmm.json"),
            csv);
        if (quantidade > 0)
        {
            logger.LogWarning(
                "Carga inicial: {Quantidade} usuários criados. Senhas temporárias em {Arquivo}: entregue cada uma individualmente e apague o arquivo.",
                quantidade, csv);
        }
    }

    /// <summary>Devolve quantos usuários foram criados (0 se o banco já tinha colaboradores).</summary>
    public static async Task<int> CarregarAsync(
        AppDbContext contexto,
        IPasswordHasher<Usuario> hasher,
        string caminhoDados,
        string caminhoCredenciais)
    {
        if (await contexto.Colaboradores.AnyAsync())
        {
            return 0;
        }

        var dados = JsonSerializer.Deserialize<Dados>(
            await File.ReadAllTextAsync(caminhoDados),
            new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidOperationException($"{caminhoDados} está vazio.");

        var colaboradores = dados.Pessoas.ToDictionary(
            p => p.Nome,
            p => new Colaborador(p.Nome, new List<Projeto>(), p.Supervisor));
        Colaborador Buscar(string nome) => colaboradores.TryGetValue(nome, out var c)
            ? c
            : throw new InvalidOperationException($"\"{nome}\" não está na lista de pessoas.");

        foreach (var pessoa in dados.Pessoas.Where(p => p.RespondeA is not null))
        {
            Buscar(pessoa.Nome).DefinirRespondeA(Buscar(pessoa.RespondeA!));
        }
        contexto.Colaboradores.AddRange(colaboradores.Values);

        foreach (var projeto in dados.Projetos)
        {
            var criticos = projeto.PessoasCriticas.Select(Buscar).ToList();
            contexto.Projetos.Add(new Projeto(projeto.Nome, criticos, criticos.ToList()));
        }

        var nomesUsuario = GerarNomesUsuario(colaboradores.Keys);
        var linhas = new StringBuilder("Nome;Usuário;Senha temporária;Nível;Responde a\n");
        foreach (var pessoa in dados.Pessoas.OrderBy(p => p.Nome, StringComparer.Create(new CultureInfo("pt-BR"), true)))
        {
            var ehCoordenador = pessoa.Nome == dados.Coordenador;
            var senha = RandomNumberGenerator.GetString(AlfabetoSenha, 10);
            var usuario = new Usuario(nomesUsuario[pessoa.Nome], string.Empty, Buscar(pessoa.Nome), ehCoordenador);
            usuario.RedefinirSenhaTemporaria(hasher.HashPassword(usuario, senha));
            contexto.Usuarios.Add(usuario);

            var nivel = ehCoordenador ? "Coordenador" : pessoa.Supervisor ? "Supervisor" : "Colaborador";
            linhas.Append($"{pessoa.Nome};{usuario.NomeUsuario};{senha};{nivel};{pessoa.RespondeA}\n");
        }

        // CSV antes do banco: se a gravação do arquivo falhar, nada é salvo e a carga roda de novo.
        // BOM para o Excel abrir com acentos; ";" é o separador do Excel em português.
        await File.WriteAllTextAsync(caminhoCredenciais, linhas.ToString(), new UTF8Encoding(true));
        await contexto.SaveChangesAsync();
        return dados.Pessoas.Count;
    }

    /// <summary>
    /// primeironome.ultimosobrenome, minúsculo e sem acento. Quem coincidir nisso ganha o segundo
    /// nome (joao.pedro.silva e joao.paulo.silva). Se ainda assim coincidir, falha: resolva no JSON.
    /// </summary>
    public static Dictionary<string, string> GerarNomesUsuario(IEnumerable<string> nomes)
    {
        var palavras = nomes.Distinct().ToDictionary(
            nome => nome,
            nome => SemAcento(nome).ToLowerInvariant()
                .Split(' ', StringSplitOptions.RemoveEmptyEntries)
                .Where(p => !Particulas.Contains(p))
                .ToArray());

        string Curto(string[] p) => $"{p[0]}.{p[^1]}";
        var repetidos = palavras.Values.GroupBy(Curto).Where(g => g.Count() > 1).Select(g => g.Key).ToHashSet();

        var resultado = palavras.ToDictionary(
            par => par.Key,
            par => repetidos.Contains(Curto(par.Value)) && par.Value.Length > 2
                ? $"{par.Value[0]}.{par.Value[1]}.{par.Value[^1]}"
                : Curto(par.Value));

        var duplicado = resultado.GroupBy(par => par.Value).FirstOrDefault(g => g.Count() > 1);
        if (duplicado is not null)
        {
            throw new InvalidOperationException(
                $"Nome de usuário \"{duplicado.Key}\" repetido para: {string.Join(", ", duplicado.Select(p => p.Key))}.");
        }
        foreach (var nomeUsuario in resultado.Values)
        {
            ValidacaoCredenciais.ValidarNomeUsuario(nomeUsuario);
        }
        return resultado;
    }

    private static string SemAcento(string texto) =>
        new(texto.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray());
}
