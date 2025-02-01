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
