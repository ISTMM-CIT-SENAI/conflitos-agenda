import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ChipProps } from '@mui/material';
import type { ReactElement } from 'react';
import { ROTULO_STATUS, StatusSolicitacao } from '@/domain/enums/statusSolicitacao';

interface VisualStatus {
  rotulo: string;
  cor: NonNullable<ChipProps['color']>;
  /** Cor sólida, usada fora de componentes MUI (ex.: calendário). */
  hex: string;
  icone: ReactElement;
}

/** Status sempre exibido com cor, ícone e texto — nunca só com cor. */
export const VISUAL_STATUS: Record<StatusSolicitacao, VisualStatus> = {
  [StatusSolicitacao.EmAnalise]: {
    rotulo: ROTULO_STATUS[StatusSolicitacao.EmAnalise],
    cor: 'info',
    hex: '#0277bd',
    icone: <HourglassEmptyIcon fontSize="small" />,
  },
  [StatusSolicitacao.ConflitoEncontrado]: {
    rotulo: ROTULO_STATUS[StatusSolicitacao.ConflitoEncontrado],
    cor: 'warning',
    hex: '#e65100',
    icone: <WarningAmberIcon fontSize="small" />,
  },
  [StatusSolicitacao.Aprovada]: {
    rotulo: ROTULO_STATUS[StatusSolicitacao.Aprovada],
    cor: 'success',
    hex: '#2e7d32',
    icone: <CheckCircleOutlineIcon fontSize="small" />,
  },
  [StatusSolicitacao.Recusada]: {
    rotulo: ROTULO_STATUS[StatusSolicitacao.Recusada],
    cor: 'error',
    hex: '#c62828',
    icone: <CancelOutlinedIcon fontSize="small" />,
  },
};

export const HEX_SEM_SOLICITACAO = '#78909c';
