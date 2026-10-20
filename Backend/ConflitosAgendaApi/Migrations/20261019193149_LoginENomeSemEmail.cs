using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConflitosAgendaApi.Migrations
{
    /// <inheritdoc />
    public partial class LoginENomeSemEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "Colaboradores");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "DecididaEm",
                table: "Solicitacoes",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DecididaPorId",
                table: "Solicitacoes",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Nome",
                table: "Colaboradores",
                type: "TEXT",
                nullable: false,
                collation: "NOCASE",
                oldClrType: typeof(string),
                oldType: "TEXT");

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NomeUsuario = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    NomeUsuarioNormalizado = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    SenhaHash = table.Column<string>(type: "TEXT", nullable: false),
                    IsAdministrador = table.Column<bool>(type: "INTEGER", nullable: false),
                    Ativo = table.Column<bool>(type: "INTEGER", nullable: false),
                    PrecisaTrocarSenha = table.Column<bool>(type: "INTEGER", nullable: false),
                    TentativasFalhas = table.Column<int>(type: "INTEGER", nullable: false),
                    BloqueadoAteUtc = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CarimboSeguranca = table.Column<string>(type: "TEXT", nullable: false),
                    ColaboradorId = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuarios_Colaboradores_ColaboradorId",
                        column: x => x.ColaboradorId,
                        principalTable: "Colaboradores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Solicitacoes_DecididaPorId",
                table: "Solicitacoes",
                column: "DecididaPorId");

            migrationBuilder.CreateIndex(
                name: "IX_Colaboradores_Nome",
                table: "Colaboradores",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_ColaboradorId",
                table: "Usuarios",
                column: "ColaboradorId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_NomeUsuarioNormalizado",
                table: "Usuarios",
                column: "NomeUsuarioNormalizado",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitacoes_Usuarios_DecididaPorId",
                table: "Solicitacoes",
                column: "DecididaPorId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Solicitacoes_Usuarios_DecididaPorId",
                table: "Solicitacoes");

            migrationBuilder.DropTable(
                name: "Usuarios");

            migrationBuilder.DropIndex(
                name: "IX_Solicitacoes_DecididaPorId",
                table: "Solicitacoes");

            migrationBuilder.DropIndex(
                name: "IX_Colaboradores_Nome",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "DecididaEm",
                table: "Solicitacoes");

            migrationBuilder.DropColumn(
                name: "DecididaPorId",
                table: "Solicitacoes");

            migrationBuilder.AlterColumn<string>(
                name: "Nome",
                table: "Colaboradores",
                type: "TEXT",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldCollation: "NOCASE");

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Colaboradores",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }
    }
}
