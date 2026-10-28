import { beforeEach, describe, expect, it } from 'vitest';
import { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { violacoesDaSolicitacao } from '@/domain/validation/solicitacao';
import type { Servicos } from './contracts/servicos';
import { criarServicos } from './criarServicos';
import { ErroRegraNegocio } from './erros';
import { criarArmazenamentoEmMemoria } from './mocks/banco';
import { CREDENCIAIS_DEMONSTRACAO, SENHA_DEMONSTRACAO, criarDadosDemonstracao } from './mocks/dadosDemonstracao';
import { criarGatewayMock } from './mocks/gatewayMock';

const HOJE = '2026-10-14';

let servicos: Servicos;

beforeEach(async () => {
  const mock = criarGatewayMock({
    armazenamento: criarArmazenamentoEmMemoria(),
    criarDadosIniciais: () => criarDadosDemonstracao(HOJE),
  });
  servicos = criarServicos(mock, {
    demonstracao: { restaurarDados: mock.restaurarDadosDemonstracao, credenciais: CREDENCIAIS_DEMONSTRACAO },
  });
  // Estes testes exercitam as regras de negócio com acesso total.
  await servicos.autenticacao.entrar('coordenador', SENHA_DEMONSTRACAO);
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
    expect(erro.message).toMatch(/1 período e 1 solicitação/);
  });

  it('exclui colaborador sem vínculos e o remove dos projetos', async () => {
    const novo = await servicos.colaboradores.criar({ nome: 'Ivo', respondeAId: 2 });
    await servicos.projetos.atualizar(1, { nome: 'Portal do Cliente', colaboradorIds: [1, 3, 4, 5, novo.id], pessoaCriticaIds: [3, 4] });
    await servicos.colaboradores.excluir(novo.id);
    const projeto = await servicos.projetos.buscarPorId(1);
    expect(projeto?.colaboradores.map((c) => c.id)).toEqual([1, 3, 4, 5]);
  });

  it('guarda a quem o colaborador responde, que precisa ser supervisor', async () => {
    const novo = await servicos.colaboradores.criar({ nome: 'Ivo', respondeAId: 2 });
    expect(novo.respondeA).toEqual({ id: 2, nome: 'Bruno Carvalho' });
    const erro = await esperarErroRegra(servicos.colaboradores.atualizar(novo.id, { nome: 'Ivo', respondeAId: 3 }));
    expect(erro.violacoes[0].campo).toBe('respondeAId');
  });

  it('torna colaborador supervisor', async () => {
    const atualizado = await servicos.colaboradores.tornarSupervisor(3);
    expect(atualizado.isSupervisor).toBe(true);
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

  it('rejeita duração fora de 5 a 30 dias', async () => {
    const erro = await esperarErroRegra(servicos.periodos.criar({ idColaborador: 2, dataInicio: '2027-03-01', dataFim: '2027-03-05' }));
    expect(erro.violacoes[0].campo).toBe('dataFim');
  });

  it('rejeita sobreposição com outro período do mesmo colaborador', async () => {
    // Período #11 de Ana: hoje+120 → hoje+130 (2027-02-11 → 2027-02-21)
    await esperarErroRegra(servicos.periodos.criar({ idColaborador: 1, dataInicio: '2027-02-15', dataFim: '2027-03-01' }));
  });

  it('bloqueia edição de período de solicitação aprovada', async () => {
    const erro = await esperarErroRegra(servicos.periodos.atualizar(4, { idColaborador: 8, dataInicio: '2026-09-01', dataFim: '2026-09-15' }));
    expect(erro.message).toMatch(/aprovada/);
  });

  it('ao editar período de solicitação em aberto, recalcula o total e volta para Em análise', async () => {
    await servicos.periodos.atualizar(2, { idColaborador: 4, dataInicio: '2027-05-03', dataFim: '2027-06-02' });
    const solicitacao = await servicos.solicitacoes.buscarPorId(2);
    expect(solicitacao?.status).toBe(StatusSolicitacao.EmAnalise);
    expect(solicitacao?.totalDias).toBe(30);
  });

  it('não deixa a edição do período passar do saldo de férias do ano', async () => {
    // Eduarda pede 2026 em duas partes de 15 dias; aumentar a primeira passaria de 30.
    const primeiro = await servicos.periodos.criar({ idColaborador: 5, dataInicio: '2026-11-30', dataFim: '2026-12-15' });
    await servicos.solicitacoes.criar({ colaboradorId: 5, periodoIds: [primeiro.id], abono: false, observacao: '' });
    const segundo = await servicos.periodos.criar({ idColaborador: 5, dataInicio: '2026-12-21', dataFim: '2027-01-05' });
    await servicos.solicitacoes.criar({ colaboradorId: 5, periodoIds: [segundo.id], abono: false, observacao: '' });
    const erro = await esperarErroRegra(
      servicos.periodos.atualizar(primeiro.id, { idColaborador: 5, dataInicio: '2026-11-23', dataFim: '2026-12-15' }),
    );
    expect(erro.violacoes[0].mensagem).toMatch(/ficaria fora das regras: Seriam 37 dias de férias em 2026/);
  });

  it('não deixa a edição do período levar a solicitação para um ano sem saldo', async () => {
    // Eduarda já tem os 30 dias de 2027 na #3; cria uma de 2026 e tenta mover o período dela para 2027.
    const periodo = await servicos.periodos.criar({ idColaborador: 5, dataInicio: '2026-11-30', dataFim: '2026-12-30' });
    await servicos.solicitacoes.criar({ colaboradorId: 5, periodoIds: [periodo.id], abono: false, observacao: '' });
    const erro = await esperarErroRegra(
      servicos.periodos.atualizar(periodo.id, { idColaborador: 5, dataInicio: '2027-01-04', dataFim: '2027-02-03' }),
    );
    expect(erro.violacoes[0].mensagem).toMatch(/Seriam 60 dias de férias em 2027/);
    expect((await servicos.periodos.buscarPorId(periodo.id))?.dataInicio).toBe('2026-11-30T00:00:00');
  });

  it('bloqueia exclusão de período vinculado a solicitação', async () => {
    await esperarErroRegra(servicos.periodos.excluir(1));
  });
});

describe('Solicitações', () => {
  it('cria em análise, encaminha a quem o colaborador responde e deriva Total de Dias e Pessoa Crítica', async () => {
    // Eduarda responde a Bruno; a solicitação #3 dela é de 2027.
    const periodo = await servicos.periodos.criar({ idColaborador: 5, dataInicio: '2026-11-30', dataFim: '2026-12-30' });
    const criada = await servicos.solicitacoes.criar({ colaboradorId: 5, periodoIds: [periodo.id], abono: false, observacao: ' ' });
    expect(criada).toMatchObject({ status: StatusSolicitacao.EmAnalise, totalDias: 30, isPessoaCritica: false, observacao: null });
    expect(criada.supervisor.id).toBe(2);
  });

  it('a do Coordenador já nasce aprovada, com a Decisão registrada', async () => {
    const periodo = await servicos.periodos.criar({ idColaborador: 1, dataInicio: '2027-01-04', dataFim: '2027-02-03' });
    const propria = await servicos.solicitacoes.criar({ colaboradorId: 1, periodoIds: [periodo.id], abono: false, observacao: '' });
    expect(propria.status).toBe(StatusSolicitacao.Aprovada);
    expect(propria.decididaPor).toMatchObject({ nomeUsuario: 'coordenador', isCoordenador: true });
  });

  it('exige "Responde a" cadastrado', async () => {
    const semChefe = await servicos.colaboradores.criar({ nome: 'Sem Chefe', respondeAId: null });
    const periodo = await servicos.periodos.criar({ idColaborador: semChefe.id, dataInicio: '2027-01-04', dataFim: '2027-02-03' });
    const erro = await esperarErroRegra(
      servicos.solicitacoes.criar({ colaboradorId: semChefe.id, periodoIds: [periodo.id], abono: false, observacao: '' }),
    );
    expect(erro.message).toMatch(/Responde a/);
  });

  it('aceita pedir só uma parte das férias, até o saldo do ano', async () => {
    // Eduarda: 15 dias agora; os outros 15 depois.
    const parte = await servicos.periodos.criar({ idColaborador: 5, dataInicio: '2026-11-30', dataFim: '2026-12-15' });
    expect((await servicos.solicitacoes.criar({ colaboradorId: 5, periodoIds: [parte.id], abono: false, observacao: '' })).totalDias).toBe(15);

    // Carla já usou os 30 dias de 2026 na #1.
    const excesso = await servicos.periodos.criar({ idColaborador: 3, dataInicio: '2026-12-14', dataFim: '2026-12-21' });
    const erro = await esperarErroRegra(servicos.solicitacoes.criar({ colaboradorId: 3, periodoIds: [excesso.id], abono: false, observacao: '' }));
    expect(erro.violacoes[0].mensagem).toMatch(/Seriam 37 dias de férias em 2026/);
  });

  it('não permite reutilizar período de outra solicitação ativa', async () => {
    const erro = await esperarErroRegra(
      servicos.solicitacoes.criar({ colaboradorId: 3, periodoIds: [1], abono: false, observacao: '' }),
    );
    expect(erro.message).toMatch(/#1/);
  });

  it('aplica regras de abono: o limite do ano cai para 20 dias', async () => {
    // A #8 do Felipe tem 30 dias.
    const erro = await esperarErroRegra(servicos.solicitacoes.atualizar(8, { colaboradorId: 6, periodoIds: [12], abono: true, observacao: '' }));
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
    const editada = await servicos.solicitacoes.atualizar(2, { colaboradorId: 4, periodoIds: [2], abono: false, observacao: 'Ajuste' });
    expect(editada.status).toBe(StatusSolicitacao.EmAnalise);
  });

  it('não troca o colaborador de uma solicitação', async () => {
    const erro = await esperarErroRegra(servicos.solicitacoes.atualizar(1, { colaboradorId: 4, periodoIds: [2], abono: false, observacao: '' }));
    expect(erro.message).toMatch(/não pode ser trocado/);
  });

  it('recusa exige observação', async () => {
    const erro = await esperarErroRegra(servicos.solicitacoes.recusar(3, '   '));
    expect(erro.violacoes[0].campo).toBe('observacao');
  });

  it('aprova a partir de Conflito encontrado e trava a solicitação', async () => {
    const aprovada = await servicos.solicitacoes.aprovar(2);
    expect(aprovada.status).toBe(StatusSolicitacao.Aprovada);
    await esperarErroRegra(servicos.solicitacoes.aprovar(2));
    await esperarErroRegra(servicos.solicitacoes.atualizar(2, { colaboradorId: 4, periodoIds: [2], abono: false, observacao: '' }));
  });
});
