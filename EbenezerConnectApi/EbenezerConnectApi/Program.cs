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
using Microsoft.AspNetCore.HttpOverrides;

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

// CORS: aceita formato string (a;b;c) e array (Cors__AllowedOrigins__0, __1...)
var allowedOriginsFromString = builder.Configuration["Cors:AllowedOrigins"];
var allowedOriginsFromArray = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>();

var allowedOrigins = (allowedOriginsFromArray ?? Array.Empty<string>())
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin.Trim())
    .ToArray();

if (allowedOrigins.Length == 0 && !string.IsNullOrWhiteSpace(allowedOriginsFromString))
{
    allowedOrigins = allowedOriginsFromString
        .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

if (allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:4200", "http://localhost:3000" };
}
builder.Services.AddCors(options =>
{
    options.AddPolicy("RestrictedCors", policy =>
    {
        policy.WithOrigins(allowedOrigins)
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
builder.Services.AddScoped<IImportacaoService, ImportacaoService>();


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
var enableHttpsRedirection = builder.Configuration.GetValue<bool>("AppSettings:EnableHttpsRedirection", !app.Environment.IsProduction());

// 🌱 Seed: Cria usuário admin inicial se não existir (controlado por variável de ambiente)
var seedAdminEnabled = builder.Configuration.GetValue<bool>("SeedAdmin:Enabled", false);
if (seedAdminEnabled)
{
    using (var scope = app.Services.CreateScope())
    {
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var pessoaRepo = scope.ServiceProvider.GetRequiredService<IPessoaRepository>();
        
        var seedEmail = builder.Configuration["SeedAdmin:Email"] ?? "admin@example.com";
        var seedAdminExistente = pessoaRepo.BuscarPorEmail(seedEmail).Result;
        
        if (seedAdminExistente == null)
        {
            var adminInicial = new Pessoa
            {
                Nome = builder.Configuration["SeedAdmin:Name"] ?? "Admin",
                Email = seedEmail,
                Cpf = builder.Configuration["SeedAdmin:Cpf"] ?? "00000000000",
                Funcao = "admin",
                SenhaHash = BCrypt.Net.BCrypt.HashPassword(builder.Configuration["SeedAdmin:Password"] ?? "admin123"),
                EmailConfirmado = true,
                Saldo = 0
            };
            
            pessoaRepo.AdicionarPessoa(adminInicial).Wait();
            Console.WriteLine("✅ Usuário admin inicial criado com sucesso!");
            Console.WriteLine($"   Email: {adminInicial.Email}");
        }
        else
        {
            Console.WriteLine($"ℹ️  Admin já existente: {seedEmail}");
        }
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

// Swagger apenas em Development (desabilitar em Prod por segurança)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseCors("RestrictedCors");
if (enableHttpsRedirection)
{
    app.UseHttpsRedirection();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
