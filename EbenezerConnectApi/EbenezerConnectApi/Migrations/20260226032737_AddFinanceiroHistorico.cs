using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EbenezerConnectApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceiroHistorico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DataReversao",
                table: "TransacaoCantina",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Revertida",
                table: "TransacaoCantina",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AdicaoSaldo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PessoaId = table.Column<int>(type: "int", nullable: false),
                    Valor = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DataAdicao = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Revertida = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DataReversao = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdicaoSaldo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdicaoSaldo_Pessoa_PessoaId",
                        column: x => x.PessoaId,
                        principalTable: "Pessoa",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_AdicaoSaldo_PessoaId",
                table: "AdicaoSaldo",
                column: "PessoaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdicaoSaldo");

            migrationBuilder.DropColumn(
                name: "DataReversao",
                table: "TransacaoCantina");

            migrationBuilder.DropColumn(
                name: "Revertida",
                table: "TransacaoCantina");
        }
    }
}
