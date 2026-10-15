import { Autocomplete, Chip, TextField } from '@mui/material';
import type { Colaborador } from '@/domain/entities';

interface BaseProps {
  rotulo: string;
  opcoes: readonly Colaborador[];
  erro?: string;
  ajuda?: string;
  desabilitado?: boolean;
  carregando?: boolean;
}

/** Seleção de um colaborador pelo ID. */
export function SeletorColaborador({
  rotulo,
  opcoes,
  valor,
  onChange,
  erro,
  ajuda,
  desabilitado,
  carregando,
}: BaseProps & { valor: number | null; onChange: (id: number | null) => void }) {
  return (
    <Autocomplete
      options={opcoes}
      value={opcoes.find((c) => c.id === valor) ?? null}
      onChange={(_, selecionado) => onChange(selecionado?.id ?? null)}
      getOptionLabel={(c) => c.nome}
      getOptionKey={(c) => c.id}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={desabilitado}
      loading={carregando}
      noOptionsText="Nenhum colaborador"
      renderInput={(params) => (
        <TextField {...params} label={rotulo} error={Boolean(erro)} helperText={erro ?? ajuda} />
      )}
    />
  );
}

/** Seleção de vários colaboradores pelos IDs. */
export function SeletorColaboradores({
  rotulo,
  opcoes,
  valor,
  onChange,
  erro,
  ajuda,
  desabilitado,
  carregando,
}: BaseProps & { valor: readonly number[]; onChange: (ids: number[]) => void }) {
  return (
    <Autocomplete
      multiple
      options={opcoes}
      value={opcoes.filter((c) => valor.includes(c.id))}
      onChange={(_, selecionados) => onChange(selecionados.map((c) => c.id))}
      getOptionLabel={(c) => c.nome}
      getOptionKey={(c) => c.id}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disableCloseOnSelect
      disabled={desabilitado}
      loading={carregando}
      noOptionsText="Nenhum colaborador"
      renderValue={(selecionados, getItemProps) =>
        selecionados.map((c, indice) => {
          const { key, ...itemProps } = getItemProps({ index: indice });
          return <Chip key={key} label={c.nome} size="small" {...itemProps} />;
        })
      }
      renderInput={(params) => (
        <TextField {...params} label={rotulo} error={Boolean(erro)} helperText={erro ?? ajuda} />
      )}
    />
  );
}
