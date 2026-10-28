import { beforeEach, describe, expect, it } from 'vitest';
import { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import type { Servicos } from './contracts/servicos';
import { criarServicos } from './criarServicos';
import { ErroAcessoNegado, ErroNaoAutenticado, ErroRegraNegocio, ErroTrocaSenhaObrigatoria } from './erros';
import { criarArmazenamentoEmMemoria } from './mocks/banco';
import { CREDENCIAIS_DEMONSTRACAO, SENHA_DEMONSTRACAO, criarDadosDemonstracao } from './mocks/dadosDemonstracao';
import { criarGatewayMock } from './mocks/gatewayMock';

const HOJE = '2026-10-14';
let servicos: Servicos;
let mock: ReturnType<typeof criarGatewayMock>;

beforeEach(() => {
  mock = criarGatewayMock({
    armazenamento: criarArmazenamentoEmMemoria(),
    criarDadosIniciais: () => criarDadosDemonstracao(HOJE),
  });
  servicos = criarServicos(mock, {
    demonstracao: { restaurarDados: mock.restaurarDadosDemonstracao, credenciais: CREDENCIAIS_DEMONSTRACAO },
  });
});

const entrarComo = (nomeUsuario: 'coordenador' | 'supervisor' | 'colaborador') =>
  servicos.autenticacao.entrar(nomeUsuario, SENHA_DEMONSTRACAO);

async function falha(promessa: Promise<unknown>): Promise<unknown> {
  return promessa.then(
    () => null,
    (erro: unknown) => erro,
  );
}

describe('login', () => {
  it('exige sessão para acessar os dados', async () => {
    expect(await falha(servicos.solicitacoes.listar())).toBeInstanceOf(ErroNaoAutenticado);
    expect(await servicos.autenticacao.usuarioAtual()).toBeNull();
  });

  it('entra sem diferenciar maiúsculas no nome de usuário e deriva o nível de acesso', async () => {
    expect((await servicos.autenticacao.entrar('COORDENADOR', SENHA_DEMONSTRACAO)).nivel).toBe('coordenador');
    await servicos.autenticacao.sair();
    expect((await entrarComo('supervisor')).nivel).toBe('supervisor');
    await servicos.autenticacao.sair();
    expect((await entrarComo('colaborador')).nivel).toBe('colaborador');
  });

  it('usa a mesma mensagem para usuário inexistente e senha errada', async () => {
    const inexistente = (await falha(servicos.autenticacao.entrar('ninguem', 'x'))) as Error;
    const senhaErrada = (await falha(servicos.autenticacao.entrar('coordenador', 'errada'))) as Error;
    expect(inexistente.message).toBe('Usuário ou senha inválidos.');
    expect(senhaErrada.message).toBe(inexistente.message);
  });

  it('bloqueia após 5 tentativas erradas', async () => {
    for (let i = 0; i < 5; i++) await falha(servicos.autenticacao.entrar('coordenador', 'errada'));
    const erro = (await falha(entrarComo('coordenador'))) as Error;
    expect(erro.message).toMatch(/Muitas tentativas/);
  });

  it('exige trocar a senha temporária antes de usar o sistema', async () => {
    await entrarComo('coordenador');
    await servicos.usuarios.criar({ colaboradorId: 8, nomeUsuario: 'henrique', senhaTemporaria: 'temporaria1', isCoordenador: false });
    await servicos.autenticacao.sair();

    const logado = await servicos.autenticacao.entrar('henrique', 'temporaria1');
    expect(logado.precisaTrocarSenha).toBe(true);
    expect(await falha(servicos.solicitacoes.listar())).toBeInstanceOf(ErroTrocaSenhaObrigatoria);

    await servicos.autenticacao.trocarSenha('temporaria1', 'MinhaSenha123');
    expect(await servicos.solicitacoes.listar()).toBeInstanceOf(Array);
  });
});

describe('Colaborador', () => {
  beforeEach(async () => {
    await entrarComo('colaborador'); // Carla Mendes (#3)
  });

  it('vê só as próprias solicitações', async () => {
    const ids = (await servicos.solicitacoes.listar()).map((s) => s.id).sort();
    expect(ids).toEqual([1]);
  });

  it('vê os próprios períodos e as ausências planejadas dos colegas de projeto', async () => {
    const ids = new Set((await servicos.periodos.listar()).map((p) => p.id));
    expect(ids.has(1)).toBe(true); // próprio
    expect(ids.has(2)).toBe(true); // Diego, colega do Portal do Cliente
    expect(ids.has(7)).toBe(false); // Henrique: solicitação recusada
    expect(ids.has(4)).toBe(true); // Henrique, colega do App Mobile: solicitação aprovada
    expect(ids.has(12)).toBe(false); // Felipe: não é colega de projeto
  });

  it('não acessa cadastros nem cria solicitação para outra pessoa', async () => {
    expect(await falha(servicos.colaboradores.criar({ nome: 'Novo', respondeAId: null }))).toBeInstanceOf(ErroAcessoNegado);
    expect(await falha(servicos.usuarios.listar())).toBeInstanceOf(ErroAcessoNegado);
    expect(
      await falha(servicos.solicitacoes.criar({ colaboradorId: 4, periodoIds: [2], abono: false, observacao: '' })),
    ).toBeInstanceOf(ErroAcessoNegado);
  });

  it('não aprova a própria solicitação', async () => {
    expect(await falha(servicos.solicitacoes.aprovar(1))).toBeInstanceOf(ErroAcessoNegado);
  });

  it('só gerencia os próprios períodos', async () => {
    expect(
      await falha(servicos.periodos.criar({ idColaborador: 4, dataInicio: '2027-05-03', dataFim: '2027-05-17' })),
    ).toBeInstanceOf(ErroAcessoNegado);
  });
});

describe('Supervisor', () => {
  beforeEach(async () => {
    await entrarComo('supervisor'); // Bruno Carvalho (#2)
  });

  it('vê as solicitações encaminhadas a ele', async () => {
    const ids = (await servicos.solicitacoes.listar()).map((s) => s.id).sort();
    expect(ids).toEqual([1, 2, 3, 4, 6, 7]);
  });

  it('decide as atribuídas e a Decisão fica registrada', async () => {
    const aprovada = await servicos.solicitacoes.aprovar(3);
    expect(aprovada.status).toBe(StatusSolicitacao.Aprovada);
    expect(aprovada.decididaPor?.nomeUsuario).toBe('supervisor');
    expect(aprovada.decididaEm).toBeTruthy();
  });

  it('não vê nem decide solicitações de outro supervisor', async () => {
    expect(await servicos.solicitacoes.buscarPorId(5)).toBeNull(); // Gabriela responde à Coordenadora
  });

  it('não altera o conteúdo de uma solicitação atribuída', async () => {
    // Direto no gateway (como na API): a camada de serviço já barraria a mudança pelas regras da CLT.
    const atual = (await servicos.solicitacoes.buscarPorId(3))!;
    const erro = await falha(mock.solicitacoes.atualizar(3, { ...atual, abono: !atual.abono }));
    expect(erro).toBeInstanceOf(ErroAcessoNegado);
  });
});

describe('Coordenador', () => {
  beforeEach(async () => {
    await entrarComo('coordenador'); // Ana Paula Ribeiro (#1)
  });

  it('vê a mesma solicitação que o supervisor e decide no lugar dele', async () => {
    expect(await servicos.solicitacoes.buscarPorId(3)).not.toBeNull(); // encaminhada a Bruno
    const decidida = await servicos.solicitacoes.aprovar(3);
    expect(decidida.decididaPor).toMatchObject({ nomeUsuario: 'coordenador', isCoordenador: true });
    expect(decidida.supervisor.id).toBe(2);
  });

  it('exige nome completo único, sem diferenciar maiúsculas', async () => {
    expect(await falha(servicos.colaboradores.criar({ nome: 'carla mendes', respondeAId: 2 }))).toBeInstanceOf(ErroRegraNegocio);
  });

  it('não exclui colaborador com acesso ativo', async () => {
    const ivo = await servicos.colaboradores.criar({ nome: 'Ivo Teixeira', respondeAId: 2 });
    const conta = await servicos.usuarios.criar({ colaboradorId: ivo.id, nomeUsuario: 'ivo', senhaTemporaria: 'temporaria1', isCoordenador: false });
    const erro = (await falha(servicos.colaboradores.excluir(ivo.id))) as Error;
    expect(erro.message).toMatch(/acesso ativo/);

    await servicos.usuarios.desativar(conta.id);
    await servicos.colaboradores.excluir(ivo.id);
    expect(await servicos.colaboradores.buscarPorId(ivo.id)).toBeNull();
  });

  it('não desativa o próprio acesso nem fica sem coordenador', async () => {
    expect(await falha(servicos.usuarios.desativar(1))).toBeInstanceOf(ErroRegraNegocio);
    expect(await falha(servicos.usuarios.definirCoordenador(1, false))).toBeInstanceOf(ErroRegraNegocio);
  });

  it('cria acesso com senha temporária e o desativa', async () => {
    const conta = await servicos.usuarios.criar({ colaboradorId: 8, nomeUsuario: 'henrique', senhaTemporaria: 'temporaria1', isCoordenador: false });
    expect(conta).toMatchObject({ precisaTrocarSenha: true, nivel: 'colaborador', ativo: true });
    expect(await falha(servicos.usuarios.criar({ colaboradorId: 8, nomeUsuario: 'outro', senhaTemporaria: 'temporaria1', isCoordenador: false }))).toBeInstanceOf(
      ErroRegraNegocio,
    );

    expect((await servicos.usuarios.desativar(conta.id)).ativo).toBe(false);
    await servicos.autenticacao.sair();
    expect(await falha(servicos.autenticacao.entrar('henrique', 'temporaria1'))).toBeInstanceOf(ErroNaoAutenticado);
  });
});
