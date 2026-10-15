using Microsoft.EntityFrameworkCore;
using ConflitosAgendaApi.Models;

namespace ConflitosAgendaApi.Data;
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Colaborador> Colaboradores { get; set; }
    public DbSet<Projeto> Projetos { get; set; }
    public DbSet<Solicitacao> Solicitacoes { get; set; }
    public DbSet<Periodo> Periodos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Projeto>()
            .HasMany(projeto => projeto.Colaboradores)
            .WithMany(colaborador => colaborador.Projetos)
            .UsingEntity("ProjetoColaborador");

        modelBuilder.Entity<Projeto>()
            .HasMany(projeto => projeto.PessoasCriticas)
            .WithMany()
            .UsingEntity("ProjetoPessoaCritica");

        // Colaborador e Coordenador apontam para a mesma tabela: em cascata, o SQL Server
        // acusa múltiplos caminhos de exclusão. Corresponde à migration ConfigureSolicitacaoDeleteBehavior.
        modelBuilder.Entity<Solicitacao>()
            .HasOne(solicitacao => solicitacao.Colaborador)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Solicitacao>()
            .HasOne(solicitacao => solicitacao.Coordenador)
            .WithMany()
            .OnDelete(DeleteBehavior.NoAction);
    }
}
