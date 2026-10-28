using ConflitosAgendaApi.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ConflitosAgendaApi.Tests;

/// <summary>SQLite em memória com o mesmo modelo da API; vive enquanto a conexão estiver aberta.</summary>
public sealed class BancoEmMemoria : IDisposable
{
    private readonly SqliteConnection _conexao = new("DataSource=:memory:");

    public BancoEmMemoria()
    {
        _conexao.Open();
        Contexto = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>().UseSqlite(_conexao).Options);
        Contexto.Database.EnsureCreated();
    }

    public AppDbContext Contexto { get; }

    public void Dispose()
    {
        Contexto.Dispose();
        _conexao.Dispose();
    }
}
