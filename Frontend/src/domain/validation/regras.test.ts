import { describe, expect, it } from 'vitest';
import type { Colaborador, Periodo, Projeto, Solicitacao } from '../entities';
import { StatusSolicitacao } from '../enums/statusSolicitacao';
import { detectarConflitos } from './conflito';
import { duracaoEmDias, seSobrepoem, validarIntervalo } from './periodo';
import { ehFeriado, iniciaAntesDeDescanso, pascoa } from './feriados';
import { calcularTotalDias, saldoDoAno, validarRegrasSolicitacao } from './solicitacao';
import { dataISODeDateTime, dateTimeDeDataISO, formatarData } from '@/lib/datas';

describe('datas', () => {
  it('converte DateTime da API para DataISO sem depender de fuso', () => {
    expect(dataISODeDateTime('2026-10-15T00:00:00')).toBe('2026-10-15');
    expect(dataISODeDateTime('2026-10-15T23:30:00-03:00')).toBe('2026-10-15');
    expect(dateTimeDeDataISO('2026-10-15')).toBe('2026-10-15T00:00:00');
  });

  it('exibe no formato brasileiro', () => {
    expect(formatarData('2026-10-05')).toBe('05/10/2026');
  });
});

describe('Período', () => {
  it('conta a duração como Retorno − Início', () => {
    expect(duracaoEmDias({ inicio: '2026-10-15', retorno: '2026-10-25' })).toBe(10);
  });

  it('aceita de 5 a 30 dias', () => {
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-20' })).toEqual([]);
    expect(validarIntervalo({ inicio: '2026-10-01', retorno: '2026-10-31' })).toEqual([]);
  });

  it('rejeita retorno anterior ou igual ao início', () => {
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-15' })).toHaveLength(1);
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-10' })).toHaveLength(1);
  });

  it('rejeita fora do intervalo de 5 a 30 dias', () => {
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-19' })[0]).toMatch(/mínimo/);
    expect(validarIntervalo({ inicio: '2026-10-01', retorno: '2026-11-01' })[0]).toMatch(/máximo/);
  });

  it('não começa nos 2 dias antes de domingo ou feriado (CLT, art. 134, §3º)', () => {
    expect(validarIntervalo({ inicio: '2026-10-30', retorno: '2026-11-13' })[0]).toMatch(/domingo ou feriado/); // sexta
    expect(validarIntervalo({ inicio: '2026-10-31', retorno: '2026-11-14' })[0]).toMatch(/domingo ou feriado/); // sábado
    expect(validarIntervalo({ inicio: '2026-11-18', retorno: '2026-12-02' })[0]).toMatch(/domingo ou feriado/); // 20/11 em 2 dias
    expect(validarIntervalo({ inicio: '2026-10-26', retorno: '2026-11-09' })).toEqual([]); // segunda
  });

  it('não considera sobreposição entre períodos adjacentes', () => {
    const a = { inicio: '2026-10-01', retorno: '2026-10-15' };
    expect(seSobrepoem(a, { inicio: '2026-10-15', retorno: '2026-10-30' })).toBe(false);
    expect(seSobrepoem(a, { inicio: '2026-10-14', retorno: '2026-10-30' })).toBe(true);
    expect(seSobrepoem(a, { inicio: '2026-09-20', retorno: '2026-10-01' })).toBe(false);
  });
});

describe('feriados (nacionais e de Belo Horizonte)', () => {
  it('calcula a Páscoa', () => {
    expect(pascoa(2026)).toBe('2026-04-05');
    expect(pascoa(2027)).toBe('2027-03-28');
  });

  it('inclui os municipais de BH e não o Carnaval', () => {
    expect(ehFeriado('2026-11-20')).toBe(true); // Consciência Negra
    expect(ehFeriado('2026-08-15')).toBe(true); // Assunção
    expect(ehFeriado('2026-12-08')).toBe(true); // Imaculada Conceição
    expect(ehFeriado('2026-04-03')).toBe(true); // Sexta-feira da Paixão
    expect(ehFeriado('2026-06-04')).toBe(true); // Corpus Christi
    expect(ehFeriado('2026-02-17')).toBe(false); // Carnaval
    expect(iniciaAntesDeDescanso('2026-10-26')).toBe(false);
  });
});

describe('regras da Solicitação (CLT)', () => {
  const periodo = (id: number, inicio: string, dias: number): Periodo => ({
    id,
    idColaborador: 1,
    dataInicio: `${inicio}T00:00:00`,
    dataFim: `${new Date(Date.parse(inicio) + dias * 86400000).toISOString().slice(0, 10)}T00:00:00`,
  });
  const ja = (id: number, periodos: Periodo[], abono = false, status: StatusSolicitacao = StatusSolicitacao.EmAnalise) =>
    ({ id, colaborador: { id: 1 }, status, abono, periodos }) as Solicitacao;
  const saldo = (pedido: Periodo[], anteriores: Solicitacao[] = [], abono = false) => saldoDoAno(anteriores, 1, pedido, abono)!;

  it('cada pedido tem de 1 a 3 períodos de pelo menos 5 dias', () => {
    expect(validarRegrasSolicitacao({ duracoes: [15] })).toEqual([]);
    expect(validarRegrasSolicitacao({ duracoes: [] })).toHaveLength(1);
    expect(validarRegrasSolicitacao({ duracoes: [14, 6, 5, 5] })[0].mensagem).toMatch(/1 a 3 períodos/);
    expect(validarRegrasSolicitacao({ duracoes: [10, 4] })[0].mensagem).toMatch(/mínimo 5 dias/);
  });

  it('aceita pedir as férias em partes e mostra o saldo do ano', () => {
    const primeiro = saldo([periodo(1, '2027-01-04', 15)]);
    expect(primeiro).toMatchObject({ ano: 2027, diasAnteriores: 0, diasDoPedido: 15, restam: 15, limite: 30, violacoes: [] });
    expect(saldo([periodo(2, '2027-08-02', 15)], [ja(9, [periodo(1, '2027-01-04', 15)])])).toMatchObject({ diasAnteriores: 15, restam: 0, violacoes: [] });
  });

  it('no ano, no máximo 30 dias e 3 períodos; recusadas e outros anos não contam', () => {
    const anterior = ja(9, [periodo(1, '2027-01-04', 20)]);
    expect(saldo([periodo(2, '2027-08-02', 15)], [anterior]).violacoes[0].mensagem).toMatch(/Seriam 35 dias de férias em 2027/);
    expect(saldo([periodo(2, '2028-01-03', 30)], [anterior]).violacoes).toEqual([]);
    expect(saldo([periodo(2, '2027-08-02', 30)], [{ ...anterior, status: StatusSolicitacao.Recusada }]).violacoes).toEqual([]);
    const tres = ja(9, [periodo(1, '2027-01-04', 14), periodo(2, '2027-03-01', 5), periodo(3, '2027-05-03', 5)]);
    expect(saldo([periodo(4, '2027-08-02', 5)], [tres]).violacoes[0].mensagem).toMatch(/4 períodos/);
  });

  it('precisa sobrar espaço para um período de 14 dias', () => {
    expect(saldo([periodo(1, '2027-03-01', 10)])).toMatchObject({ faltaPeriodoPrincipal: true, violacoes: [] });
    expect(saldo([periodo(2, '2027-05-03', 10)], [ja(9, [periodo(1, '2027-03-01', 10)])]).violacoes[0].mensagem).toMatch(/14 dias/);
  });

  it('abono em qualquer pedido do ano baixa o limite para 20 dias', () => {
    const anterior = ja(9, [periodo(1, '2027-01-04', 14)]);
    expect(saldo([periodo(2, '2027-07-05', 6)], [anterior], true).violacoes).toEqual([]);
    expect(saldo([periodo(2, '2027-07-05', 10)], [anterior], true).violacoes[0]).toMatchObject({ campo: 'abono' });
    expect(saldo([periodo(2, '2027-07-05', 10)], [{ ...anterior, abono: true }]).limite).toBe(20);
  });

  it('calcula o Total de Dias a partir dos períodos', () => {
    const periodos: Periodo[] = [
      { id: 1, idColaborador: 1, dataInicio: '2026-10-01T00:00:00', dataFim: '2026-10-11T00:00:00' },
      { id: 2, idColaborador: 1, dataInicio: '2026-11-01T00:00:00', dataFim: '2026-11-13T00:00:00' },
    ];
    expect(calcularTotalDias(periodos)).toBe(22);
  });
});

describe('detecção de Conflito', () => {
  const pessoa = (id: number): Colaborador => ({ id, nome: `P${id}`, isSupervisor: false });
  const supervisor = { ...pessoa(99), isSupervisor: true };
  const periodo = (id: number, idColaborador: number, inicio: string, retorno: string): Periodo => ({
    id,
    idColaborador,
    dataInicio: `${inicio}T00:00:00`,
    dataFim: `${retorno}T00:00:00`,
  });
  const solicitacao = (id: number, colaboradorId: number, periodos: Periodo[], status: StatusSolicitacao = StatusSolicitacao.EmAnalise): Solicitacao => ({
    id,
    colaborador: pessoa(colaboradorId),
    supervisor,
    periodos,
    status,
    criadaEm: '2026-10-01T10:00:00-03:00',
    observacao: null,
    totalDias: calcularTotalDias(periodos),
    abono: false,
    isPessoaCritica: false,
  });
  const projeto: Projeto = { id: 1, nome: 'Alfa', colaboradores: [pessoa(1), pessoa(2), pessoa(3)], pessoasCriticas: [pessoa(2)] };

  const alvo = solicitacao(1, 1, [periodo(1, 1, '2026-10-10', '2026-10-25')]);

  it('detecta sobreposição com pessoa crítica do mesmo projeto', () => {
    const outra = solicitacao(2, 2, [periodo(2, 2, '2026-10-20', '2026-11-05')]);
    const conflitos = detectarConflitos(alvo, [alvo, outra], [projeto]);
    expect(conflitos).toHaveLength(1);
    expect(conflitos[0].pessoaCritica.id).toBe(2);
  });

  it('ignora solicitações recusadas', () => {
    const outra = solicitacao(2, 2, [periodo(2, 2, '2026-10-20', '2026-11-05')], StatusSolicitacao.Recusada);
    expect(detectarConflitos(alvo, [alvo, outra], [projeto])).toEqual([]);
  });

  it('ignora quem não é pessoa crítica e projetos dos quais o solicitante não participa', () => {
    const naoCritica = solicitacao(2, 3, [periodo(2, 3, '2026-10-20', '2026-11-05')]);
    const outroProjeto: Projeto = { id: 2, nome: 'Beta', colaboradores: [pessoa(4)], pessoasCriticas: [pessoa(4)] };
    const deOutroProjeto = solicitacao(3, 4, [periodo(3, 4, '2026-10-20', '2026-11-05')]);
    expect(detectarConflitos(alvo, [alvo, naoCritica, deOutroProjeto], [projeto, outroProjeto])).toEqual([]);
  });

  it('não considera períodos adjacentes como conflito', () => {
    const outra = solicitacao(2, 2, [periodo(2, 2, '2026-10-25', '2026-11-05')]);
    expect(detectarConflitos(alvo, [alvo, outra], [projeto])).toEqual([]);
  });
});
