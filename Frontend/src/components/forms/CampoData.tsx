import { DatePicker } from '@mui/x-date-pickers';
import { isValid } from 'date-fns';
import { isDataISO, paraDataISO, parseDataISO, type DataISO } from '@/lib/datas';

interface CampoDataProps {
  rotulo: string;
  valor: DataISO | '';
  onChange: (valor: DataISO | '') => void;
  erro?: string;
  ajuda?: string;
  desabilitado?: boolean;
  minimo?: DataISO;
}

/** Seletor de data (dd/MM/aaaa) cujo valor é sempre `DataISO` ou vazio — nunca texto localizado. */
export function CampoData({ rotulo, valor, onChange, erro, ajuda, desabilitado, minimo }: CampoDataProps) {
  return (
    <DatePicker
      label={rotulo}
      value={valor && isDataISO(valor) ? parseDataISO(valor) : null}
      onChange={(data) => onChange(data && isValid(data) ? paraDataISO(data) : '')}
      minDate={minimo ? parseDataISO(minimo) : undefined}
      disabled={desabilitado}
      format="dd/MM/yyyy"
      slotProps={{
        textField: { size: 'small', fullWidth: true, error: Boolean(erro), helperText: erro ?? ajuda },
      }}
    />
  );
}
