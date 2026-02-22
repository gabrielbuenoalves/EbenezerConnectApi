using EbenezerConnectApi.Repository;
using EbenezerConnectApi.Repository.Interfaces;
using EbenezerConnectApi.Services.Interfaces;
using EbenezerConnectApi.Services;
using Microsoft.EntityFrameworkCore;
using AutoMapper;
using EbenezerConnectApi.Models.Mappings;
using EbenezerConnectApi.Models.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Mvc.Authorization;
using BCrypt.Net;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    EnvironmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
});

builder.Services.AddControllers()
    .AddJsonOptions(x =>
        x.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

builder.Logging.AddConsole();

// 🔁 Carrega config com suporte a múltiplos appsettings
builder.Configuration
    .SetBasePath(Directory.GetCurrentDirectory())
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Swagger com suporte a JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "EbenezerConnectApi", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Insira: Bearer {seu token JWT}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers();

builder.Services.AddAutoMapper(typeof(MappingProfile));

// Repositórios e Serviços
builder.Services.AddScoped<IPessoaRepository, PessoaRepository>();
builder.Services.AddScoped<IEmailConfirmacaoRepository, EmailConfirmacaoRepository>();
builder.Services.AddScoped<ITransacaoCantinaRepository, TransacaoCantinaRepository>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IPessoaService, PessoaService>();
builder.Services.AddScoped<ITransacaoCantinaService, TransacaoCantinaService>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddScoped<IProdutoService, ProdutoService>();
builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();


// Banco de dados
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));
// JWT Auth
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

// 🌱 Seeding de dados
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    
    // Verificar se já existe um usuário admin
    var adminExists = context.Pessoa.Any(p => p.Email == "admin@example.com");
    
    if (!adminExists)
    {
        // Criar usuário admin
        var adminSenha = BCrypt.Net.BCrypt.HashPassword("password123");
        var admin = new Pessoa
        {
            Nome = "Administrador",
            Email = "admin@example.com",
            Cpf = "12345678901",
            Funcao = "admin",
            SenhaHash = adminSenha,
            EmailConfirmado = true,
            Saldo = 1000
        };
        
        // Criar acampantes de teste
        var acampante1 = new Pessoa
        {
            Nome = "João Silva",
            Email = "joao@example.com",
            Cpf = "12345678902",
            Funcao = "acampante",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            EmailConfirmado = true,
            Saldo = 100
        };
        
        var acampante2 = new Pessoa
        {
            Nome = "Maria Santos",
            Email = "maria@example.com",
            Cpf = "12345678903",
            Funcao = "acampante",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            EmailConfirmado = true,
            Saldo = 150
        };
        
        // Criar conselheiro
        var conselheiro = new Pessoa
        {
            Nome = "Pedro Costa",
            Email = "pedro@example.com",
            Cpf = "12345678904",
            Funcao = "conselheiro",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            EmailConfirmado = true,
            Saldo = 500
        };
        
        context.Pessoa.AddRange(admin, acampante1, acampante2, conselheiro);
        context.SaveChanges();
        
        // Criar produtos
        var produto1 = new Produto
        {
            Nome = "Refrigerante",
            QuantidadeEmEstoque = 50,
            PrecoCompraAtual = 2.00m,
            PrecoVendaAtual = 5.00m
        };
        
        var produto2 = new Produto
        {
            Nome = "Sanduíche",
            QuantidadeEmEstoque = 3,
            PrecoCompraAtual = 7.00m,
            PrecoVendaAtual = 15.00m
        };
        
        var produto3 = new Produto
        {
            Nome = "Doce",
            QuantidadeEmEstoque = 20,
            PrecoCompraAtual = 1.50m,
            PrecoVendaAtual = 3.50m
        };
        
        context.Produto.AddRange(produto1, produto2, produto3);
        context.SaveChanges();
        
        Console.WriteLine("✅ Dados de teste criados com sucesso!");
        Console.WriteLine("🔐 Login: admin@example.com / password123");
    }
}


// Middleware global para capturar erros não tratados
app.Use(async (context, next) =>
{
    try
    {
        await next.Invoke();
    }
    catch (Exception ex)
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erro não tratado");

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"erro\": \"Erro interno no servidor\"}");
    }
});

// Swagger em ambientes DEV ou PROD
if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
