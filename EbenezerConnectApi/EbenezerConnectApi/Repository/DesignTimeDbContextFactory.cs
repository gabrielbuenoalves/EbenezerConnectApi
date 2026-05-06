using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace EbenezerConnectApi.Repository
{
    public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            optionsBuilder.UseMySql(
                "server=localhost;port=3306;database=ebenezer_design;uid=root;pwd=design",
                ServerVersion.Parse("8.0.0-mysql"));

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
