import { describe, expect, it } from 'vitest';
import type { Colaborador, Periodo, Projeto, Solicitacao } from '../entities';
import { StatusSolicitacao } from '../enums/statusSolicitacao';
import { detectarConflitos } from './conflito';
import { duracaoEmDias, seSobrepoem, validarIntervalo } from './periodo';
import { calcularTotalDias, validarRegrasSolicitacao } from './solicitacao';
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

  it('aceita de 10 a 30 dias', () => {
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-25' })).toEqual([]);
    expect(validarIntervalo({ inicio: '2026-10-01', retorno: '2026-10-31' })).toEqual([]);
  });

  it('rejeita retorno anterior ou igual ao início', () => {
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-15' })).toHaveLength(1);
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-10' })).toHaveLength(1);
  });

  it('rejeita fora do intervalo de 10 a 30 dias', () => {
    expect(validarIntervalo({ inicio: '2026-10-15', retorno: '2026-10-24' })[0]).toMatch(/mínimo/);
    expect(validarIntervalo({ inicio: '2026-10-01', retorno: '2026-11-01' })[0]).toMatch(/máximo/);
  });

  it('não considera sobreposição entre períodos adjacentes', () => {
    const a = { inicio: '2026-10-01', retorno: '2026-10-15' };
    expect(seSobrepoem(a, { inicio: '2026-10-15', retorno: '2026-10-30' })).toBe(false);
    expect(seSobrepoem(a, { inicio: '2026-10-14', retorno: '2026-10-30' })).toBe(true);
    expect(seSobrepoem(a, { inicio: '2026-09-20', retorno: '2026-10-01' })).toBe(false);
  });
});

describe('regras da Solicitação', () => {
  it('exige de 1 a 3 períodos', () => {
    expect(validarRegrasSolicitacao({ quantidadePeriodos: 0, totalDias: 0, abono: false })).toHaveLength(1);
    expect(validarRegrasSolicitacao({ quantidadePeriodos: 3, totalDias: 45, abono: false })).toEqual([]);
    expect(validarRegrasSolicitacao({ quantidadePeriodos: 4, totalDias: 60, abono: false })).toHaveLength(1);
  });

  it('limita abono a 2 períodos e 20 dias', () => {
    expect(validarRegrasSolicitacao({ quantidadePeriodos: 2, totalDias: 20, abono: true })).toEqual([]);
    expect(validarRegrasSolicitacao({ quantidadePeriodos: 3, totalDias: 20, abono: true })).toHaveLength(1);
    expect(validarRegrasSolicitacao({ quantidadePeriodos: 2, totalDias: 21, abono: true })).toHaveLength(1);
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
  const pessoa = (id: number): Colaborador => ({ id, nome: `P${id}`, isCoordenador: false });
  const coordenador = { ...pessoa(99), isCoordenador: true };
  const periodo = (id: number, idColaborador: number, inicio: string, retorno: string): Periodo => ({
    id,
    idColaborador,
    dataInicio: `${inicio}T00:00:00`,
    dataFim: `${retorno}T00:00:00`,
  });
  const solicitacao = (id: number, colaboradorId: number, periodos: Periodo[], status: StatusSolicitacao = StatusSolicitacao.EmAnalise): Solicitacao => ({
    id,
    colaborador: pessoa(colaboradorId),
    coordenador,
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
