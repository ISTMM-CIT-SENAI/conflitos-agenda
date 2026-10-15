using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConflitosAgendaApi.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Colaboradores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    IsCoordenador = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Colaboradores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Projetos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Nome = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projetos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Solicitacoes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ColaboradorId = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    CriadaEm = table.Column<DateTimeOffset>(type: "TEXT", nullable: false),
                    CoordenadorId = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalDias = table.Column<int>(type: "INTEGER", nullable: false),
                    Observacao = table.Column<string>(type: "TEXT", nullable: true),
                    Abono = table.Column<bool>(type: "INTEGER", nullable: false),
                    isPessoaCritica = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Solicitacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Solicitacoes_Colaboradores_ColaboradorId",
                        column: x => x.ColaboradorId,
                        principalTable: "Colaboradores",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Solicitacoes_Colaboradores_CoordenadorId",
                        column: x => x.CoordenadorId,
                        principalTable: "Colaboradores",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ProjetoColaborador",
                columns: table => new
                {
                    ColaboradoresId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProjetosId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjetoColaborador", x => new { x.ColaboradoresId, x.ProjetosId });
                    table.ForeignKey(
                        name: "FK_ProjetoColaborador_Colaboradores_ColaboradoresId",
                        column: x => x.ColaboradoresId,
                        principalTable: "Colaboradores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjetoColaborador_Projetos_ProjetosId",
                        column: x => x.ProjetosId,
                        principalTable: "Projetos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjetoPessoaCritica",
                columns: table => new
                {
                    PessoasCriticasId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProjetoId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjetoPessoaCritica", x => new { x.PessoasCriticasId, x.ProjetoId });
                    table.ForeignKey(
                        name: "FK_ProjetoPessoaCritica_Colaboradores_PessoasCriticasId",
                        column: x => x.PessoasCriticasId,
                        principalTable: "Colaboradores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjetoPessoaCritica_Projetos_ProjetoId",
                        column: x => x.ProjetoId,
                        principalTable: "Projetos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Periodos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DataInicio = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DataFim = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IdColaborador = table.Column<int>(type: "INTEGER", nullable: false),
                    SolicitacaoId = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Periodos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Periodos_Solicitacoes_SolicitacaoId",
                        column: x => x.SolicitacaoId,
                        principalTable: "Solicitacoes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Periodos_SolicitacaoId",
                table: "Periodos",
                column: "SolicitacaoId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjetoColaborador_ProjetosId",
                table: "ProjetoColaborador",
                column: "ProjetosId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjetoPessoaCritica_ProjetoId",
                table: "ProjetoPessoaCritica",
                column: "ProjetoId");

            migrationBuilder.CreateIndex(
                name: "IX_Solicitacoes_ColaboradorId",
                table: "Solicitacoes",
                column: "ColaboradorId");

            migrationBuilder.CreateIndex(
                name: "IX_Solicitacoes_CoordenadorId",
                table: "Solicitacoes",
                column: "CoordenadorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Periodos");

            migrationBuilder.DropTable(
                name: "ProjetoColaborador");

            migrationBuilder.DropTable(
                name: "ProjetoPessoaCritica");

            migrationBuilder.DropTable(
                name: "Solicitacoes");

            migrationBuilder.DropTable(
                name: "Projetos");

            migrationBuilder.DropTable(
                name: "Colaboradores");
        }
    }
}
