using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EbenezerConnectApi.Migrations
{
    /// <inheritdoc />
    public partial class CriarTabelaPessoa01 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Pessoas",
                table: "Pessoas");

            migrationBuilder.RenameTable(
                name: "Pessoas",
                newName: "Pessoa");

            migrationBuilder.RenameIndex(
                name: "IX_Pessoas_Cpf",
                table: "Pessoa",
                newName: "IX_Pessoa_Cpf");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Pessoa",
                table: "Pessoa",
                column: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_Pessoa",
                table: "Pessoa");

            migrationBuilder.RenameTable(
                name: "Pessoa",
                newName: "Pessoas");

            migrationBuilder.RenameIndex(
                name: "IX_Pessoa_Cpf",
                table: "Pessoas",
                newName: "IX_Pessoas_Cpf");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Pessoas",
                table: "Pessoas",
                column: "Id");
        }
    }
}
