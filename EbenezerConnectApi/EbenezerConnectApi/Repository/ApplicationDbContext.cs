using EbenezerConnectApi.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace EbenezerConnectApi.Repository
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }
        public DbSet<Pessoa> Pessoa { get; set; } // Tabela Pessoas
        public DbSet<TransacaoCantina> TransacaoCantina { get; set; }
        public DbSet<EmailConfirmacao> EmailConfirmacao { get; set; }
        public DbSet<Quarto> Quarto { get; set; }
        public DbSet<ProdutoEstoque> ProdutoEstoque { get; set; }
        public DbSet<PrecoHistoricoProduto> PrecoHistoricoProduto { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configuração adicional para garantir que o CPF seja único
            modelBuilder.Entity<Pessoa>()
                .HasIndex(p => p.Cpf)
                .IsUnique();
        }
    }
}
