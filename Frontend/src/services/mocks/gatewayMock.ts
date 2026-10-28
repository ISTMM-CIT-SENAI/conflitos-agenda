import {
  ehCoordenador,
  podeDecidir,
  podeExcluirSolicitacao,
  podeGerenciarPeriodo,
  podeValidarConflito,
  podeVerSolicitacao,
  validarNomeUsuario,
  validarSenha,
} from '@/domain/acesso';
import type { Colaborador, ContaUsuario, Periodo, Projeto, Solicitacao, UsuarioLogado } from '@/domain/entities';
import { StatusSolicitacao, isStatusFinal, isStatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { detectarConflitos, mensagemDeConflito } from '@/domain/validation/conflito';
import { duracaoDoPeriodo, intervaloDoPeriodo, validarIntervalo } from '@/domain/validation/periodo';
import {
  calcularTotalDias,
  saldoDoAno,
  validarRegrasSolicitacao,
} from '@/domain/validation/solicitacao';
import type { ApiGateway, ColaboradorDto, PeriodoDto, SolicitacaoDto } from '../contracts/api';
import {
  ErroAcessoNegado,
  ErroNaoAutenticado,
  ErroNaoEncontrado,
  ErroRegraNegocio,
  ErroTrocaSenhaObrigatoria,
} from '../erros';
import {
  VERSAO_BANCO,
  hashSenhaDemonstracao,
  proximoId,
  type Armazenamento,
  type BancoMock,
  type ColaboradorRegistro,
  type ProjetoRegistro,
  type SolicitacaoRegistro,
  type UsuarioRegistro,
} from './banco';
import { criarDadosDemonstracao } from './dadosDemonstracao';

export const CHAVE_ARMAZENAMENTO = 'conflitos-agenda:banco-mock';
export const CHAVE_SESSAO = 'conflitos-agenda:sessao-mock';

/** Mesmas regras da API: sessão de 8 horas, bloqueio de 15 minutos após 5 erros. */
const DURACAO_SESSAO_MS = 8 * 60 * 60 * 1000;
const MAXIMO_TENTATIVAS = 5;
const DURACAO_BLOQUEIO_MS = 15 * 60 * 1000;
const MENSAGEM_CREDENCIAIS_INVALIDAS = 'Usuário ou senha inválidos.';

export interface OpcoesGatewayMock {
  armazenamento: Armazenamento;
  /** Latência simulada por operação, para exercitar os estados de carregamento. */
  latenciaMs?: number;
  criarDadosIniciais?: () => BancoMock;
  agora?: () => Date;
}

export interface GatewayMock extends ApiGateway {
  restaurarDadosDemonstracao(): Promise<void>;
}

interface Sessao {
  usuarioId: number;
  expiraEm: number;
}

function isBancoValido(valor: unknown): valor is BancoMock {
  if (typeof valor !== 'object' || valor === null) return false;
  const banco = valor as Partial<BancoMock>;
  return (
    banco.versao === VERSAO_BANCO &&
    Array.isArray(banco.colaboradores) &&
    Array.isArray(banco.usuarios) &&
    Array.isArray(banco.periodos) &&
    Array.isArray(banco.projetos) &&
    Array.isArray(banco.solicitacoes)
  );
}

const normalizar = (texto: string) => texto.trim().toLocaleLowerCase('pt-BR');

/**
 * Implementação do `ApiGateway` persistida em `localStorage`. Reproduz as respostas,
 * validações e permissões da API (400/401/403/404) para que as telas se comportem
 * igual quando a fonte de dados for trocada.
 */
export function criarGatewayMock({
  armazenamento,
  latenciaMs = 0,
  criarDadosIniciais = criarDadosDemonstracao,
  agora = () => new Date(),
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
    armazenamento.removeItem(CHAVE_SESSAO);
    return inicial;
  }

  function gravar(banco: BancoMock): void {
    armazenamento.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(banco));
  }

  async function esperar(): Promise<void> {
    if (latenciaMs > 0) await new Promise((resolve) => setTimeout(resolve, latenciaMs));
  }

  // --- Sessão ---

  function lerSessao(): Sessao | null {
    try {
      const sessao = JSON.parse(armazenamento.getItem(CHAVE_SESSAO) ?? 'null') as Sessao | null;
      return sessao && sessao.expiraEm > agora().getTime() ? sessao : null;
    } catch {
      return null;
    }
  }

  function iniciarSessao(usuarioId: number): void {
    const sessao: Sessao = { usuarioId, expiraEm: agora().getTime() + DURACAO_SESSAO_MS };
    armazenamento.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
  }

  function usuarioDaSessao(banco: BancoMock): UsuarioRegistro | null {
    const sessao = lerSessao();
    const usuario = sessao ? banco.usuarios.find((u) => u.id === sessao.usuarioId) : undefined;
    if (!usuario || !usuario.ativo) return null;
    // Renova a expiração a cada uso (sessão expira após 8 horas sem uso).
    iniciarSessao(usuario.id);
    return usuario;
  }

  function usuarioLogado(banco: BancoMock, usuario: UsuarioRegistro): UsuarioLogado {
    const colaborador = banco.colaboradores.find((c) => c.id === usuario.colaboradorId);
    return {
      id: usuario.id,
      nomeUsuario: usuario.nomeUsuario,
      nivel: usuario.isCoordenador ? 'coordenador' : colaborador?.isSupervisor ? 'supervisor' : 'colaborador',
      precisaTrocarSenha: usuario.precisaTrocarSenha,
      colaborador: {
        id: usuario.colaboradorId,
        nome: colaborador?.nome ?? `Colaborador #${usuario.colaboradorId}`,
        isSupervisor: colaborador?.isSupervisor ?? false,
      },
    };
  }

  function contaUsuario(banco: BancoMock, usuario: UsuarioRegistro): ContaUsuario {
    const logado = usuarioLogado(banco, usuario);
    return {
      id: usuario.id,
      nomeUsuario: usuario.nomeUsuario,
      nivel: logado.nivel,
      isCoordenador: usuario.isCoordenador,
      ativo: usuario.ativo,
      precisaTrocarSenha: usuario.precisaTrocarSenha,
      bloqueado: estaBloqueado(usuario),
      colaborador: logado.colaborador,
    };
  }

  function estaBloqueado(usuario: UsuarioRegistro): boolean {
    return usuario.bloqueadoAte !== null && new Date(usuario.bloqueadoAte).getTime() > agora().getTime();
  }

  /** Operação que exige sessão válida e senha já definida, como na API. */
  async function operar<T>(
    operacao: (banco: BancoMock, usuario: UsuarioLogado) => T,
    { gravarAoFinal = false } = {},
  ): Promise<T> {
    await esperar();
    const banco = ler();
    const registro = usuarioDaSessao(banco);
    if (!registro) throw new ErroNaoAutenticado();
    if (registro.precisaTrocarSenha) throw new ErroTrocaSenhaObrigatoria();

    const resultado = operacao(banco, usuarioLogado(banco, registro));
    if (gravarAoFinal) gravar(banco);
    return resultado === undefined ? resultado : structuredClone(resultado);
  }

  const mutar = <T>(operacao: (banco: BancoMock, usuario: UsuarioLogado) => T) =>
    operar(operacao, { gravarAoFinal: true });

  function exigirCoordenador(usuario: UsuarioLogado): void {
    if (!ehCoordenador(usuario)) throw new ErroAcessoNegado();
  }

  function encontrar<T extends { id: number }>(lista: T[], id: number, mensagem: string): T {
    const item = lista.find((x) => x.id === id);
    if (!item) throw new ErroNaoEncontrado(mensagem);
    return item;
  }

  // --- Montagem dos objetos completos, como a API devolve ---

  function colaborador(banco: BancoMock, id: number): Colaborador {
    const registro = banco.colaboradores.find((c) => c.id === id);
    if (!registro) return { id, nome: `Colaborador #${id} (excluído)`, isSupervisor: false, respondeA: null };
    const chefe = banco.colaboradores.find((c) => c.id === registro.respondeAId);
    return {
      id: registro.id,
      nome: registro.nome,
      isSupervisor: registro.isSupervisor,
      respondeA: chefe ? { id: chefe.id, nome: chefe.nome } : null,
    };
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
    const decisor = registro.decididaPorId === null ? undefined : banco.usuarios.find((u) => u.id === registro.decididaPorId);
    return {
      id: registro.id,
      colaborador: colaborador(banco, registro.colaboradorId),
      supervisor: colaborador(banco, registro.supervisorId),
      periodos: registro.periodoIds
        .map((id) => banco.periodos.find((p) => p.id === id))
        .filter((p): p is Periodo => p !== undefined),
      status: registro.status,
      criadaEm: registro.criadaEm,
      observacao: registro.observacao,
      totalDias: registro.totalDias,
      abono: registro.abono,
      isPessoaCritica: registro.isPessoaCritica,
      decididaPor: decisor
        ? {
            usuarioId: decisor.id,
            nomeUsuario: decisor.nomeUsuario,
            nomeColaborador: colaborador(banco, decisor.colaboradorId).nome,
            isCoordenador: decisor.isCoordenador,
          }
        : null,
      decididaEm: registro.decididaEm,
    };
  }

  /** Para quem não é Coordenador: os próprios períodos e as ausências planejadas dos colegas de projeto. */
  function periodosVisiveis(banco: BancoMock, usuario: UsuarioLogado): Periodo[] {
    if (ehCoordenador(usuario)) return banco.periodos;
    const colegas = new Set(
      banco.projetos
        .filter((p) => p.colaboradorIds.includes(usuario.colaborador.id))
        .flatMap((p) => p.colaboradorIds),
    );
    const planejados = new Set(
      banco.solicitacoes
        .filter((s) => s.status !== StatusSolicitacao.Recusada && colegas.has(s.colaboradorId))
        .flatMap((s) => s.periodoIds),
    );
    return banco.periodos.filter((p) => p.idColaborador === usuario.colaborador.id || planejados.has(p.id));
  }

  const resumo = (r: SolicitacaoRegistro) => ({
    status: r.status,
    colaborador: { id: r.colaboradorId },
    supervisor: { id: r.supervisorId },
  });

  // --- Validações equivalentes às da API ---

  function validarNomeColaborador(banco: BancoMock, dto: ColaboradorDto, ignorarId?: number): string {
    const nome = dto.nome.trim();
    if (nome === '') throw ErroRegraNegocio.deViolacoes([{ campo: 'nome', mensagem: 'Informe o nome completo.' }]);
    if (banco.colaboradores.some((c) => c.id !== ignorarId && normalizar(c.nome) === normalizar(nome))) {
      throw ErroRegraNegocio.deViolacoes([
        { campo: 'nome', mensagem: `Já existe um colaborador chamado "${nome}". Diferencie o nome completo.` },
      ]);
    }
    return nome;
  }

  function validarPeriodoDto(dto: PeriodoDto): void {
    const erros = validarIntervalo(intervaloDoPeriodo({ id: 0, ...dto }));
    if (erros.length > 0) throw ErroRegraNegocio.deViolacoes(erros.map((mensagem) => ({ campo: 'dataFim', mensagem })));
  }

  /** Regras da CLT para o pedido e para o saldo do ano, como `RegrasFerias.ValidarFeriasDoAno` na API. */
  function validarSolicitacaoDto(banco: BancoMock, dto: SolicitacaoDto, ignorarId?: number): void {
    const violacoes = validarRegrasSolicitacao({ duracoes: dto.periodos.map(duracaoDoPeriodo) });
    if (violacoes.length > 0) throw ErroRegraNegocio.deViolacoes(violacoes);
    if (!isStatusSolicitacao(dto.status)) throw new ErroRegraNegocio('Status inválido.');
    const todas = banco.solicitacoes.map((s) => solicitacao(banco, s));
    const doAno = saldoDoAno(todas, dto.colaborador.id, dto.periodos, dto.abono, ignorarId)?.violacoes ?? [];
    if (doAno.length > 0) throw ErroRegraNegocio.deViolacoes(doAno);
  }

  /** O supervisor encaminhado não vem do DTO: é quem o colaborador responde, e não muda depois. */
  function camposDoDto(dto: SolicitacaoDto) {
    return {
      colaboradorId: dto.colaborador.id,
      periodoIds: dto.periodos.map((p) => p.id),
      status: dto.status,
      criadaEm: dto.criadaEm,
      observacao: dto.observacao,
      totalDias: calcularTotalDias(dto.periodos),
      abono: dto.abono,
      isPessoaCritica: dto.isPessoaCritica,
    };
  }

  function validarRespondeA(banco: BancoMock, respondeAId: number | null, proprioId?: number): number | null {
    if (respondeAId === null) return null;
    if (respondeAId === proprioId) {
      throw ErroRegraNegocio.deViolacoes([{ campo: 'respondeAId', mensagem: 'O colaborador não pode responder a si mesmo.' }]);
    }
    const chefe = encontrar(banco.colaboradores, respondeAId, 'Colaborador não encontrado.');
    if (!chefe.isSupervisor) {
      throw ErroRegraNegocio.deViolacoes([{ campo: 'respondeAId', mensagem: `${chefe.nome} não é supervisor.` }]);
    }
    return chefe.id;
  }

  function contarCoordenadoresAtivos(banco: BancoMock): number {
    return banco.usuarios.filter((u) => u.isCoordenador && u.ativo).length;
  }

  return {
    restaurarDadosDemonstracao: async () => {
      await esperar();
      gravar(criarDadosIniciais());
    },

    autenticacao: {
      eu: async () => {
        await esperar();
        const banco = ler();
        const registro = usuarioDaSessao(banco);
        return registro ? usuarioLogado(banco, registro) : null;
      },
      entrar: async (nomeUsuario, senha) => {
        await esperar();
        const banco = ler();
        const registro = banco.usuarios.find((u) => normalizar(u.nomeUsuario) === normalizar(nomeUsuario));
        if (!registro || !registro.ativo) throw new ErroNaoAutenticado(MENSAGEM_CREDENCIAIS_INVALIDAS);

        const bloqueio = () => {
          const minutos = Math.max(1, Math.ceil((new Date(registro.bloqueadoAte!).getTime() - agora().getTime()) / 60000));
          return new ErroNaoAutenticado(`Muitas tentativas incorretas. Tente novamente em ${minutos} minuto(s).`);
        };
        if (estaBloqueado(registro)) throw bloqueio();

        if (registro.senhaHash !== hashSenhaDemonstracao(senha)) {
          registro.tentativasFalhas += 1;
          if (registro.tentativasFalhas >= MAXIMO_TENTATIVAS) {
            registro.bloqueadoAte = new Date(agora().getTime() + DURACAO_BLOQUEIO_MS).toISOString();
            registro.tentativasFalhas = 0;
          }
          gravar(banco);
          throw estaBloqueado(registro) ? bloqueio() : new ErroNaoAutenticado(MENSAGEM_CREDENCIAIS_INVALIDAS);
        }

        registro.tentativasFalhas = 0;
        registro.bloqueadoAte = null;
        gravar(banco);
        iniciarSessao(registro.id);
        return usuarioLogado(banco, registro);
      },
      sair: async () => {
        await esperar();
        armazenamento.removeItem(CHAVE_SESSAO);
      },
      trocarSenha: async (senhaAtual, novaSenha) => {
        await esperar();
        const banco = ler();
        const registro = usuarioDaSessao(banco);
        if (!registro) throw new ErroNaoAutenticado();
        if (registro.senhaHash !== hashSenhaDemonstracao(senhaAtual)) {
          throw ErroRegraNegocio.deViolacoes([{ campo: 'senhaAtual', mensagem: 'A senha atual está incorreta.' }]);
        }
        const erroSenha = validarSenha(novaSenha);
        if (erroSenha) throw ErroRegraNegocio.deViolacoes([{ campo: 'novaSenha', mensagem: erroSenha }]);
        if (novaSenha === senhaAtual) {
          throw ErroRegraNegocio.deViolacoes([{ campo: 'novaSenha', mensagem: 'A nova senha deve ser diferente da atual.' }]);
        }
        registro.senhaHash = hashSenhaDemonstracao(novaSenha);
        registro.precisaTrocarSenha = false;
        gravar(banco);
        return usuarioLogado(banco, registro);
      },
    },

    usuarios: {
      listar: () =>
        operar((b, eu) => {
          exigirCoordenador(eu);
          return b.usuarios.map((u) => contaUsuario(b, u));
        }),
      criar: (dto) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const erroNome = validarNomeUsuario(dto.nomeUsuario);
          if (erroNome) throw ErroRegraNegocio.deViolacoes([{ campo: 'nomeUsuario', mensagem: erroNome }]);
          const erroSenha = validarSenha(dto.senhaTemporaria);
          if (erroSenha) throw ErroRegraNegocio.deViolacoes([{ campo: 'senhaTemporaria', mensagem: erroSenha }]);
          const dono = encontrar(b.colaboradores, dto.colaboradorId, 'Colaborador não encontrado.');
          if (b.usuarios.some((u) => u.colaboradorId === dono.id)) {
            throw new ErroRegraNegocio(`${dono.nome} já possui acesso ao sistema.`);
          }
          if (b.usuarios.some((u) => normalizar(u.nomeUsuario) === normalizar(dto.nomeUsuario))) {
            throw ErroRegraNegocio.deViolacoes([
              { campo: 'nomeUsuario', mensagem: `O nome de usuário "${dto.nomeUsuario.trim()}" já está em uso.` },
            ]);
          }
          const novo: UsuarioRegistro = {
            id: proximoId(b.usuarios),
            nomeUsuario: dto.nomeUsuario.trim(),
            senhaHash: hashSenhaDemonstracao(dto.senhaTemporaria),
            colaboradorId: dono.id,
            isCoordenador: dto.isCoordenador,
            ativo: true,
            precisaTrocarSenha: true,
            tentativasFalhas: 0,
            bloqueadoAte: null,
          };
          b.usuarios.push(novo);
          return contaUsuario(b, novo);
        }),
      definirCoordenador: (id, isCoordenador) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const registro = encontrar(b.usuarios, id, 'Usuário não encontrado.');
          if (!isCoordenador && registro.isCoordenador) {
            if (registro.id === eu.id) throw new ErroRegraNegocio('Você não pode remover seu próprio acesso de coordenador.');
            if (registro.ativo && contarCoordenadoresAtivos(b) <= 1) {
              throw new ErroRegraNegocio('O sistema precisa de pelo menos um coordenador ativo.');
            }
          }
          registro.isCoordenador = isCoordenador;
          return contaUsuario(b, registro);
        }),
      redefinirSenha: (id, senhaTemporaria) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const erroSenha = validarSenha(senhaTemporaria);
          if (erroSenha) throw ErroRegraNegocio.deViolacoes([{ campo: 'senhaTemporaria', mensagem: erroSenha }]);
          const registro = encontrar(b.usuarios, id, 'Usuário não encontrado.');
          registro.senhaHash = hashSenhaDemonstracao(senhaTemporaria);
          registro.precisaTrocarSenha = true;
          registro.tentativasFalhas = 0;
          registro.bloqueadoAte = null;
          return contaUsuario(b, registro);
        }),
      desativar: (id) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const registro = encontrar(b.usuarios, id, 'Usuário não encontrado.');
          if (registro.id === eu.id) throw new ErroRegraNegocio('Você não pode desativar o seu próprio acesso.');
          if (registro.isCoordenador && registro.ativo && contarCoordenadoresAtivos(b) <= 1) {
            throw new ErroRegraNegocio('O sistema precisa de pelo menos um coordenador ativo.');
          }
          registro.ativo = false;
          return contaUsuario(b, registro);
        }),
      reativar: (id) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const registro = encontrar(b.usuarios, id, 'Usuário não encontrado.');
          registro.ativo = true;
          return contaUsuario(b, registro);
        }),
    },

    colaboradores: {
      listar: () => operar((b) => b.colaboradores.map((c) => colaborador(b, c.id))),
      buscar: (id) => operar((b) => (b.colaboradores.some((c) => c.id === id) ? colaborador(b, id) : null)),
      criar: (dto) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const novo: ColaboradorRegistro = {
            id: proximoId(b.colaboradores),
            nome: validarNomeColaborador(b, dto),
            isSupervisor: false,
            respondeAId: validarRespondeA(b, dto.respondeAId),
          };
          b.colaboradores.push(novo);
          return colaborador(b, novo.id);
        }),
      atualizar: (id, dto) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const registro = encontrar(b.colaboradores, id, 'Colaborador não encontrado.');
          registro.nome = validarNomeColaborador(b, dto, id);
          registro.respondeAId = validarRespondeA(b, dto.respondeAId, id);
          return colaborador(b, id);
        }),
      excluir: (id) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const registro = encontrar(b.colaboradores, id, 'Colaborador não encontrado.');
          const conta = b.usuarios.find((u) => u.colaboradorId === id);
          if (conta?.ativo) {
            throw new ErroRegraNegocio(
              `${registro.nome} tem acesso ativo ao sistema. Desative o usuário "${conta.nomeUsuario}" antes de excluir.`,
            );
          }
          if (conta && b.solicitacoes.some((s) => s.decididaPorId === conta.id)) {
            throw new ErroRegraNegocio('Não foi possível concluir a operação: o registro está vinculado a outros dados, como solicitações.');
          }
          b.usuarios = b.usuarios.filter((u) => u.colaboradorId !== id);
          b.colaboradores = b.colaboradores.filter((c) => c.id !== id);
          for (const p of b.projetos) {
            p.colaboradorIds = p.colaboradorIds.filter((x) => x !== id);
            p.pessoaCriticaIds = p.pessoaCriticaIds.filter((x) => x !== id);
          }
        }),
      tornarSupervisor: (id) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          encontrar(b.colaboradores, id, 'Colaborador não encontrado.').isSupervisor = true;
          return colaborador(b, id);
        }),
    },

    periodos: {
      listar: () => operar((b, eu) => periodosVisiveis(b, eu)),
      buscar: (id) => operar((b, eu) => periodosVisiveis(b, eu).find((p) => p.id === id) ?? null),
      criar: (dto) =>
        mutar((b, eu) => {
          if (!podeGerenciarPeriodo(eu, dto.idColaborador)) throw new ErroAcessoNegado('Você só pode gerenciar os seus próprios períodos.');
          validarPeriodoDto(dto);
          const novo: Periodo = { id: proximoId(b.periodos), ...dto };
          b.periodos.push(novo);
          return novo;
        }),
      atualizar: (id, dto) =>
        mutar((b, eu) => {
          const registro = encontrar(b.periodos, id, 'Período não encontrado.');
          if (!podeGerenciarPeriodo(eu, registro.idColaborador) || !podeGerenciarPeriodo(eu, dto.idColaborador)) {
            throw new ErroAcessoNegado('Você só pode gerenciar os seus próprios períodos.');
          }
          validarPeriodoDto(dto);
          Object.assign(registro, dto);
          return registro;
        }),
      excluir: (id) =>
        mutar((b, eu) => {
          const registro = encontrar(b.periodos, id, 'Período não encontrado.');
          if (!podeGerenciarPeriodo(eu, registro.idColaborador)) throw new ErroAcessoNegado('Você só pode gerenciar os seus próprios períodos.');
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
        mutar((b, eu) => {
          exigirCoordenador(eu);
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
        mutar((b, eu) => {
          exigirCoordenador(eu);
          const registro = encontrar(b.projetos, id, 'Projeto não encontrado.');
          if (dto.nome.trim() === '') throw ErroRegraNegocio.deViolacoes([{ campo: 'nome', mensagem: 'O nome é obrigatório.' }]);
          registro.nome = dto.nome;
          registro.colaboradorIds = dto.colaboradores.map((c) => c.id);
          registro.pessoaCriticaIds = dto.pessoasCriticas.map((c) => c.id);
          return projeto(b, registro);
        }),
      excluir: (id) =>
        mutar((b, eu) => {
          exigirCoordenador(eu);
          encontrar(b.projetos, id, 'Projeto não encontrado.');
          b.projetos = b.projetos.filter((p) => p.id !== id);
        }),
    },

    solicitacoes: {
      listar: () =>
        operar((b, eu) => b.solicitacoes.filter((s) => podeVerSolicitacao(eu, resumo(s))).map((s) => solicitacao(b, s))),
      buscar: (id) =>
        operar((b, eu) => {
          const registro = b.solicitacoes.find((s) => s.id === id);
          return registro && podeVerSolicitacao(eu, resumo(registro)) ? solicitacao(b, registro) : null;
        }),
      criar: (dto) =>
        mutar((b, eu) => {
          if (!ehCoordenador(eu) && dto.colaborador.id !== eu.colaborador.id) {
            throw new ErroAcessoNegado('Você só pode criar solicitações para você mesmo.');
          }
          validarSolicitacaoDto(b, dto);
          const dono = encontrar(b.colaboradores, dto.colaborador.id, 'Colaborador não encontrado.');
          const contaDoDono = b.usuarios.find((u) => u.colaboradorId === dono.id);
          // O Coordenador não responde a ninguém no sistema: a dele já nasce aprovada (aprovação feita fora dele).
          const coordenadorSemSuperior = dono.respondeAId === null && contaDoDono?.isCoordenador === true;
          if (dono.respondeAId === null && !coordenadorSemSuperior) {
            throw new ErroRegraNegocio(`${dono.nome} não tem a quem responder cadastrado. Peça ao coordenador para preencher "Responde a".`);
          }
          const novo: SolicitacaoRegistro = {
            id: proximoId(b.solicitacoes),
            ...camposDoDto(dto),
            supervisorId: dono.respondeAId ?? dono.id,
            status: coordenadorSemSuperior ? StatusSolicitacao.Aprovada : StatusSolicitacao.EmAnalise,
            decididaPorId: coordenadorSemSuperior ? contaDoDono.id : null,
            decididaEm: coordenadorSemSuperior ? agora().toISOString() : null,
          };
          b.solicitacoes.push(novo);
          return solicitacao(b, novo);
        }),
      atualizar: (id, dto) =>
        mutar((b, eu) => {
          const registro = b.solicitacoes.find((s) => s.id === id);
          if (!registro || !podeVerSolicitacao(eu, resumo(registro))) throw new ErroNaoEncontrado('Solicitação não encontrada.');

          const ehDecisao = dto.status === StatusSolicitacao.Aprovada || dto.status === StatusSolicitacao.Recusada;
          if (ehDecisao && !podeDecidir(eu, { ...resumo(registro), status: StatusSolicitacao.EmAnalise })) {
            throw new ErroAcessoNegado(
              registro.colaboradorId === eu.colaborador.id
                ? 'Você não pode aprovar ou recusar a sua própria solicitação.'
                : 'Somente o supervisor encaminhado ou o coordenador pode aprovar ou recusar esta solicitação.',
            );
          }
          const podeEditar = ehCoordenador(eu) || registro.colaboradorId === eu.colaborador.id;
          if (!podeEditar) {
            const mesmosPeriodos =
              [...registro.periodoIds].sort().join() === dto.periodos.map((p) => p.id).sort().join();
            const somenteStatus =
              dto.colaborador.id === registro.colaboradorId &&
              mesmosPeriodos &&
              dto.abono === registro.abono;
            if (!somenteStatus) throw new ErroAcessoNegado('Você só pode alterar o status desta solicitação.');
          }
          if (isStatusFinal(registro.status)) {
            throw new ErroRegraNegocio('Solicitações aprovadas ou recusadas não podem ser alteradas.');
          }

          // Como na API: trocar o colaborador deixaria a solicitação com o supervisor de outra pessoa.
          if (dto.colaborador.id !== registro.colaboradorId) {
            throw new ErroRegraNegocio('O colaborador da solicitação não pode ser trocado.');
          }
          validarSolicitacaoDto(b, dto, id);
          Object.assign(registro, camposDoDto(dto));
          if (ehDecisao) {
            registro.decididaPorId = eu.id;
            registro.decididaEm = agora().toISOString();
          }
          return solicitacao(b, registro);
        }),
      excluir: (id) =>
        mutar((b, eu) => {
          const registro = b.solicitacoes.find((s) => s.id === id);
          if (!registro || !podeVerSolicitacao(eu, resumo(registro))) throw new ErroNaoEncontrado('Solicitação não encontrada.');
          if (!podeExcluirSolicitacao(eu, resumo(registro))) {
            throw new ErroAcessoNegado(
              'Somente o próprio colaborador, antes da decisão, ou o coordenador pode excluir esta solicitação.',
            );
          }
          b.solicitacoes = b.solicitacoes.filter((s) => s.id !== id);
        }),
      validar: (id) =>
        operar((b, eu) => {
          const registro = b.solicitacoes.find((s) => s.id === id);
          if (!registro || !podeVerSolicitacao(eu, resumo(registro))) throw new ErroNaoEncontrado('Solicitação não encontrada.');
          if (!podeValidarConflito(eu, { ...resumo(registro), status: StatusSolicitacao.EmAnalise })) throw new ErroAcessoNegado();
          const alvo = solicitacao(b, registro);
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
