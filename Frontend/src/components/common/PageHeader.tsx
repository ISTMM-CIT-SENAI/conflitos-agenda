import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  titulo: string;
  subtitulo?: ReactNode;
  acoes?: ReactNode;
}

export function PageHeader({ titulo, subtitulo, acoes }: PageHeaderProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1">
          {titulo}
        </Typography>
        {subtitulo && (
          <Typography variant="body2" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
            {subtitulo}
          </Typography>
        )}
      </Box>
      {acoes && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{acoes}</Box>}
    </Box>
  );
}
