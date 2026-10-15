import type { Colaborador, Periodo, Projeto, Solicitacao } from '@/domain/entities';
import type { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';

/**
 * Contrato de baixo nível que espelha 1:1 os endpoints da API (README.MD).
 * Existe uma implementação HTTP e outra mockada (localStorage). As regras de
 * negócio ficam acima, em `criarServicos`, e são as mesmas para as duas.
 */

export interface ColaboradorDto {
  nome: string;
  email: string;
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
  colaboradores: RecursoApi<Colaborador, ColaboradorDto> & {
    /** PUT /api/Colaborador/{id}/coordinator — a API exige nome e e-mail no corpo. */
    tornarCoordenador(id: number, dto: ColaboradorDto): Promise<Colaborador>;
  };
  periodos: RecursoApi<Periodo, PeriodoDto>;
  projetos: RecursoApi<Projeto, ProjetoDto>;
  solicitacoes: RecursoApi<Solicitacao, SolicitacaoDto> & {
    /** PUT /api/Solicitacao/{id}/validate — não altera o status. */
    validar(id: number): Promise<ResultadoValidacaoApi>;
  };
}
