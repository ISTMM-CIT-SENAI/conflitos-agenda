using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using ConflitosAgendaApi.Data;
using ConflitosAgendaApi.Repositories;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services;
using ConflitosAgendaApi.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IColaboradorRepository, ColaboradorRepository>();
builder.Services.AddScoped<IPeriodoRepository, PeriodoRepository>();
builder.Services.AddScoped<IProjetoRepository, ProjetoRepository>();
builder.Services.AddScoped<ISolicitacaoRepository, SolicitacaoRepository>();

builder.Services.AddScoped<IColaboradorService, ColaboradorService>();
builder.Services.AddScoped<IPeriodoService, PeriodoService>();
builder.Services.AddScoped<IProjetoService, ProjetoService>();
builder.Services.AddScoped<ISolicitacaoService, SolicitacaoService>();
builder.Services.AddScoped<IConflitoSolicitacaoService, ConflitoSolicitacaoService>();

var app = builder.Build();

// Cria o arquivo do banco e aplica migrations pendentes na inicialização:
// o deploy não precisa de nenhum passo manual de banco.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

// Regras de negócio violadas (ArgumentException) viram 400 e registros inexistentes
// (KeyNotFoundException) viram 404, sempre como ProblemDetails com a mensagem em `detail`.
app.UseExceptionHandler(erro => erro.Run(async context =>
{
    var excecao = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, titulo) = excecao switch
    {
        ArgumentException => (StatusCodes.Status400BadRequest, "Requisição inválida"),
        KeyNotFoundException => (StatusCodes.Status404NotFound, "Registro não encontrado"),
        // Ex.: excluir um colaborador que ainda tem solicitações (FK sem cascata).
        DbUpdateException => (StatusCodes.Status409Conflict, "Registro vinculado a outros dados"),
        _ => (StatusCodes.Status500InternalServerError, "Erro interno no servidor"),
    };
    var detalhe = status switch
    {
        StatusCodes.Status500InternalServerError => null,
        StatusCodes.Status409Conflict =>
            "Não foi possível concluir a operação: o registro está vinculado a outros dados, como solicitações.",
        _ => excecao?.Message,
    };
    await Results.Problem(detail: detalhe, statusCode: status, title: titulo).ExecuteAsync(context);
}));

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
