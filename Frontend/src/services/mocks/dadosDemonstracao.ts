import type { Periodo } from '@/domain/entities';
import { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { dateTimeDeDataISO, diferencaEmDias, hojeISO, somarDias, type DataISO } from '@/lib/datas';
import { VERSAO_BANCO, type BancoMock, type ProjetoRegistro, type SolicitacaoRegistro } from './banco';

/**
 * Massa de demonstração com datas relativas a `hoje`, para que sempre existam
 * ausências futuras. Cenários cobertos:
 * - #1 × #2: Carla e Diego, ambos pessoas críticas do Portal do Cliente, com períodos sobrepostos (conflito);
 * - #5: abono válido (2 períodos, 20 dias);
 * - #5 × #8: períodos adjacentes de pessoas críticas do mesmo projeto (não é conflito);
 * - #7: solicitação inválida (abono com 3 períodos e 36 dias) para exercitar as mensagens de erro;
 * - os quatro status representados.
 */
export function criarDadosDemonstracao(hoje: DataISO = hojeISO()): BancoMock {
  const dia = (deslocamento: number) => dateTimeDeDataISO(somarDias(hoje, deslocamento));
  const criadaEm = (diasAtras: number, hora: string) => `${somarDias(hoje, -diasAtras)}T${hora}:00-03:00`;

  const periodo = (id: number, idColaborador: number, inicio: number, retorno: number): Periodo => ({
    id,
    idColaborador,
    dataInicio: dia(inicio),
    dataFim: dia(retorno),
  });

  const periodos: Periodo[] = [
    periodo(1, 3, 10, 25),
    periodo(2, 4, 20, 35),
    periodo(3, 5, 140, 152),
    periodo(4, 6, -30, -15),
    periodo(5, 7, 40, 50),
    periodo(6, 7, 60, 70),
    periodo(7, 8, 15, 30),
    periodo(8, 3, 60, 72),
    periodo(9, 3, 80, 92),
    periodo(10, 3, 100, 112),
    periodo(11, 1, 120, 130),
    periodo(12, 6, 25, 40),
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
    dados: Omit<SolicitacaoRegistro, 'totalDias' | 'isPessoaCritica' | 'observacao' | 'abono'> &
      Partial<Pick<SolicitacaoRegistro, 'observacao' | 'abono'>>,
  ): SolicitacaoRegistro => ({
    observacao: null,
    abono: false,
    ...dados,
    totalDias: totalDias(dados.periodoIds),
    isPessoaCritica: critico(dados.colaboradorId),
  });

  const solicitacoes: SolicitacaoRegistro[] = [
    solicitacao({ id: 1, colaboradorId: 3, coordenadorId: 1, periodoIds: [1], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(6, '09:15') }),
    solicitacao({ id: 2, colaboradorId: 4, coordenadorId: 1, periodoIds: [2], status: StatusSolicitacao.ConflitoEncontrado, criadaEm: criadaEm(5, '14:30') }),
    solicitacao({ id: 3, colaboradorId: 5, coordenadorId: 2, periodoIds: [3], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(2, '10:00'), observacao: 'Viagem de fim de ano.' }),
    solicitacao({ id: 4, colaboradorId: 6, coordenadorId: 2, periodoIds: [4], status: StatusSolicitacao.Aprovada, criadaEm: criadaEm(60, '08:45') }),
    solicitacao({ id: 5, colaboradorId: 7, coordenadorId: 2, periodoIds: [5, 6], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(4, '16:20'), abono: true }),
    solicitacao({ id: 6, colaboradorId: 8, coordenadorId: 1, periodoIds: [7], status: StatusSolicitacao.Recusada, criadaEm: criadaEm(10, '11:05'), observacao: 'Período coincide com a entrega da versão 2.0 do App Mobile.' }),
    solicitacao({ id: 7, colaboradorId: 3, coordenadorId: 2, periodoIds: [8, 9, 10], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(1, '13:40'), abono: true, observacao: 'Registro antigo, gravado antes das regras de abono.' }),
    solicitacao({ id: 8, colaboradorId: 6, coordenadorId: 2, periodoIds: [12], status: StatusSolicitacao.EmAnalise, criadaEm: criadaEm(3, '09:50') }),
  ];

  return {
    versao: VERSAO_BANCO,
    colaboradores: [
      { id: 1, nome: 'Ana Paula Ribeiro', email: 'ana.ribeiro@example.com', isCoordenador: true },
      { id: 2, nome: 'Bruno Carvalho', email: 'bruno.carvalho@example.com', isCoordenador: true },
      { id: 3, nome: 'Carla Mendes', email: 'carla.mendes@example.com', isCoordenador: false },
      { id: 4, nome: 'Diego Fernandes', email: 'diego.fernandes@example.com', isCoordenador: false },
      { id: 5, nome: 'Eduarda Lima', email: 'eduarda.lima@example.com', isCoordenador: false },
      { id: 6, nome: 'Felipe Araújo', email: 'felipe.araujo@example.com', isCoordenador: false },
      { id: 7, nome: 'Gabriela Rocha', email: 'gabriela.rocha@example.com', isCoordenador: false },
      { id: 8, nome: 'Henrique Costa', email: 'henrique.costa@example.com', isCoordenador: false },
    ],
    periodos,
    projetos,
    solicitacoes,
  };
}
