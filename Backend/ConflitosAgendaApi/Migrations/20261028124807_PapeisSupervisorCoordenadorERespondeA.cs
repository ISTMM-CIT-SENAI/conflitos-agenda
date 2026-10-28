using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConflitosAgendaApi.Migrations
{
    /// <inheritdoc />
    public partial class PapeisSupervisorCoordenadorERespondeA : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Solicitacoes_Colaboradores_CoordenadorId",
                table: "Solicitacoes");

            migrationBuilder.RenameColumn(
                name: "IsAdministrador",
                table: "Usuarios",
                newName: "IsCoordenador");

            migrationBuilder.RenameColumn(
                name: "CoordenadorId",
                table: "Solicitacoes",
                newName: "SupervisorId");

            migrationBuilder.RenameIndex(
                name: "IX_Solicitacoes_CoordenadorId",
                table: "Solicitacoes",
                newName: "IX_Solicitacoes_SupervisorId");

            migrationBuilder.RenameColumn(
                name: "IsCoordenador",
                table: "Colaboradores",
                newName: "IsSupervisor");

            migrationBuilder.AddColumn<int>(
                name: "RespondeAId",
                table: "Colaboradores",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Colaboradores_RespondeAId",
                table: "Colaboradores",
                column: "RespondeAId");

            migrationBuilder.AddForeignKey(
                name: "FK_Colaboradores_Colaboradores_RespondeAId",
                table: "Colaboradores",
                column: "RespondeAId",
                principalTable: "Colaboradores",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitacoes_Colaboradores_SupervisorId",
                table: "Solicitacoes",
                column: "SupervisorId",
                principalTable: "Colaboradores",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Colaboradores_Colaboradores_RespondeAId",
                table: "Colaboradores");

            migrationBuilder.DropForeignKey(
                name: "FK_Solicitacoes_Colaboradores_SupervisorId",
                table: "Solicitacoes");

            migrationBuilder.DropIndex(
                name: "IX_Colaboradores_RespondeAId",
                table: "Colaboradores");

            migrationBuilder.DropColumn(
                name: "RespondeAId",
                table: "Colaboradores");

            migrationBuilder.RenameColumn(
                name: "IsCoordenador",
                table: "Usuarios",
                newName: "IsAdministrador");

            migrationBuilder.RenameColumn(
                name: "SupervisorId",
                table: "Solicitacoes",
                newName: "CoordenadorId");

            migrationBuilder.RenameIndex(
                name: "IX_Solicitacoes_SupervisorId",
                table: "Solicitacoes",
                newName: "IX_Solicitacoes_CoordenadorId");

            migrationBuilder.RenameColumn(
                name: "IsSupervisor",
                table: "Colaboradores",
                newName: "IsCoordenador");

            migrationBuilder.AddForeignKey(
                name: "FK_Solicitacoes_Colaboradores_CoordenadorId",
                table: "Solicitacoes",
                column: "CoordenadorId",
                principalTable: "Colaboradores",
                principalColumn: "Id");
        }
    }
}
