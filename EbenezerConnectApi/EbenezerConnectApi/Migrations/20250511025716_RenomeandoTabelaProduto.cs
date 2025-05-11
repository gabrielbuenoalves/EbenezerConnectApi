using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EbenezerConnectApi.Migrations
{
    /// <inheritdoc />
    public partial class RenomeandoTabelaProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
               name: "Produto",
               columns: table => new
               {
                   Id = table.Column<int>(type: "int", nullable: false)
                       .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                   Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                       .Annotation("MySql:CharSet", "utf8mb4"),
                   QuantidadeEmEstoque = table.Column<int>(type: "int", nullable: false),
                   PrecoCompraAtual = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                   PrecoVendaAtual = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
               },
               constraints: table =>
               {
                   table.PrimaryKey("PK_Produto", x => x.Id);
               })
               .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.DropForeignKey(
                name: "FK_ItemTransacaoCantina_ProdutoEstoque_ProdutoEstoqueId",
                table: "ItemTransacaoCantina");

            migrationBuilder.DropForeignKey(
                name: "FK_PrecoHistoricoProduto_ProdutoEstoque_ProdutoEstoqueId",
                table: "PrecoHistoricoProduto");

            migrationBuilder.DropTable(
                name: "ProdutoEstoque");

            migrationBuilder.RenameColumn(
                name: "ProdutoEstoqueId",
                table: "PrecoHistoricoProduto",
                newName: "ProdutoId");

            migrationBuilder.RenameIndex(
                name: "IX_PrecoHistoricoProduto_ProdutoEstoqueId",
                table: "PrecoHistoricoProduto",
                newName: "IX_PrecoHistoricoProduto_ProdutoId");

            migrationBuilder.RenameColumn(
                name: "ProdutoEstoqueId",
                table: "ItemTransacaoCantina",
                newName: "ProdutoId");

            migrationBuilder.RenameIndex(
                name: "IX_ItemTransacaoCantina_ProdutoEstoqueId",
                table: "ItemTransacaoCantina",
                newName: "IX_ItemTransacaoCantina_ProdutoId");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemTransacaoCantina_Produto_ProdutoId",
                table: "ItemTransacaoCantina",
                column: "ProdutoId",
                principalTable: "Produto",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PrecoHistoricoProduto_Produto_ProdutoId",
                table: "PrecoHistoricoProduto",
                column: "ProdutoId",
                principalTable: "Produto",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ItemTransacaoCantina_Produto_ProdutoId",
                table: "ItemTransacaoCantina");

            migrationBuilder.DropForeignKey(
                name: "FK_PrecoHistoricoProduto_Produto_ProdutoId",
                table: "PrecoHistoricoProduto");

            migrationBuilder.DropTable(
                name: "Produto");

            migrationBuilder.RenameColumn(
                name: "ProdutoId",
                table: "PrecoHistoricoProduto",
                newName: "ProdutoEstoqueId");

            migrationBuilder.RenameIndex(
                name: "IX_PrecoHistoricoProduto_ProdutoId",
                table: "PrecoHistoricoProduto",
                newName: "IX_PrecoHistoricoProduto_ProdutoEstoqueId");

            migrationBuilder.RenameColumn(
                name: "ProdutoId",
                table: "ItemTransacaoCantina",
                newName: "ProdutoEstoqueId");

            migrationBuilder.RenameIndex(
                name: "IX_ItemTransacaoCantina_ProdutoId",
                table: "ItemTransacaoCantina",
                newName: "IX_ItemTransacaoCantina_ProdutoEstoqueId");

            migrationBuilder.CreateTable(
                name: "ProdutoEstoque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Nome = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PrecoCompraAtual = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrecoVendaAtual = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    QuantidadeEmEstoque = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProdutoEstoque", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddForeignKey(
                name: "FK_ItemTransacaoCantina_ProdutoEstoque_ProdutoEstoqueId",
                table: "ItemTransacaoCantina",
                column: "ProdutoEstoqueId",
                principalTable: "ProdutoEstoque",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PrecoHistoricoProduto_ProdutoEstoque_ProdutoEstoqueId",
                table: "PrecoHistoricoProduto",
                column: "ProdutoEstoqueId",
                principalTable: "ProdutoEstoque",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
