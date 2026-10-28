import { Alert, Button, Stack, TextField } from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessao } from '@/app/providers/useSessao';
import { TAMANHO_MINIMO_SENHA, validarSenha } from '@/domain/acesso';
import { ErroRegraNegocio, mensagemDeErro } from '@/services/erros';
import { LayoutAcesso } from './LayoutAcesso';

type Campo = 'senhaAtual' | 'novaSenha' | 'confirmacao';

/**
 * Obrigatória no primeiro acesso e depois que o coordenador redefine a senha:
 * a pessoa troca a senha temporária por uma que só ela conhece.
 */
export function TrocarSenhaPage() {
  const { usuario, trocarSenha, sair } = useSessao();
  const navigate = useNavigate();
  const [valores, setValores] = useState<Record<Campo, string>>({ senhaAtual: '', novaSenha: '', confirmacao: '' });
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const atualizar = (campo: Campo, valor: string) => {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const enviar = async () => {
    const novosErros: Partial<Record<Campo, string>> = {};
    if (valores.senhaAtual === '') novosErros.senhaAtual = 'Informe a senha atual.';
    const erroNova = validarSenha(valores.novaSenha);
    if (erroNova) novosErros.novaSenha = erroNova;
    else if (valores.novaSenha === valores.senhaAtual) novosErros.novaSenha = 'A nova senha deve ser diferente da atual.';
    if (valores.confirmacao !== valores.novaSenha) novosErros.confirmacao = 'As senhas não conferem.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setEnviando(true);
    setErroGeral(null);
    try {
      await trocarSenha(valores.senhaAtual, valores.novaSenha);
      navigate('/', { replace: true });
    } catch (falha) {
      const doServico =
        falha instanceof ErroRegraNegocio
          ? Object.fromEntries(falha.violacoes.filter((v) => v.campo).map((v) => [v.campo, v.mensagem]))
          : {};
      if (Object.keys(doServico).length > 0) setErros(doServico);
      else setErroGeral(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  };

  const obrigatoria = usuario?.precisaTrocarSenha ?? true;

  return (
    <LayoutAcesso
      titulo="Defina sua nova senha"
      subtitulo={
        obrigatoria
          ? `Olá, ${usuario?.colaborador.nome ?? ''}. Para continuar, troque a senha temporária por uma que só você conheça.`
          : 'Troque a sua senha de acesso.'
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <Stack spacing={2.5}>
          {erroGeral && <Alert severity="error">{erroGeral}</Alert>}
          <TextField
            label={obrigatoria ? 'Senha temporária' : 'Senha atual'}
            type="password"
            autoComplete="current-password"
            autoFocus
            value={valores.senhaAtual}
            onChange={(e) => atualizar('senhaAtual', e.target.value)}
            error={Boolean(erros.senhaAtual)}
            helperText={erros.senhaAtual}
          />
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={valores.novaSenha}
            onChange={(e) => atualizar('novaSenha', e.target.value)}
            error={Boolean(erros.novaSenha)}
            helperText={erros.novaSenha ?? `Mínimo de ${TAMANHO_MINIMO_SENHA} caracteres.`}
          />
          <TextField
            label="Confirme a nova senha"
            type="password"
            autoComplete="new-password"
            value={valores.confirmacao}
            onChange={(e) => atualizar('confirmacao', e.target.value)}
            error={Boolean(erros.confirmacao)}
            helperText={erros.confirmacao}
          />
          <Button type="submit" variant="contained" size="large" loading={enviando}>
            Salvar nova senha
          </Button>
          <Button onClick={() => void sair()} disabled={enviando}>
            Sair
          </Button>
        </Stack>
      </form>
    </LayoutAcesso>
  );
}
