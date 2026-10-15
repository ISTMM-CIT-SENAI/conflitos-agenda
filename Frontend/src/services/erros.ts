export interface Violacao {
  /** Nome do campo do formulário, quando o erro pertence a um campo específico. */
  campo?: string;
  mensagem: string;
}

export class ErroServico extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroServico';
  }
}

/** Regra de negócio violada (HTTP 400). */
export class ErroRegraNegocio extends ErroServico {
  readonly violacoes: Violacao[];

  constructor(mensagem: string, violacoes: Violacao[] = []) {
    super(mensagem);
    this.name = 'ErroRegraNegocio';
    this.violacoes = violacoes;
  }

  static deViolacoes(violacoes: Violacao[]): ErroRegraNegocio {
    return new ErroRegraNegocio(violacoes.map((v) => v.mensagem).join(' '), violacoes);
  }
}

/** Recurso inexistente (HTTP 404). */
export class ErroNaoEncontrado extends ErroServico {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'ErroNaoEncontrado';
  }
}

/** Falha de comunicação com a API. */
export class ErroRede extends ErroServico {
  constructor(mensagem = 'Não foi possível se comunicar com o servidor. Verifique sua conexão.') {
    super(mensagem);
    this.name = 'ErroRede';
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroServico) return erro.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
