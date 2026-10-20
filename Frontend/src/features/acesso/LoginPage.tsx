import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import {
  Alert,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { useSessao } from '@/app/providers/useSessao';
import { ROTULO_NIVEL } from '@/domain/acesso';
import { mensagemDeErro } from '@/services/erros';
import { LayoutAcesso } from './LayoutAcesso';

export function LoginPage() {
  const { usuario, entrar } = useSessao();
  const { demonstracao } = useServicos();
  const navigate = useNavigate();
  const location = useLocation();
  const voltarPara = (location.state as { voltarPara?: string } | null)?.voltarPara ?? '/';

  const [nomeUsuario, setNomeUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={usuario.precisaTrocarSenha ? '/trocar-senha' : voltarPara} replace />;

  const enviar = async (nome = nomeUsuario, senhaDigitada = senha) => {
    if (nome.trim() === '' || senhaDigitada === '') {
      setErro('Informe o nome de usuário e a senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const logado = await entrar(nome, senhaDigitada);
      navigate(logado.precisaTrocarSenha ? '/trocar-senha' : voltarPara, { replace: true });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setSenha('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <LayoutAcesso titulo="Entrar" subtitulo="Use o nome de usuário e a senha fornecidos pelo administrador.">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <Stack spacing={2.5}>
          {erro && <Alert severity="error">{erro}</Alert>}
          <TextField
            label="Nome de usuário"
            autoFocus
            autoComplete="username"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            disabled={enviando}
          />
          <TextField
            label="Senha"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            disabled={enviando}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setMostrarSenha((v) => !v)}
                      edge="end"
                      size="small"
                    >
                      {mostrarSenha ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Button type="submit" variant="contained" size="large" loading={enviando}>
            Entrar
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Esqueceu a senha? Peça ao administrador do sistema uma senha temporária.
          </Typography>
        </Stack>
      </form>

      {demonstracao && (
        <>
          <Divider sx={{ my: 3 }}>
            <Chip label="Modo demonstração" size="small" />
          </Divider>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Clique em um usuário para entrar (senha <strong>{demonstracao.credenciais[0]?.senha}</strong>):
          </Typography>
          <List dense disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
            {demonstracao.credenciais.map((c) => (
              <ListItemButton
                key={c.nomeUsuario}
                disabled={enviando}
                onClick={() => {
                  setNomeUsuario(c.nomeUsuario);
                  setSenha(c.senha);
                  void enviar(c.nomeUsuario, c.senha);
                }}
              >
                <ListItemText primary={c.nomeUsuario} secondary={`${ROTULO_NIVEL[c.nivel]} · ${c.nome}`} />
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </LayoutAcesso>
  );
}
