import type { Colaborador, ContaUsuario, NivelAcesso, Periodo, Projeto, Solicitacao, UsuarioLogado } from '@/domain/entities';
import type { DataISO } from '@/lib/datas';

/**
 * Contratos consumidos pelas telas. As telas trabalham com IDs e `DataISO`;
 * a conversão para os objetos completos e `DateTime` da API acontece no serviço.
 */

export interface ColaboradorInput {
  nome: string;
}

export interface UsuarioInput {
  colaboradorId: number;
  nomeUsuario: string;
  senhaTemporaria: string;
  isAdministrador: boolean;
}

export interface ProjetoInput {
  nome: string;
  colaboradorIds: number[];
  /** Subconjunto de `colaboradorIds`. */
  pessoaCriticaIds: number[];
}

export interface PeriodoInput {
  idColaborador: number;
  dataInicio: DataISO;
  /** Dia de Retorno (exclusivo). */
  dataFim: DataISO;
}

/** Total de Dias, Pessoa Crítica, status e data de criação são derivados pelo serviço. */
export interface SolicitacaoInput {
  colaboradorId: number;
  coordenadorId: number;
  periodoIds: number[];
  abono: boolean;
  observacao: string;
}

export interface ResultadoValidacaoConflito {
  conflito: boolean;
  mensagem: string;
  solicitacao: Solicitacao;
}

export interface ColaboradorService {
  listar(): Promise<Colaborador[]>;
  buscarPorId(id: number): Promise<Colaborador | null>;
  criar(input: ColaboradorInput): Promise<Colaborador>;
  atualizar(id: number, input: ColaboradorInput): Promise<Colaborador>;
  excluir(id: number): Promise<void>;
  tornarCoordenador(id: number): Promise<Colaborador>;
}

export interface ProjetoService {
  listar(): Promise<Projeto[]>;
  buscarPorId(id: number): Promise<Projeto | null>;
  criar(input: ProjetoInput): Promise<Projeto>;
  atualizar(id: number, input: ProjetoInput): Promise<Projeto>;
  excluir(id: number): Promise<void>;
}

export interface PeriodoService {
  listar(): Promise<Periodo[]>;
  buscarPorId(id: number): Promise<Periodo | null>;
  criar(input: PeriodoInput): Promise<Periodo>;
  atualizar(id: number, input: PeriodoInput): Promise<Periodo>;
  excluir(id: number): Promise<void>;
}

export interface SolicitacaoService {
  listar(): Promise<Solicitacao[]>;
  buscarPorId(id: number): Promise<Solicitacao | null>;
  criar(input: SolicitacaoInput): Promise<Solicitacao>;
  /** Volta o status para Em análise. Bloqueado para Aprovada e Recusada. */
  atualizar(id: number, input: SolicitacaoInput): Promise<Solicitacao>;
  excluir(id: number): Promise<void>;
  /** Grava Conflito encontrado quando há conflito; volta para Em análise quando não há. */
  validarConflitos(id: number): Promise<ResultadoValidacaoConflito>;
  aprovar(id: number): Promise<Solicitacao>;
  recusar(id: number, observacao: string): Promise<Solicitacao>;
}

export interface AutenticacaoService {
  usuarioAtual(): Promise<UsuarioLogado | null>;
  entrar(nomeUsuario: string, senha: string): Promise<UsuarioLogado>;
  sair(): Promise<void>;
  trocarSenha(senhaAtual: string, novaSenha: string): Promise<UsuarioLogado>;
}

export interface UsuarioService {
  listar(): Promise<ContaUsuario[]>;
  criar(input: UsuarioInput): Promise<ContaUsuario>;
  definirAdministrador(id: number, isAdministrador: boolean): Promise<ContaUsuario>;
  redefinirSenha(id: number, senhaTemporaria: string): Promise<ContaUsuario>;
  desativar(id: number): Promise<ContaUsuario>;
  reativar(id: number): Promise<ContaUsuario>;
}

export interface CredencialDemonstracao {
  nomeUsuario: string;
  senha: string;
  nivel: NivelAcesso;
  nome: string;
}

/** Disponível apenas quando a fonte de dados é o mock. */
export interface DemonstracaoService {
  restaurarDados(): Promise<void>;
  /** Usuários fictícios mostrados na tela de login. */
  credenciais: CredencialDemonstracao[];
}

export interface Servicos {
  autenticacao: AutenticacaoService;
  usuarios: UsuarioService;
  colaboradores: ColaboradorService;
  projetos: ProjetoService;
  periodos: PeriodoService;
  solicitacoes: SolicitacaoService;
  demonstracao: DemonstracaoService | null;
}
