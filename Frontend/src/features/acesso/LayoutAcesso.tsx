import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import { Box, Paper, Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/** Moldura das telas fora da área logada (login e troca de senha). */
export function LayoutAcesso({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <Box
      component="main"
      sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', px: 2, py: 4 }}
    >
      <Stack spacing={3} sx={{ width: '100%', maxWidth: 420 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'center', color: '#102a4c' }}>
          <EventBusyOutlinedIcon fontSize="large" />
          <Typography variant="h5" component="p" sx={{ fontWeight: 700 }}>
            Conflitos de Agenda
          </Typography>
        </Stack>
        <Paper sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="h6" component="h1">
            {titulo}
          </Typography>
          {subtitulo && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              {subtitulo}
            </Typography>
          )}
          {children}
        </Paper>
      </Stack>
    </Box>
  );
}
