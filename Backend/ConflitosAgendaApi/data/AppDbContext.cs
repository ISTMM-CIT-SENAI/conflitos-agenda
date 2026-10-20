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
    public DbSet<Usuario> Usuarios { get; set; }

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

        modelBuilder.Entity<Solicitacao>()
            .HasOne(solicitacao => solicitacao.DecididaPor)
            .WithMany()
            .HasForeignKey(solicitacao => solicitacao.DecididaPorId)
            .OnDelete(DeleteBehavior.NoAction);
        modelBuilder.Entity<Solicitacao>().Ignore(solicitacao => solicitacao.EstaDecidida);

        // Nome completo é o único identificador do Colaborador: único, sem diferenciar maiúsculas.
        modelBuilder.Entity<Colaborador>()
            .Property(colaborador => colaborador.Nome)
            .UseCollation("NOCASE");
        modelBuilder.Entity<Colaborador>()
            .HasIndex(colaborador => colaborador.Nome)
            .IsUnique();

        modelBuilder.Entity<Usuario>(usuario =>
        {
            usuario.HasIndex(u => u.NomeUsuarioNormalizado).IsUnique();
            // Cada Colaborador tem no máximo um Usuário.
            usuario.HasIndex(u => u.ColaboradorId).IsUnique();
            usuario.HasOne(u => u.Colaborador)
                .WithMany()
                .HasForeignKey(u => u.ColaboradorId)
                .OnDelete(DeleteBehavior.Restrict);
            usuario.Property(u => u.NomeUsuario).HasMaxLength(30);
            usuario.Property(u => u.NomeUsuarioNormalizado).HasMaxLength(30);
        });
    }
}
