import { criarServicos } from './criarServicos';
import type { Servicos } from './contracts/servicos';
import { criarGatewayHttp } from './http/gatewayHttp';
import { criarArmazenamentoEmMemoria, type Armazenamento } from './mocks/banco';
import { CREDENCIAIS_DEMONSTRACAO } from './mocks/dadosDemonstracao';
import { criarGatewayMock } from './mocks/gatewayMock';

export type FonteDeDados = 'mock' | 'api';

export function fonteDeDadosConfigurada(): FonteDeDados {
  return import.meta.env.VITE_DATA_SOURCE === 'api' ? 'api' : 'mock';
}

/** `localStorage` pode estar bloqueado (modo privado, políticas); cai para memória. */
function armazenamentoDoNavegador(): Armazenamento {
  try {
    const chave = '__teste_armazenamento__';
    window.localStorage.setItem(chave, chave);
    window.localStorage.removeItem(chave);
    return window.localStorage;
  } catch {
    return criarArmazenamentoEmMemoria();
  }
}

/** Escolhe a implementação por `VITE_DATA_SOURCE`. As telas não sabem qual está ativa. */
export function criarServicosConfigurados(): Servicos {
  if (fonteDeDadosConfigurada() === 'api') {
    return criarServicos(criarGatewayHttp(import.meta.env.VITE_API_URL ?? 'http://localhost:5165'));
  }
  const mock = criarGatewayMock({ armazenamento: armazenamentoDoNavegador(), latenciaMs: 450 });
  return criarServicos(mock, {
    demonstracao: { restaurarDados: mock.restaurarDadosDemonstracao, credenciais: CREDENCIAIS_DEMONSTRACAO },
  });
}

export type { Servicos } from './contracts/servicos';
