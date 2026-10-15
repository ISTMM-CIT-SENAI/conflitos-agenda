import { beforeEach, describe, expect, it } from 'vitest';
import { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { violacoesDaSolicitacao } from '@/domain/validation/solicitacao';
import type { Servicos } from './contracts/servicos';
import { criarServicos } from './criarServicos';
import { ErroRegraNegocio } from './erros';
import { criarArmazenamentoEmMemoria } from './mocks/banco';
import { criarDadosDemonstracao } from './mocks/dadosDemonstracao';
import { criarGatewayMock } from './mocks/gatewayMock';

const HOJE = '2026-10-14';

let servicos: Servicos;

beforeEach(() => {
  const mock = criarGatewayMock({
    armazenamento: criarArmazenamentoEmMemoria(),
    criarDadosIniciais: () => criarDadosDemonstracao(HOJE),
  });
  servicos = criarServicos(mock, { demonstracao: { restaurarDados: mock.restaurarDadosDemonstracao } });
});

async function esperarErroRegra(promessa: Promise<unknown>): Promise<ErroRegraNegocio> {
  const erro = await promessa.then(
    () => null,
    (e: unknown) => e,
  );
  expect(erro).toBeInstanceOf(ErroRegraNegocio);
  return erro as ErroRegraNegocio;
}

describe('dados de demonstração', () => {
  it('cobrem os quatro status e uma solicitação inválida', async () => {
    const solicitacoes = await servicos.solicitacoes.listar();
    expect(new Set(solicitacoes.map((s) => s.status))).toEqual(
      new Set([StatusSolicitacao.EmAnalise, StatusSolicitacao.Aprovada, StatusSolicitacao.Recusada, StatusSolicitacao.ConflitoEncontrado]),
    );
    expect(solicitacoes.filter((s) => violacoesDaSolicitacao(s).length > 0).map((s) => s.id)).toEqual([7]);
  });

  it('podem ser restaurados após alterações', async () => {
    await servicos.solicitacoes.excluir(3);
    await servicos.demonstracao?.restaurarDados();
    expect(await servicos.solicitacoes.buscarPorId(3)).not.toBeNull();
  });
});

describe('Colaboradores', () => {
  it('bloqueia exclusão de colaborador com períodos ou solicitações', async () => {
    const erro = await esperarErroRegra(servicos.colaboradores.excluir(3));
    expect(erro.message).toMatch(/4 períodos e 2 solicitações/);
  });

  it('exclui colaborador sem vínculos e o remove dos projetos', async () => {
    const novo = await servicos.colaboradores.criar({ nome: 'Ivo', email: 'ivo@example.com' });
    await servicos.projetos.atualizar(1, { nome: 'Portal do Cliente', colaboradorIds: [1, 3, 4, 5, novo.id], pessoaCriticaIds: [3, 4] });
    await servicos.colaboradores.excluir(novo.id);
    const projeto = await servicos.projetos.buscarPorId(1);
    expect(projeto?.colaboradores.map((c) => c.id)).toEqual([1, 3, 4, 5]);
  });

  it('torna colaborador coordenador', async () => {
    const atualizado = await servicos.colaboradores.tornarCoordenador(3);
    expect(atualizado.isCoordenador).toBe(true);
  });
});

describe('Projetos', () => {
  it('converte IDs em objetos completos de colaborador', async () => {
    const projeto = await servicos.projetos.criar({ nome: 'Novo', colaboradorIds: [1, 2], pessoaCriticaIds: [2] });
    expect(projeto.pessoasCriticas[0]).toMatchObject({ id: 2, nome: 'Bruno Carvalho' });
  });

  it('exige que pessoas críticas sejam colaboradores do projeto', async () => {
    const erro = await esperarErroRegra(servicos.projetos.criar({ nome: 'Novo', colaboradorIds: [1], pessoaCriticaIds: [2] }));
    expect(erro.violacoes[0].campo).toBe('pessoaCriticaIds');
  });
});

describe('Períodos', () => {
  it('cria período e envia DateTime no formato da API', async () => {
    const periodo = await servicos.periodos.criar({ idColaborador: 2, dataInicio: '2027-03-01', dataFim: '2027-03-15' });
    expect(periodo.dataInicio).toBe('2027-03-01T00:00:00');
    expect(periodo.idColaborador).toBe(2);
  });

  it('rejeita duração fora de 10 a 30 dias', async () => {
    const erro = await esperarErroRegra(servicos.periodos.criar({ idColaborador: 2, dataInicio: '2027-03-01', dataFim: '2027-03-05' }));
    expect(erro.violacoes[0].campo).toBe('dataFim');
  });

  it('rejeita sobreposição com outro período do mesmo colaborador', async () => {
    // Período #11 de Ana: hoje+120 → hoje+130 (2027-02-11 → 2027-02-21)
    await esperarErroRegra(servicos.periodos.criar({ idColaborador: 1, dataInicio: '2027-02-15', dataFim: '2027-03-01' }));
  });

  it('bloqueia edição de período de solicitação aprovada', async () => {
    const erro = await esperarErroRegra(servicos.periodos.atualizar(4, { idColaborador: 6, dataInicio: '2026-09-01', dataFim: '2026-09-15' }));
    expect(erro.message).toMatch(/aprovada/);
  });

  it('ao editar período de solicitação em aberto, recalcula o total e volta para Em análise', async () => {
    await servicos.periodos.atualizar(2, { idColaborador: 4, dataInicio: '2027-05-01', dataFim: '2027-05-21' });
    const solicitacao = await servicos.solicitacoes.buscarPorId(2);
    expect(solicitacao?.status).toBe(StatusSolicitacao.EmAnalise);
    expect(solicitacao?.totalDias).toBe(20);
  });

  it('bloqueia exclusão de período vinculado a solicitação', async () => {
    await esperarErroRegra(servicos.periodos.excluir(1));
  });
});

describe('Solicitações', () => {
  it('cria em análise e deriva Total de Dias e Pessoa Crítica', async () => {
    const criada = await servicos.solicitacoes.criar({ colaboradorId: 1, coordenadorId: 2, periodoIds: [11], abono: false, observacao: ' ' });
    expect(criada).toMatchObject({ status: StatusSolicitacao.EmAnalise, totalDias: 10, isPessoaCritica: false, observacao: null });
  });

  it('exige coordenador habilitado e diferente do solicitante', async () => {
    const naoCoordenador = await esperarErroRegra(
      servicos.solicitacoes.criar({ colaboradorId: 1, coordenadorId: 3, periodoIds: [11], abono: false, observacao: '' }),
    );
    expect(naoCoordenador.violacoes[0].campo).toBe('coordenadorId');
    await esperarErroRegra(servicos.solicitacoes.criar({ colaboradorId: 1, coordenadorId: 1, periodoIds: [11], abono: false, observacao: '' }));
  });

  it('não permite reutilizar período de outra solicitação ativa', async () => {
    const erro = await esperarErroRegra(
      servicos.solicitacoes.criar({ colaboradorId: 3, coordenadorId: 1, periodoIds: [1], abono: false, observacao: '' }),
    );
    expect(erro.message).toMatch(/#1/);
  });

  it('aplica regras de abono', async () => {
    const erro = await esperarErroRegra(servicos.solicitacoes.atualizar(7, { colaboradorId: 3, coordenadorId: 2, periodoIds: [8, 9, 10], abono: true, observacao: '' }));
    expect(erro.violacoes.map((v) => v.campo)).toContain('abono');
  });

  it('validação com conflito grava Conflito encontrado', async () => {
    const resultado = await servicos.solicitacoes.validarConflitos(1);
    expect(resultado.conflito).toBe(true);
    expect(resultado.mensagem).toMatch(/Diego Fernandes/);
    expect(resultado.solicitacao.status).toBe(StatusSolicitacao.ConflitoEncontrado);
  });

  it('períodos adjacentes não geram conflito', async () => {
    const resultado = await servicos.solicitacoes.validarConflitos(8);
    expect(resultado.conflito).toBe(false);
  });

  it('volta para Em análise quando o conflito deixa de existir', async () => {
    await servicos.solicitacoes.recusar(1, 'Conflito com Diego.');
    const resultado = await servicos.solicitacoes.validarConflitos(2);
    expect(resultado.conflito).toBe(false);
    expect(resultado.solicitacao.status).toBe(StatusSolicitacao.EmAnalise);
  });

  it('edição de solicitação com conflito volta para Em análise', async () => {
    const editada = await servicos.solicitacoes.atualizar(2, { colaboradorId: 4, coordenadorId: 1, periodoIds: [2], abono: false, observacao: 'Ajuste' });
    expect(editada.status).toBe(StatusSolicitacao.EmAnalise);
  });

  it('recusa exige observação', async () => {
    const erro = await esperarErroRegra(servicos.solicitacoes.recusar(3, '   '));
    expect(erro.violacoes[0].campo).toBe('observacao');
  });

  it('aprova a partir de Conflito encontrado e trava a solicitação', async () => {
    const aprovada = await servicos.solicitacoes.aprovar(2);
    expect(aprovada.status).toBe(StatusSolicitacao.Aprovada);
    await esperarErroRegra(servicos.solicitacoes.aprovar(2));
    await esperarErroRegra(servicos.solicitacoes.atualizar(2, { colaboradorId: 4, coordenadorId: 1, periodoIds: [2], abono: false, observacao: '' }));
  });
});
