import type { Colaborador, Periodo, Projeto, Solicitacao } from '@/domain/entities';
import { isStatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { detectarConflitos, mensagemDeConflito } from '@/domain/validation/conflito';
import { intervaloDoPeriodo, validarIntervalo } from '@/domain/validation/periodo';
import { validarRegrasSolicitacao } from '@/domain/validation/solicitacao';
import type { ApiGateway, ColaboradorDto, PeriodoDto } from '../contracts/api';
import { ErroNaoEncontrado, ErroRegraNegocio } from '../erros';
import {
  VERSAO_BANCO,
  proximoId,
  type Armazenamento,
  type BancoMock,
  type ColaboradorRegistro,
  type ProjetoRegistro,
  type SolicitacaoRegistro,
} from './banco';
import { criarDadosDemonstracao } from './dadosDemonstracao';

export const CHAVE_ARMAZENAMENTO = 'conflitos-agenda:banco-mock';

const PADRAO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface OpcoesGatewayMock {
  armazenamento: Armazenamento;
  /** Latência simulada por operação, para exercitar os estados de carregamento. */
  latenciaMs?: number;
  criarDadosIniciais?: () => BancoMock;
}

export interface GatewayMock extends ApiGateway {
  restaurarDadosDemonstracao(): Promise<void>;
}

function isBancoValido(valor: unknown): valor is BancoMock {
  if (typeof valor !== 'object' || valor === null) return false;
  const banco = valor as Partial<BancoMock>;
  return (
    banco.versao === VERSAO_BANCO &&
    Array.isArray(banco.colaboradores) &&
    Array.isArray(banco.periodos) &&
    Array.isArray(banco.projetos) &&
    Array.isArray(banco.solicitacoes)
  );
}

/**
 * Implementação do `ApiGateway` persistida em `localStorage`. Reproduz as
 * respostas e validações da API (400/404) para que as telas se comportem
 * igual quando a fonte de dados for trocada.
 */
export function criarGatewayMock({
  armazenamento,
  latenciaMs = 0,
  criarDadosIniciais = criarDadosDemonstracao,
}: OpcoesGatewayMock): GatewayMock {
  function ler(): BancoMock {
    const bruto = armazenamento.getItem(CHAVE_ARMAZENAMENTO);
    if (bruto !== null) {
      try {
        const banco: unknown = JSON.parse(bruto);
        if (isBancoValido(banco)) return banco;
      } catch {
        // Conteúdo corrompido: recomeça com a massa de demonstração.
      }
    }
    const inicial = criarDadosIniciais();
    gravar(inicial);
    return inicial;
  }

  function gravar(banco: BancoMock): void {
    armazenamento.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(banco));
  }

  /** Executa uma operação após a latência simulada; o retorno é sempre uma cópia. */
  async function operar<T>(operacao: (banco: BancoMock) => T): Promise<T> {
    if (latenciaMs > 0) await new Promise((resolve) => setTimeout(resolve, latenciaMs));
    const resultado = operacao(ler());
    return resultado === undefined ? resultado : structuredClone(resultado);
  }

  async function mutar<T>(operacao: (banco: BancoMock) => T): Promise<T> {
    return operar((banco) => {
      const resultado = operacao(banco);
      gravar(banco);
      return resultado;
    });
  }

  function encontrar<T extends { id: number }>(lista: T[], id: number, mensagem: string): T {
    const item = lista.find((x) => x.id === id);
    if (!item) throw new ErroNaoEncontrado(mensagem);
    return item;
  }

  // --- Montagem dos objetos completos, como a API devolve ---

  function colaborador(banco: BancoMock, id: number): Colaborador {
    const registro = banco.colaboradores.find((c) => c.id === id);
    return registro ? { ...registro } : { id, nome: `Colaborador #${id} (excluído)`, email: '', isCoordenador: false };
  }

  function projeto(banco: BancoMock, registro: ProjetoRegistro): Projeto {
    return {
      id: registro.id,
      nome: registro.nome,
      colaboradores: registro.colaboradorIds.map((id) => colaborador(banco, id)),
      pessoasCriticas: registro.pessoaCriticaIds.map((id) => colaborador(banco, id)),
    };
  }

  function solicitacao(banco: BancoMock, registro: SolicitacaoRegistro): Solicitacao {
    return {
      id: registro.id,
      colaborador: colaborador(banco, registro.colaboradorId),
      coordenador: colaborador(banco, registro.coordenadorId),
      periodos: registro.periodoIds
        .map((id) => banco.periodos.find((p) => p.id === id))
        .filter((p): p is Periodo => p !== undefined),
      status: registro.status,
      criadaEm: registro.criadaEm,
      observacao: registro.observacao,
      totalDias: registro.totalDias,
      abono: registro.abono,
      isPessoaCritica: registro.isPessoaCritica,
    };
  }

  // --- Validações equivalentes às da API ---

  function validarColaborador(dto: ColaboradorDto): void {
    const violacoes = [];
    if (dto.nome.trim() === '') violacoes.push({ campo: 'nome', mensagem: 'O nome é obrigatório.' });
    if (!PADRAO_EMAIL.test(dto.email)) violacoes.push({ campo: 'email', mensagem: 'Informe um e-mail válido.' });
    if (violacoes.length > 0) throw ErroRegraNegocio.deViolacoes(violacoes);
  }

  function validarPeriodoDto(dto: PeriodoDto): void {
    const erros = validarIntervalo(intervaloDoPeriodo({ id: 0, ...dto }));
    if (erros.length > 0) throw ErroRegraNegocio.deViolacoes(erros.map((mensagem) => ({ campo: 'dataFim', mensagem })));
  }

  return {
    restaurarDadosDemonstracao: async () => {
      if (latenciaMs > 0) await new Promise((resolve) => setTimeout(resolve, latenciaMs));
      gravar(criarDadosIniciais());
    },

    colaboradores: {
      listar: () => operar((b) => b.colaboradores.map((c) => colaborador(b, c.id))),
      buscar: (id) => operar((b) => (b.colaboradores.some((c) => c.id === id) ? colaborador(b, id) : null)),
      criar: (dto) =>
        mutar((b) => {
          validarColaborador(dto);
          const novo: ColaboradorRegistro = { id: proximoId(b.colaboradores), nome: dto.nome, email: dto.email, isCoordenador: false };
          b.colaboradores.push(novo);
          return colaborador(b, novo.id);
        }),
      atualizar: (id, dto) =>
        mutar((b) => {
          const registro = encontrar(b.colaboradores, id, 'Colaborador não encontrado.');
          validarColaborador(dto);
          registro.nome = dto.nome;
          registro.email = dto.email;
          return colaborador(b, id);
        }),
      excluir: (id) =>
        mutar((b) => {
          encontrar(b.colaboradores, id, 'Colaborador não encontrado.');
          b.colaboradores = b.colaboradores.filter((c) => c.id !== id);
          for (const p of b.projetos) {
            p.colaboradorIds = p.colaboradorIds.filter((x) => x !== id);
            p.pessoaCriticaIds = p.pessoaCriticaIds.filter((x) => x !== id);
          }
        }),
      tornarCoordenador: (id) =>
        mutar((b) => {
          encontrar(b.colaboradores, id, 'Colaborador não encontrado.').isCoordenador = true;
          return colaborador(b, id);
        }),
    },

    periodos: {
      listar: () => operar((b) => b.periodos),
      buscar: (id) => operar((b) => b.periodos.find((p) => p.id === id) ?? null),
      criar: (dto) =>
        mutar((b) => {
          validarPeriodoDto(dto);
          const novo: Periodo = { id: proximoId(b.periodos), ...dto };
          b.periodos.push(novo);
          return novo;
        }),
      atualizar: (id, dto) =>
        mutar((b) => {
          const registro = encontrar(b.periodos, id, 'Período não encontrado.');
          validarPeriodoDto(dto);
          Object.assign(registro, dto);
          return registro;
        }),
      excluir: (id) =>
        mutar((b) => {
          encontrar(b.periodos, id, 'Período não encontrado.');
          b.periodos = b.periodos.filter((p) => p.id !== id);
        }),
    },

    projetos: {
      listar: () => operar((b) => b.projetos.map((p) => projeto(b, p))),
      buscar: (id) =>
        operar((b) => {
          const registro = b.projetos.find((p) => p.id === id);
          return registro ? projeto(b, registro) : null;
        }),
      criar: (dto) =>
        mutar((b) => {
          if (dto.nome.trim() === '') throw ErroRegraNegocio.deViolacoes([{ campo: 'nome', mensagem: 'O nome é obrigatório.' }]);
          const novo: ProjetoRegistro = {
            id: proximoId(b.projetos),
            nome: dto.nome,
            colaboradorIds: dto.colaboradores.map((c) => c.id),
            pessoaCriticaIds: dto.pessoasCriticas.map((c) => c.id),
          };
          b.projetos.push(novo);
          return projeto(b, novo);
        }),
      atualizar: (id, dto) =>
        mutar((b) => {
          const registro = encontrar(b.projetos, id, 'Projeto não encontrado.');
          if (dto.nome.trim() === '') throw ErroRegraNegocio.deViolacoes([{ campo: 'nome', mensagem: 'O nome é obrigatório.' }]);
          registro.nome = dto.nome;
          registro.colaboradorIds = dto.colaboradores.map((c) => c.id);
          registro.pessoaCriticaIds = dto.pessoasCriticas.map((c) => c.id);
          return projeto(b, registro);
        }),
      excluir: (id) =>
        mutar((b) => {
          encontrar(b.projetos, id, 'Projeto não encontrado.');
          b.projetos = b.projetos.filter((p) => p.id !== id);
        }),
    },

    solicitacoes: {
      listar: () => operar((b) => b.solicitacoes.map((s) => solicitacao(b, s))),
      buscar: (id) =>
        operar((b) => {
          const registro = b.solicitacoes.find((s) => s.id === id);
          return registro ? solicitacao(b, registro) : null;
        }),
      criar: (dto) =>
        mutar((b) => {
          const violacoes = validarRegrasSolicitacao({ quantidadePeriodos: dto.periodos.length, totalDias: dto.totalDias, abono: dto.abono });
          if (violacoes.length > 0) throw ErroRegraNegocio.deViolacoes(violacoes);
          if (!isStatusSolicitacao(dto.status)) throw new ErroRegraNegocio('Status inválido.');
          const novo: SolicitacaoRegistro = {
            id: proximoId(b.solicitacoes),
            colaboradorId: dto.colaborador.id,
            coordenadorId: dto.coordenador.id,
            periodoIds: dto.periodos.map((p) => p.id),
            status: dto.status,
            criadaEm: dto.criadaEm,
            observacao: dto.observacao,
            totalDias: dto.totalDias,
            abono: dto.abono,
            isPessoaCritica: dto.isPessoaCritica,
          };
          b.solicitacoes.push(novo);
          return solicitacao(b, novo);
        }),
      atualizar: (id, dto) =>
        mutar((b) => {
          const registro = encontrar(b.solicitacoes, id, 'Solicitação não encontrada.');
          const violacoes = validarRegrasSolicitacao({ quantidadePeriodos: dto.periodos.length, totalDias: dto.totalDias, abono: dto.abono });
          if (violacoes.length > 0) throw ErroRegraNegocio.deViolacoes(violacoes);
          if (!isStatusSolicitacao(dto.status)) throw new ErroRegraNegocio('Status inválido.');
          Object.assign(registro, {
            colaboradorId: dto.colaborador.id,
            coordenadorId: dto.coordenador.id,
            periodoIds: dto.periodos.map((p) => p.id),
            status: dto.status,
            criadaEm: dto.criadaEm,
            observacao: dto.observacao,
            totalDias: dto.totalDias,
            abono: dto.abono,
            isPessoaCritica: dto.isPessoaCritica,
          });
          return solicitacao(b, registro);
        }),
      excluir: (id) =>
        mutar((b) => {
          encontrar(b.solicitacoes, id, 'Solicitação não encontrada.');
          b.solicitacoes = b.solicitacoes.filter((s) => s.id !== id);
        }),
      validar: (id) =>
        operar((b) => {
          const alvo = solicitacao(b, encontrar(b.solicitacoes, id, 'Solicitação não encontrada.'));
          if (alvo.periodos.length === 0) throw new ErroRegraNegocio('A solicitação não possui períodos.');
          const conflitos = detectarConflitos(
            alvo,
            b.solicitacoes.map((s) => solicitacao(b, s)),
            b.projetos.map((p) => projeto(b, p)),
          );
          return conflitos.length === 0
            ? { semConflito: true as const }
            : { semConflito: false as const, mensagem: mensagemDeConflito(conflitos) };
        }),
    },
  };
}
