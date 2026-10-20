import { Checkbox, FormControlLabel, FormHelperText, Stack, TextField } from '@mui/material';
import { TAMANHO_MINIMO_SENHA } from '@/domain/acesso';
import type { ErrosAcesso, ValoresAcesso } from './valoresAcesso';


/** Nome de usuário, senha temporária e marcação de Administrador, usados ao criar um acesso. */
export function CamposAcesso({
  valores,
  erros,
  onChange,
  desabilitado,
}: {
  valores: ValoresAcesso;
  erros: ErrosAcesso;
  onChange: (valores: ValoresAcesso) => void;
  desabilitado?: boolean;
}) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Nome de usuário"
        value={valores.nomeUsuario}
        onChange={(e) => onChange({ ...valores, nomeUsuario: e.target.value })}
        error={Boolean(erros.nomeUsuario)}
        helperText={erros.nomeUsuario ?? 'De 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado. Ex.: joao.silva'}
        disabled={desabilitado}
        autoComplete="off"
      />
      <TextField
        label="Senha temporária"
        value={valores.senhaTemporaria}
        onChange={(e) => onChange({ ...valores, senhaTemporaria: e.target.value })}
        error={Boolean(erros.senhaTemporaria)}
        helperText={
          erros.senhaTemporaria ??
          `Mínimo de ${TAMANHO_MINIMO_SENHA} caracteres. Entregue-a à pessoa; ela será obrigada a trocá-la no primeiro acesso.`
        }
        disabled={desabilitado}
        autoComplete="new-password"
      />
      <div>
        <FormControlLabel
          control={
            <Checkbox
              checked={valores.isAdministrador}
              onChange={(e) => onChange({ ...valores, isAdministrador: e.target.checked })}
              disabled={desabilitado}
            />
          }
          label="Administrador"
        />
        <FormHelperText sx={{ mt: -0.5 }}>
          Acesso total: cadastros, usuários e decisão de qualquer solicitação, exceto a própria.
        </FormHelperText>
      </div>
    </Stack>
  );
}

