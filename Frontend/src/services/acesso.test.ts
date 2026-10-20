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

beforeEach(() => {
  const mock = criarGatewayMock({
    armazenamento: criarArmazenamentoEmMemoria(),
    criarDadosIniciais: () => criarDadosDemonstracao(HOJE),
  });
  servicos = criarServicos(mock, {
    demonstracao: { restaurarDados: mock.restaurarDadosDemonstracao, credenciais: CREDENCIAIS_DEMONSTRACAO },
  });
});

const entrarComo = (nomeUsuario: 'admin' | 'coordenador' | 'colaborador') =>
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
    expect((await servicos.autenticacao.entrar('ADMIN', SENHA_DEMONSTRACAO)).nivel).toBe('administrador');
    await servicos.autenticacao.sair();
    expect((await entrarComo('coordenador')).nivel).toBe('coordenador');
    await servicos.autenticacao.sair();
    expect((await entrarComo('colaborador')).nivel).toBe('colaborador');
  });

  it('usa a mesma mensagem para usuário inexistente e senha errada', async () => {
    const inexistente = (await falha(servicos.autenticacao.entrar('ninguem', 'x'))) as Error;
    const senhaErrada = (await falha(servicos.autenticacao.entrar('admin', 'errada'))) as Error;
    expect(inexistente.message).toBe('Usuário ou senha inválidos.');
    expect(senhaErrada.message).toBe(inexistente.message);
  });

  it('bloqueia após 5 tentativas erradas', async () => {
    for (let i = 0; i < 5; i++) await falha(servicos.autenticacao.entrar('admin', 'errada'));
    const erro = (await falha(entrarComo('admin'))) as Error;
    expect(erro.message).toMatch(/Muitas tentativas/);
  });

  it('exige trocar a senha temporária antes de usar o sistema', async () => {
    await entrarComo('admin');
    await servicos.usuarios.criar({ colaboradorId: 8, nomeUsuario: 'henrique', senhaTemporaria: 'temporaria1', isAdministrador: false });
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
    expect(ids).toEqual([1, 7]);
  });

  it('vê os próprios períodos e as ausências planejadas dos colegas de projeto', async () => {
    const ids = new Set((await servicos.periodos.listar()).map((p) => p.id));
    expect(ids.has(1)).toBe(true); // próprio
    expect(ids.has(2)).toBe(true); // Diego, colega do Portal do Cliente
    expect(ids.has(7)).toBe(false); // Henrique: solicitação recusada
    expect(ids.has(4)).toBe(false); // Felipe: não é colega de projeto
  });

  it('não acessa cadastros nem cria solicitação para outra pessoa', async () => {
    expect(await falha(servicos.colaboradores.criar({ nome: 'Novo' }))).toBeInstanceOf(ErroAcessoNegado);
    expect(await falha(servicos.usuarios.listar())).toBeInstanceOf(ErroAcessoNegado);
    expect(
      await falha(servicos.solicitacoes.criar({ colaboradorId: 4, coordenadorId: 2, periodoIds: [2], abono: false, observacao: '' })),
    ).toBeInstanceOf(ErroAcessoNegado);
  });

  it('não aprova a própria solicitação', async () => {
    expect(await falha(servicos.solicitacoes.aprovar(1))).toBeInstanceOf(ErroAcessoNegado);
  });

  it('só gerencia os próprios períodos', async () => {
    expect(
      await falha(servicos.periodos.criar({ idColaborador: 4, dataInicio: '2027-05-01', dataFim: '2027-05-15' })),
    ).toBeInstanceOf(ErroAcessoNegado);
  });
});

describe('Coordenador', () => {
  beforeEach(async () => {
    await entrarComo('coordenador'); // Bruno Carvalho (#2)
  });

  it('vê as solicitações atribuídas a ele', async () => {
    const ids = (await servicos.solicitacoes.listar()).map((s) => s.id).sort();
    expect(ids).toEqual([3, 4, 5, 7, 8]);
  });

  it('decide as atribuídas e a Decisão fica registrada', async () => {
    const aprovada = await servicos.solicitacoes.aprovar(3);
    expect(aprovada.status).toBe(StatusSolicitacao.Aprovada);
    expect(aprovada.decididaPor?.nomeUsuario).toBe('coordenador');
    expect(aprovada.decididaEm).toBeTruthy();
  });

  it('não vê nem decide solicitações de outro coordenador', async () => {
    expect(await servicos.solicitacoes.buscarPorId(1)).toBeNull();
  });

  it('não altera o conteúdo de uma solicitação atribuída', async () => {
    const erro = await falha(
      servicos.solicitacoes.atualizar(8, { colaboradorId: 6, coordenadorId: 1, periodoIds: [12], abono: false, observacao: '' }),
    );
    expect(erro).toBeInstanceOf(ErroAcessoNegado);
  });
});

describe('Administrador', () => {
  beforeEach(async () => {
    await entrarComo('admin'); // Ana Paula Ribeiro (#1)
  });

  it('decide no lugar do coordenador escolhido, mas não a própria solicitação', async () => {
    const decidida = await servicos.solicitacoes.aprovar(5); // coordenador escolhido: Bruno
    expect(decidida.decididaPor).toMatchObject({ nomeUsuario: 'admin', isAdministrador: true });
    expect(decidida.coordenador.id).toBe(2);

    const propria = await servicos.solicitacoes.criar({ colaboradorId: 1, coordenadorId: 2, periodoIds: [11], abono: false, observacao: '' });
    expect(await falha(servicos.solicitacoes.aprovar(propria.id))).toBeInstanceOf(ErroAcessoNegado);
  });

  it('exige nome completo único, sem diferenciar maiúsculas', async () => {
    expect(await falha(servicos.colaboradores.criar({ nome: 'carla mendes' }))).toBeInstanceOf(ErroRegraNegocio);
  });

  it('não exclui colaborador com acesso ativo', async () => {
    const ivo = await servicos.colaboradores.criar({ nome: 'Ivo Teixeira' });
    const conta = await servicos.usuarios.criar({ colaboradorId: ivo.id, nomeUsuario: 'ivo', senhaTemporaria: 'temporaria1', isAdministrador: false });
    const erro = (await falha(servicos.colaboradores.excluir(ivo.id))) as Error;
    expect(erro.message).toMatch(/acesso ativo/);

    await servicos.usuarios.desativar(conta.id);
    await servicos.colaboradores.excluir(ivo.id);
    expect(await servicos.colaboradores.buscarPorId(ivo.id)).toBeNull();
  });

  it('não desativa o próprio acesso nem fica sem administrador', async () => {
    expect(await falha(servicos.usuarios.desativar(1))).toBeInstanceOf(ErroRegraNegocio);
    expect(await falha(servicos.usuarios.definirAdministrador(1, false))).toBeInstanceOf(ErroRegraNegocio);
  });

  it('cria acesso com senha temporária e o desativa', async () => {
    const conta = await servicos.usuarios.criar({ colaboradorId: 8, nomeUsuario: 'henrique', senhaTemporaria: 'temporaria1', isAdministrador: false });
    expect(conta).toMatchObject({ precisaTrocarSenha: true, nivel: 'colaborador', ativo: true });
    expect(await falha(servicos.usuarios.criar({ colaboradorId: 8, nomeUsuario: 'outro', senhaTemporaria: 'temporaria1', isAdministrador: false }))).toBeInstanceOf(
      ErroRegraNegocio,
    );

    expect((await servicos.usuarios.desativar(conta.id)).ativo).toBe(false);
    await servicos.autenticacao.sair();
    expect(await falha(servicos.autenticacao.entrar('henrique', 'temporaria1'))).toBeInstanceOf(ErroNaoAutenticado);
  });
});
