using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ConflitosAgendaApi.Data;
using ConflitosAgendaApi.Models;
using ConflitosAgendaApi.Repositories;
using ConflitosAgendaApi.Repositories.Interfaces;
using ConflitosAgendaApi.Services;
using ConflitosAgendaApi.Services.Acesso;
using ConflitosAgendaApi.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IColaboradorRepository, ColaboradorRepository>();
builder.Services.AddScoped<IPeriodoRepository, PeriodoRepository>();
builder.Services.AddScoped<IProjetoRepository, ProjetoRepository>();
builder.Services.AddScoped<ISolicitacaoRepository, SolicitacaoRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();

builder.Services.AddScoped<IColaboradorService, ColaboradorService>();
builder.Services.AddScoped<IPeriodoService, PeriodoService>();
builder.Services.AddScoped<IProjetoService, ProjetoService>();
builder.Services.AddScoped<ISolicitacaoService, SolicitacaoService>();
builder.Services.AddScoped<IConflitoSolicitacaoService, ConflitoSolicitacaoService>();

// --- Autenticação: login com usuário e senha, sessão em cookie HttpOnly ---
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();
builder.Services.AddScoped<IUsuarioAtualAccessor, UsuarioAtualAccessor>();
builder.Services.AddScoped<IAutenticacaoService, AutenticacaoService>();
builder.Services.AddScoped<IUsuarioService, UsuarioService>();
builder.Services.AddScoped<IVisibilidadeService, VisibilidadeService>();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(opcoes =>
    {
        opcoes.Cookie.Name = SessaoCookie.NomeCookie;
        opcoes.Cookie.HttpOnly = true;
        opcoes.Cookie.SameSite = SameSiteMode.Strict;
        opcoes.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        // Expira após 8 horas sem uso.
        opcoes.ExpireTimeSpan = TimeSpan.FromHours(8);
        opcoes.SlidingExpiration = true;
        opcoes.Events.OnValidatePrincipal = SessaoCookie.ValidarAsync;
        // É uma API: responde 401/403 em vez de redirecionar para uma página de login.
        opcoes.Events.OnRedirectToLogin = contexto =>
        {
            contexto.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        opcoes.Events.OnRedirectToAccessDenied = contexto =>
        {
            contexto.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorizationBuilder()
    // Toda rota exige login, salvo as marcadas com [AllowAnonymous].
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build())
    .AddPolicy(SessaoCookie.PoliticaAdministrador, politica => politica.RequireRole(SessaoCookie.PapelAdministrador));

var app = builder.Build();

// Cria o arquivo do banco e aplica migrations pendentes na inicialização:
// o deploy não precisa de nenhum passo manual de banco.
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}
await InicializacaoAdministrador.GarantirAsync(app.Services);

// Regras de negócio violadas (ArgumentException) viram 400 e registros inexistentes
// (KeyNotFoundException) viram 404, sempre como ProblemDetails com a mensagem em `detail`.
app.UseExceptionHandler(erro => erro.Run(async context =>
{
    var excecao = context.Features.Get<IExceptionHandlerFeature>()?.Error;
    var (status, titulo) = excecao switch
    {
        ArgumentException => (StatusCodes.Status400BadRequest, "Requisição inválida"),
        KeyNotFoundException => (StatusCodes.Status404NotFound, "Registro não encontrado"),
        UnauthorizedAccessException => (StatusCodes.Status401Unauthorized, "Sessão inválida"),
        AcessoNegadoException => (StatusCodes.Status403Forbidden, "Acesso negado"),
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
app.UseAuthentication();

// Enquanto a senha for temporária (primeiro acesso ou redefinida pelo Administrador),
// só as rotas de /api/Auth respondem: o restante exige a troca de senha.
app.Use(async (contexto, proximo) =>
{
    if (contexto.User.Identity?.IsAuthenticated == true
        && !contexto.Request.Path.StartsWithSegments("/api/Auth"))
    {
        var usuario = await contexto.RequestServices.GetRequiredService<IUsuarioAtualAccessor>().ObterAsync();
        if (usuario.PrecisaTrocarSenha)
        {
            await Results.Problem(
                type: "troca-de-senha-obrigatoria",
                title: "Troca de senha obrigatória",
                detail: "Defina uma nova senha para continuar.",
                statusCode: StatusCodes.Status403Forbidden).ExecuteAsync(contexto);
            return;
        }
    }
    await proximo();
});

app.UseAuthorization();
app.MapControllers();

app.Run();
