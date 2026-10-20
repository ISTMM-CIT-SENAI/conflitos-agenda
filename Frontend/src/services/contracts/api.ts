import type { Colaborador, ContaUsuario, Periodo, Projeto, Solicitacao, UsuarioLogado } from '@/domain/entities';
import type { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';

/**
 * Contrato de baixo nível que espelha 1:1 os endpoints da API (README.MD).
 * Existe uma implementação HTTP e outra mockada (localStorage). As regras de
 * negócio ficam acima, em `criarServicos`, e são as mesmas para as duas.
 */

export interface ColaboradorDto {
  nome: string;
}

export interface UsuarioDto {
  colaboradorId: number;
  nomeUsuario: string;
  senhaTemporaria: string;
  isAdministrador: boolean;
}

export interface PeriodoDto {
  dataInicio: string;
  dataFim: string;
  idColaborador: number;
}

export interface ProjetoDto {
  nome: string;
  pessoasCriticas: Colaborador[];
  colaboradores: Colaborador[];
}

export interface SolicitacaoDto {
  colaborador: Colaborador;
  periodos: Periodo[];
  status: StatusSolicitacao;
  criadaEm: string;
  coordenador: Colaborador;
  observacao: string | null;
  totalDias: number;
  abono: boolean;
  isPessoaCritica: boolean;
}

export type ResultadoValidacaoApi = { semConflito: true } | { semConflito: false; mensagem: string };

export interface RecursoApi<TEntidade, TDto> {
  listar(): Promise<TEntidade[]>;
  /** `null` quando a API responde 404. */
  buscar(id: number): Promise<TEntidade | null>;
  criar(dto: TDto): Promise<TEntidade>;
  atualizar(id: number, dto: TDto): Promise<TEntidade>;
  excluir(id: number): Promise<void>;
}

export interface ApiGateway {
  /** Sessão em cookie HttpOnly emitido pela API. */
  autenticacao: {
    /** `null` quando não há sessão (HTTP 401). */
    eu(): Promise<UsuarioLogado | null>;
    entrar(nomeUsuario: string, senha: string): Promise<UsuarioLogado>;
    sair(): Promise<void>;
    trocarSenha(senhaAtual: string, novaSenha: string): Promise<UsuarioLogado>;
  };
  /** Contas de acesso; exclusivo do Administrador. */
  usuarios: {
    listar(): Promise<ContaUsuario[]>;
    criar(dto: UsuarioDto): Promise<ContaUsuario>;
    definirAdministrador(id: number, isAdministrador: boolean): Promise<ContaUsuario>;
    redefinirSenha(id: number, senhaTemporaria: string): Promise<ContaUsuario>;
    desativar(id: number): Promise<ContaUsuario>;
    reativar(id: number): Promise<ContaUsuario>;
  };
  colaboradores: RecursoApi<Colaborador, ColaboradorDto> & {
    /** PUT /api/Colaborador/{id}/coordinator — a API exige o nome no corpo. */
    tornarCoordenador(id: number, dto: ColaboradorDto): Promise<Colaborador>;
  };
  periodos: RecursoApi<Periodo, PeriodoDto>;
  projetos: RecursoApi<Projeto, ProjetoDto>;
  solicitacoes: RecursoApi<Solicitacao, SolicitacaoDto> & {
    /** PUT /api/Solicitacao/{id}/validate — não altera o status. */
    validar(id: number): Promise<ResultadoValidacaoApi>;
  };
}
