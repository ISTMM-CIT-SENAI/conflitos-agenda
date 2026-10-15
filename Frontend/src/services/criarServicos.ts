import type { Colaborador, Periodo, Solicitacao } from '@/domain/entities';
import {
  StatusSolicitacao,
  podeDecidir,
  podeEditar,
  podeValidarConflito,
} from '@/domain/enums/statusSolicitacao';
import { intervaloDoPeriodo, seSobrepoem, validarIntervalo } from '@/domain/validation/periodo';
import {
  calcularTotalDias,
  isPessoaCriticaEmAlgumProjeto,
  validarRegrasSolicitacao,
} from '@/domain/validation/solicitacao';
import { agoraDateTimeOffset, dateTimeDeDataISO } from '@/lib/datas';
import { plural } from '@/lib/texto';
import type { ApiGateway, SolicitacaoDto } from './contracts/api';
import type {
  DemonstracaoService,
  PeriodoInput,
  ProjetoInput,
  Servicos,
  SolicitacaoInput,
} from './contracts/servicos';
import { ErroNaoEncontrado, ErroRegraNegocio, type Violacao } from './erros';

function exigir<T>(valor: T | null | undefined, mensagem: string): T {
  if (valor === null || valor === undefined) throw new ErroNaoEncontrado(mensagem);
  return valor;
}

/** Objeto completo de Colaborador como os DTOs da API esperam. */
function colaboradorParaPayload(colaborador: Colaborador): Colaborador {
  return {
    id: colaborador.id,
    nome: colaborador.nome,
    email: colaborador.email,
    isCoordenador: colaborador.isCoordenador,
    projetos: [],
  };
}

function dtoDeSolicitacao(solicitacao: Solicitacao): SolicitacaoDto {
  return {
    colaborador: colaboradorParaPayload(solicitacao.colaborador),
    periodos: solicitacao.periodos,
    status: solicitacao.status,
    criadaEm: solicitacao.criadaEm,
    coordenador: colaboradorParaPayload(solicitacao.coordenador),
    observacao: solicitacao.observacao,
    totalDias: solicitacao.totalDias,
    abono: solicitacao.abono,
    isPessoaCritica: solicitacao.isPessoaCritica,
  };
}

function contem(solicitacao: Solicitacao, periodoId: number): boolean {
  return solicitacao.periodos.some((p) => p.id === periodoId);
}

/**
 * Regras de negócio da aplicação sobre um `ApiGateway` (HTTP ou mock).
 * As telas só conhecem o objeto `Servicos` retornado aqui.
 */
export function criarServicos(
  api: ApiGateway,
  opcoes: { demonstracao?: DemonstracaoService } = {},
): Servicos {
  async function buscarSolicitacaoExistente(id: number): Promise<Solicitacao> {
    return exigir(await api.solicitacoes.buscar(id), 'Solicitação não encontrada.');
  }

  async function validarPeriodo(input: PeriodoInput, idEmEdicao?: number): Promise<void> {
    const errosIntervalo = validarIntervalo({ inicio: input.dataInicio, retorno: input.dataFim });
    if (errosIntervalo.length > 0) {
      throw ErroRegraNegocio.deViolacoes(errosIntervalo.map((mensagem) => ({ campo: 'dataFim', mensagem })));
    }

    exigir(await api.colaboradores.buscar(input.idColaborador), 'Colaborador não encontrado.');

    const intervalo = { inicio: input.dataInicio, retorno: input.dataFim };
    const sobreposto = (await api.periodos.listar()).find(
      (p) =>
        p.id !== idEmEdicao &&
        p.idColaborador === input.idColaborador &&
        seSobrepoem(intervalo, intervaloDoPeriodo(p)),
    );
    if (sobreposto) {
      throw ErroRegraNegocio.deViolacoes([
        { campo: 'dataInicio', mensagem: 'Este colaborador já possui um período que se sobrepõe a estas datas.' },
      ]);
    }
  }

  /** Converte o input da tela (IDs) no DTO completo da API, aplicando todas as regras. */
  async function montarSolicitacaoDto(
    input: SolicitacaoInput,
    base: { id?: number; status: StatusSolicitacao; criadaEm: string },
  ): Promise<SolicitacaoDto> {
    const [colaboradores, periodos, projetos, solicitacoes] = await Promise.all([
      api.colaboradores.listar(),
      api.periodos.listar(),
      api.projetos.listar(),
      api.solicitacoes.listar(),
    ]);
    const violacoes: Violacao[] = [];

    const colaborador = colaboradores.find((c) => c.id === input.colaboradorId);
    if (!colaborador) violacoes.push({ campo: 'colaboradorId', mensagem: 'Selecione um colaborador.' });

    const coordenador = colaboradores.find((c) => c.id === input.coordenadorId);
    if (!coordenador) {
      violacoes.push({ campo: 'coordenadorId', mensagem: 'Selecione um coordenador.' });
    } else if (!coordenador.isCoordenador) {
      violacoes.push({ campo: 'coordenadorId', mensagem: `${coordenador.nome} não é coordenador.` });
    } else if (coordenador.id === input.colaboradorId) {
      violacoes.push({
        campo: 'coordenadorId',
        mensagem: 'O coordenador não pode analisar a própria solicitação.',
      });
    }

    const selecionados: Periodo[] = [];
    for (const periodoId of input.periodoIds) {
      const periodo = periodos.find((p) => p.id === periodoId);
      if (!periodo) {
        violacoes.push({ campo: 'periodoIds', mensagem: `Período #${periodoId} não encontrado.` });
        continue;
      }
      if (periodo.idColaborador !== input.colaboradorId) {
        violacoes.push({ campo: 'periodoIds', mensagem: 'Todos os períodos devem pertencer ao colaborador.' });
        continue;
      }
      const emUso = solicitacoes.find(
        (s) => s.id !== base.id && s.status !== StatusSolicitacao.Recusada && contem(s, periodoId),
      );
      if (emUso) {
        violacoes.push({
          campo: 'periodoIds',
          mensagem: `Um dos períodos já faz parte da solicitação #${emUso.id}.`,
        });
        continue;
      }
      selecionados.push(periodo);
    }

    const totalDias = calcularTotalDias(selecionados);
    violacoes.push(
      ...validarRegrasSolicitacao({
        quantidadePeriodos: input.periodoIds.length,
        totalDias,
        abono: input.abono,
      }),
    );

    if (violacoes.length > 0 || !colaborador || !coordenador) {
      throw ErroRegraNegocio.deViolacoes(violacoes);
    }

    const observacao = input.observacao.trim();
    return {
      colaborador: colaboradorParaPayload(colaborador),
      periodos: selecionados,
      status: base.status,
      criadaEm: base.criadaEm,
      coordenador: colaboradorParaPayload(coordenador),
      observacao: observacao === '' ? null : observacao,
      totalDias,
      abono: input.abono,
      isPessoaCritica: isPessoaCriticaEmAlgumProjeto(colaborador.id, projetos),
    };
  }

  async function montarProjetoDto(input: ProjetoInput) {
    const colaboradores = await api.colaboradores.listar();
    const resolver = (ids: number[]) =>
      ids.map((id) => colaboradorParaPayload(exigir(colaboradores.find((c) => c.id === id), `Colaborador #${id} não encontrado.`)));

    const foraDoProjeto = input.pessoaCriticaIds.filter((id) => !input.colaboradorIds.includes(id));
    if (foraDoProjeto.length > 0) {
      throw ErroRegraNegocio.deViolacoes([
        { campo: 'pessoaCriticaIds', mensagem: 'Pessoas críticas devem ser colaboradores do projeto.' },
      ]);
    }
    return {
      nome: input.nome.trim(),
      colaboradores: resolver(input.colaboradorIds),
      pessoasCriticas: resolver(input.pessoaCriticaIds),
    };
  }

  async function alterarStatus(
    solicitacao: Solicitacao,
    status: StatusSolicitacao,
    observacao = solicitacao.observacao,
  ): Promise<Solicitacao> {
    return api.solicitacoes.atualizar(solicitacao.id, { ...dtoDeSolicitacao(solicitacao), status, observacao });
  }

  return {
    demonstracao: opcoes.demonstracao ?? null,

    colaboradores: {
      listar: () => api.colaboradores.listar(),
      buscarPorId: (id) => api.colaboradores.buscar(id),
      criar: (input) => api.colaboradores.criar({ nome: input.nome.trim(), email: input.email.trim() }),
      async atualizar(id, input) {
        exigir(await api.colaboradores.buscar(id), 'Colaborador não encontrado.');
        return api.colaboradores.atualizar(id, { nome: input.nome.trim(), email: input.email.trim() });
      },
      async excluir(id) {
        const [periodos, solicitacoes] = await Promise.all([api.periodos.listar(), api.solicitacoes.listar()]);
        const qtdPeriodos = periodos.filter((p) => p.idColaborador === id).length;
        const qtdSolicitacoes = solicitacoes.filter(
          (s) => s.colaborador.id === id || s.coordenador.id === id,
        ).length;
        if (qtdPeriodos > 0 || qtdSolicitacoes > 0) {
          const partes = [
            qtdPeriodos > 0 ? plural(qtdPeriodos, 'período', 'períodos') : null,
            qtdSolicitacoes > 0 ? plural(qtdSolicitacoes, 'solicitação', 'solicitações') : null,
          ].filter(Boolean);
          throw new ErroRegraNegocio(
            `Este colaborador possui ${partes.join(' e ')} vinculados. Exclua-os antes de excluir o colaborador.`,
          );
        }
        await api.colaboradores.excluir(id);
      },
      async tornarCoordenador(id) {
        const colaborador = exigir(await api.colaboradores.buscar(id), 'Colaborador não encontrado.');
        return api.colaboradores.tornarCoordenador(id, { nome: colaborador.nome, email: colaborador.email });
      },
    },

    projetos: {
      listar: () => api.projetos.listar(),
      buscarPorId: (id) => api.projetos.buscar(id),
      criar: async (input) => api.projetos.criar(await montarProjetoDto(input)),
      async atualizar(id, input) {
        exigir(await api.projetos.buscar(id), 'Projeto não encontrado.');
        return api.projetos.atualizar(id, await montarProjetoDto(input));
      },
      excluir: (id) => api.projetos.excluir(id),
    },

    periodos: {
      listar: () => api.periodos.listar(),
      buscarPorId: (id) => api.periodos.buscar(id),
      async criar(input) {
        await validarPeriodo(input);
        return api.periodos.criar({
          dataInicio: dateTimeDeDataISO(input.dataInicio),
          dataFim: dateTimeDeDataISO(input.dataFim),
          idColaborador: input.idColaborador,
        });
      },
      async atualizar(id, input) {
        const atual = exigir(await api.periodos.buscar(id), 'Período não encontrado.');
        const vinculadas = (await api.solicitacoes.listar()).filter((s) => contem(s, id));

        const aprovada = vinculadas.find((s) => s.status === StatusSolicitacao.Aprovada);
        if (aprovada) {
          throw new ErroRegraNegocio(
            `Este período faz parte da solicitação #${aprovada.id}, que já foi aprovada, e não pode ser alterado.`,
          );
        }
        if (vinculadas.length > 0 && input.idColaborador !== atual.idColaborador) {
          throw ErroRegraNegocio.deViolacoes([
            {
              campo: 'idColaborador',
              mensagem: 'O colaborador não pode ser trocado: o período já faz parte de uma solicitação.',
            },
          ]);
        }
        await validarPeriodo(input, id);

        const atualizado = await api.periodos.atualizar(id, {
          dataInicio: dateTimeDeDataISO(input.dataInicio),
          dataFim: dateTimeDeDataISO(input.dataFim),
          idColaborador: input.idColaborador,
        });

        // Solicitações ainda em aberto passam a refletir as novas datas e voltam para análise.
        for (const solicitacao of vinculadas.filter((s) => podeEditar(s.status))) {
          const periodos = solicitacao.periodos.map((p) => (p.id === id ? atualizado : p));
          await api.solicitacoes.atualizar(solicitacao.id, {
            ...dtoDeSolicitacao(solicitacao),
            periodos,
            totalDias: calcularTotalDias(periodos),
            status: StatusSolicitacao.EmAnalise,
          });
        }
        return atualizado;
      },
      async excluir(id) {
        const vinculada = (await api.solicitacoes.listar()).find((s) => contem(s, id));
        if (vinculada) {
          throw new ErroRegraNegocio(
            `Este período faz parte da solicitação #${vinculada.id}. Remova-o da solicitação antes de excluí-lo.`,
          );
        }
        await api.periodos.excluir(id);
      },
    },

    solicitacoes: {
      listar: () => api.solicitacoes.listar(),
      buscarPorId: (id) => api.solicitacoes.buscar(id),
      async criar(input) {
        const dto = await montarSolicitacaoDto(input, {
          status: StatusSolicitacao.EmAnalise,
          criadaEm: agoraDateTimeOffset(),
        });
        return api.solicitacoes.criar(dto);
      },
      async atualizar(id, input) {
        const atual = await buscarSolicitacaoExistente(id);
        if (!podeEditar(atual.status)) {
          throw new ErroRegraNegocio('Solicitações aprovadas ou recusadas não podem ser editadas.');
        }
        const dto = await montarSolicitacaoDto(input, {
          id,
          status: StatusSolicitacao.EmAnalise,
          criadaEm: atual.criadaEm,
        });
        return api.solicitacoes.atualizar(id, dto);
      },
      excluir: (id) => api.solicitacoes.excluir(id),
      async validarConflitos(id) {
        const atual = await buscarSolicitacaoExistente(id);
        if (!podeValidarConflito(atual.status)) {
          throw new ErroRegraNegocio('Solicitações aprovadas ou recusadas não são revalidadas.');
        }
        const resultado = await api.solicitacoes.validar(id);
        if (resultado.semConflito) {
          const solicitacao =
            atual.status === StatusSolicitacao.ConflitoEncontrado
              ? await alterarStatus(atual, StatusSolicitacao.EmAnalise)
              : atual;
          return { conflito: false, mensagem: 'Nenhum conflito encontrado.', solicitacao };
        }
        const solicitacao =
          atual.status === StatusSolicitacao.ConflitoEncontrado
            ? atual
            : await alterarStatus(atual, StatusSolicitacao.ConflitoEncontrado);
        return { conflito: true, mensagem: resultado.mensagem, solicitacao };
      },
      async aprovar(id) {
        const atual = await buscarSolicitacaoExistente(id);
        if (!podeDecidir(atual.status)) {
          throw new ErroRegraNegocio('Esta solicitação já foi decidida.');
        }
        return alterarStatus(atual, StatusSolicitacao.Aprovada);
      },
      async recusar(id, observacao) {
        const justificativa = observacao.trim();
        if (justificativa === '') {
          throw ErroRegraNegocio.deViolacoes([
            { campo: 'observacao', mensagem: 'Informe uma observação para recusar a solicitação.' },
          ]);
        }
        const atual = await buscarSolicitacaoExistente(id);
        if (!podeDecidir(atual.status)) {
          throw new ErroRegraNegocio('Esta solicitação já foi decidida.');
        }
        return alterarStatus(atual, StatusSolicitacao.Recusada, justificativa);
      },
    },
  };
}
