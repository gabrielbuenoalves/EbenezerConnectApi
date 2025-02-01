using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EbenezerConnectApi.Migrations
{
    /// <inheritdoc />
    public partial class CriandoBaseDeDados : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Pessoa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Funcao = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Nome = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Cpf = table.Column<string>(type: "varchar(11)", maxLength: 11, nullable: false),
                    Quarto = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Igreja = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Saldo = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pessoa", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TransacaoCantina",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PessoaId = table.Column<int>(type: "int", nullable: false),
                    DataTransacao = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Valor = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Descricao = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransacaoCantina", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransacaoCantina_Pessoa_PessoaId",
                        column: x => x.PessoaId,
                        principalTable: "Pessoa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Pessoa_Cpf",
                table: "Pessoa",
                column: "Cpf",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransacaoCantina_PessoaId",
                table: "TransacaoCantina",
                column: "PessoaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransacaoCantina");

            migrationBuilder.DropTable(
                name: "Pessoa");
        }
    }
}
