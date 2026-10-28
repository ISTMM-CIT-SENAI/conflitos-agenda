import type { Periodo } from '@/domain/entities';
import { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { dateTimeDeDataISO, diferencaEmDias, hojeISO, parseDataISO, somarDias, type DataISO } from '@/lib/datas';
import type { CredencialDemonstracao } from '../contracts/servicos';
import {
  VERSAO_BANCO,
  hashSenhaDemonstracao,
  type BancoMock,
  type ProjetoRegistro,
  type SolicitacaoRegistro,
  type UsuarioRegistro,
} from './banco';

export const SENHA_DEMONSTRACAO = 'demo123';

/** Um usuário fictício por nível de acesso, mostrados na tela de login. */
export const CREDENCIAIS_DEMONSTRACAO: CredencialDemonstracao[] = [
  { nomeUsuario: 'coordenador', senha: SENHA_DEMONSTRACAO, nivel: 'coordenador', nome: 'Ana Paula Ribeiro' },
  { nomeUsuario: 'supervisor', senha: SENHA_DEMONSTRACAO, nivel: 'supervisor', nome: 'Bruno Carvalho' },
  { nomeUsuario: 'colaborador', senha: SENHA_DEMONSTRACAO, nivel: 'colaborador', nome: 'Carla Mendes' },
];

/**
 * Massa de demonstração com datas relativas a `hoje`, para que sempre existam ausências
 * futuras. Os períodos começam numa segunda-feira (a CLT proíbe começar nos 2 dias antes do
 * domingo). Hierarquia: Ana (Coordenadora) ← Bruno (Supervisor) ← demais. Cenários:
 * - #1 × #2: Carla e Diego, pessoas críticas do Portal do Cliente, com períodos sobrepostos (conflito);
 * - #5: abono válido (14 + 6 = 20 dias);
 * - #5 × #8: períodos adjacentes de pessoas críticas do mesmo projeto (não é conflito);
 * - #6: recusada pela Coordenadora no lugar do supervisor encaminhado;
 * - #7: solicitação inválida (4 períodos num só pedido) para exercitar as mensagens de erro;
 * - três usuários: coordenador (Ana Paula), supervisor (Bruno) e colaborador (Carla), senha "demo123".
 */
export function criarDadosDemonstracao(hoje: DataISO = hojeISO()): BancoMock {
  // Próxima segunda-feira: os deslocamentos em múltiplos de 7 caem sempre numa segunda.
  const segunda = somarDias(hoje, ((8 - parseDataISO(hoje).getDay()) % 7) || 7);
  const dia = (deslocamento: number) => dateTimeDeDataISO(somarDias(segunda, deslocamento));
  const criadaEm = (diasAtras: number, hora: string) => `${somarDias(hoje, -diasAtras)}T${hora}:00-03:00`;

  const periodo = (id: number, idColaborador: number, inicio: number, dias: number): Periodo => ({
    id,
    idColaborador,
    dataInicio: dia(inicio),
    dataFim: dia(inicio + dias),
  });

  const periodos: Periodo[] = [
    periodo(1, 3, 7, 30),
    periodo(2, 4, 14, 30),
    periodo(3, 5, 140, 30),
    periodo(4, 8, -35, 30),
    periodo(5, 7, 42, 14),
    periodo(6, 7, 91, 6),
    periodo(7, 8, 21, 30),
    periodo(8, 9, 70, 12),
    periodo(9, 9, 84, 12),
    periodo(10, 9, 98, 12),
    periodo(11, 1, 119, 10),
    periodo(12, 6, 56, 30),
    periodo(13, 9, 112, 9),
  ];

  const projetos: ProjetoRegistro[] = [
    { id: 1, nome: 'Portal do Cliente', colaboradorIds: [1, 3, 4, 5], pessoaCriticaIds: [3, 4] },
    { id: 2, nome: 'Integração ERP', colaboradorIds: [2, 5, 6, 7], pessoaCriticaIds: [6, 7] },
    { id: 3, nome: 'App Mobile', colaboradorIds: [1, 2, 3, 8], pessoaCriticaIds: [8] },
  ];

  const totalDias = (ids: number[]) =>
    ids.reduce((total, id) => {
      const p = periodos.find((x) => x.id === id);
      return p ? total + diferencaEmDias(p.dataInicio.slice(0, 10), p.dataFim.slice(0, 10)) : total;
    }, 0);
  const critico = (colaboradorId: number) => projetos.some((p) => p.pessoaCriticaIds.includes(colaboradorId));

  const solicitacao = (
    dados: Omit<SolicitacaoRegistro, 'totalDias' | 'isPessoaCritica' | 'observacao' | 'abono' | 'decididaPorId' | 'decididaEm'> &
      Partial<Pick<SolicitacaoRegistro, 'observacao' | 'abono' | 'decididaPorId' | 'decididaEm'>>,
  ): SolicitacaoRegistro => ({
    observacao: null,
    abono: false,
    decididaPorId: null,
    decididaEm: null,
    ...dados,
    totalDias: totalDias(dados.periodoIds),
    isPessoaCritica: critico(dados.colaboradorId),
  });

  const solicitacoes: SolicitacaoRegistro[] = [
    solicitacao({ id: 1, colaboradorId: 3, supervisorId: 2, periodoIds: [1], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(6, '09:15') }),
    solicitacao({ id: 2, colaboradorId: 4, supervisorId: 2, periodoIds: [2], status: StatusSolicitacao.ConflitoEncontrado, criadaEm: criadaEm(5, '14:30') }),
    solicitacao({ id: 3, colaboradorId: 5, supervisorId: 2, periodoIds: [3], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(2, '10:00'), observacao: 'Viagem de fim de ano.' }),
    solicitacao({ id: 4, colaboradorId: 8, supervisorId: 2, periodoIds: [4], status: StatusSolicitacao.Aprovada, criadaEm: criadaEm(60, '08:45'), decididaPorId: 2, decididaEm: criadaEm(58, '10:30') }),
    solicitacao({ id: 5, colaboradorId: 7, supervisorId: 1, periodoIds: [5, 6], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(4, '16:20'), abono: true }),
    solicitacao({ id: 6, colaboradorId: 8, supervisorId: 2, periodoIds: [7], status: StatusSolicitacao.Recusada, criadaEm: criadaEm(10, '11:05'), decididaPorId: 1, decididaEm: criadaEm(9, '15:20'), observacao: 'Período coincide com a entrega da versão 2.0 do App Mobile.' }),
    solicitacao({ id: 7, colaboradorId: 9, supervisorId: 2, periodoIds: [8, 9, 10, 13], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(1, '13:40'), abono: true, observacao: 'Registro antigo, gravado antes das regras da CLT.' }),
    solicitacao({ id: 8, colaboradorId: 6, supervisorId: 1, periodoIds: [12], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(3, '09:50') }),
  ];

  const usuario = (id: number, nomeUsuario: string, colaboradorId: number, isCoordenador = false): UsuarioRegistro => ({
    id,
    nomeUsuario,
    senhaHash: hashSenhaDemonstracao(SENHA_DEMONSTRACAO),
    colaboradorId,
    isCoordenador,
    ativo: true,
    // Na demonstração, a troca de senha obrigatória do primeiro acesso é dispensada.
    precisaTrocarSenha: false,
    tentativasFalhas: 0,
    bloqueadoAte: null,
  });
  const usuarios: UsuarioRegistro[] = [
    usuario(1, 'coordenador', 1, true),
    usuario(2, 'supervisor', 2),
    usuario(3, 'colaborador', 3),
  ];

  return {
    versao: VERSAO_BANCO,
    colaboradores: [
      { id: 1, nome: 'Ana Paula Ribeiro', isSupervisor: true, respondeAId: null },
      { id: 2, nome: 'Bruno Carvalho', isSupervisor: true, respondeAId: 1 },
      { id: 3, nome: 'Carla Mendes', isSupervisor: false, respondeAId: 2 },
      { id: 4, nome: 'Diego Fernandes', isSupervisor: false, respondeAId: 2 },
      { id: 5, nome: 'Eduarda Lima', isSupervisor: false, respondeAId: 2 },
      { id: 6, nome: 'Felipe Araújo', isSupervisor: false, respondeAId: 1 },
      { id: 7, nome: 'Gabriela Rocha', isSupervisor: false, respondeAId: 1 },
      { id: 8, nome: 'Henrique Costa', isSupervisor: false, respondeAId: 2 },
      { id: 9, nome: 'Igor Santos', isSupervisor: false, respondeAId: 2 },
    ],
    usuarios,
    periodos,
    projetos,
    solicitacoes,
  };
}
