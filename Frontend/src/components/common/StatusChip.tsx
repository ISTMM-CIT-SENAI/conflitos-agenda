import { Chip } from '@mui/material';
import type { StatusSolicitacao } from '@/domain/enums/statusSolicitacao';
import { VISUAL_STATUS } from './status';

export function StatusChip({ status, size = 'small' }: { status: StatusSolicitacao; size?: 'small' | 'medium' }) {
  const visual = VISUAL_STATUS[status];
  return <Chip icon={visual.icone} label={visual.rotulo} color={visual.cor} size={size} variant="outlined" />;
}
