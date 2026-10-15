import type { Colaborador, Periodo, Projeto, Solicitacao } from '@/domain/entities';
import type { ApiGateway, ColaboradorDto, PeriodoDto, ProjetoDto, RecursoApi, SolicitacaoDto } from '../contracts/api';
import { ErroNaoEncontrado, ErroRede, ErroRegraNegocio, ErroServico } from '../erros';

type Metodo = 'GET' | 'POST' | 'PUT' | 'DELETE';

class ErroHttp extends ErroServico {
  readonly status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ErroHttp';
    this.status = status;
  }
}

/** Extrai uma mensagem legível de respostas em texto puro ou ProblemDetails do ASP.NET. */
function extrairMensagem(corpo: unknown, padrao: string): string {
  if (typeof corpo === 'string' && corpo.trim() !== '') return corpo;
  if (typeof corpo === 'object' && corpo !== null) {
    const problema = corpo as { title?: unknown; detail?: unknown; errors?: unknown };
    if (typeof problema.errors === 'object' && problema.errors !== null) {
      const mensagens = Object.values(problema.errors as Record<string, unknown>)
        .flat()
        .filter((m): m is string => typeof m === 'string');
      if (mensagens.length > 0) return mensagens.join(' ');
    }
    if (typeof problema.detail === 'string') return problema.detail;
    if (typeof problema.title === 'string') return problema.title;
  }
  return padrao;
}

async function lerCorpo(resposta: Response): Promise<unknown> {
  const texto = await resposta.text();
  if (texto === '') return undefined;
  try {
    return JSON.parse(texto);
  } catch {
    return texto;
  }
}

export function criarGatewayHttp(baseUrl: string): ApiGateway {
  const base = baseUrl.replace(/\/+$/, '');

  async function requisitar<T>(metodo: Metodo, caminho: string, corpo?: unknown): Promise<T> {
    let resposta: Response;
    try {
      resposta = await fetch(`${base}${caminho}`, {
        method: metodo,
        headers: corpo === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: corpo === undefined ? undefined : JSON.stringify(corpo),
      });
    } catch {
      throw new ErroRede();
    }

    const conteudo = await lerCorpo(resposta);
    if (resposta.ok) return conteudo as T;

    if (resposta.status === 404) throw new ErroNaoEncontrado(extrairMensagem(conteudo, 'Registro não encontrado.'));
    if (resposta.status === 400) throw new ErroRegraNegocio(extrairMensagem(conteudo, 'Dados inválidos.'));
    throw new ErroHttp(resposta.status, extrairMensagem(conteudo, `Erro no servidor (HTTP ${resposta.status}).`));
  }

  function recurso<TEntidade, TDto>(caminho: string): RecursoApi<TEntidade, TDto> {
    return {
      listar: () => requisitar<TEntidade[]>('GET', caminho),
      async buscar(id) {
        try {
          return await requisitar<TEntidade>('GET', `${caminho}/${id}`);
        } catch (erro) {
          if (erro instanceof ErroNaoEncontrado) return null;
          throw erro;
        }
      },
      criar: (dto) => requisitar<TEntidade>('POST', caminho, dto),
      atualizar: (id, dto) => requisitar<TEntidade>('PUT', `${caminho}/${id}`, dto),
      excluir: (id) => requisitar<void>('DELETE', `${caminho}/${id}`),
    };
  }

  return {
    colaboradores: {
      ...recurso<Colaborador, ColaboradorDto>('/api/Colaborador'),
      tornarCoordenador: (id, dto) => requisitar<Colaborador>('PUT', `/api/Colaborador/${id}/coordinator`, dto),
    },
    periodos: recurso<Periodo, PeriodoDto>('/api/Periodo'),
    projetos: recurso<Projeto, ProjetoDto>('/api/Projeto'),
    solicitacoes: {
      ...recurso<Solicitacao, SolicitacaoDto>('/api/Solicitacao'),
      async validar(id) {
        // A API responde 200 quando não há conflito e 400 com a mensagem quando há.
        try {
          await requisitar<boolean>('PUT', `/api/Solicitacao/${id}/validate`);
          return { semConflito: true };
        } catch (erro) {
          if (erro instanceof ErroRegraNegocio) return { semConflito: false, mensagem: erro.message };
          throw erro;
        }
      },
    },
  };
}
