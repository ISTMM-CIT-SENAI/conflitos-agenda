export interface ValoresAcesso {
  nomeUsuario: string;
  senhaTemporaria: string;
  isAdministrador: boolean;
}

export type ErrosAcesso = Partial<Record<keyof ValoresAcesso, string>>;

export const ACESSO_VAZIO: ValoresAcesso = { nomeUsuario: '', senhaTemporaria: '', isAdministrador: false };

export function errosDeValoresAcesso(
  valores: ValoresAcesso,
  validarNome: (nome: string) => string | null,
  validarSenha: (senha: string) => string | null,
): ErrosAcesso {
  const erros: ErrosAcesso = {};
  const erroNome = validarNome(valores.nomeUsuario);
  if (erroNome) erros.nomeUsuario = erroNome;
  const erroSenha = validarSenha(valores.senhaTemporaria);
  if (erroSenha) erros.senhaTemporaria = erroSenha;
  return erros;
}
