using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EbenezerConnectApi.Migrations
{
    /// <inheritdoc />
    public partial class EmailConfirmacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EmailConfirmacao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PessoaId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailConfirmacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailConfirmacao_Pessoa_PessoaId",
                        column: x => x.PessoaId,
                        principalTable: "Pessoa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmailConfirmacao_PessoaId",
                table: "EmailConfirmacao",
                column: "PessoaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EmailConfirmacao");
        }
    }
}
