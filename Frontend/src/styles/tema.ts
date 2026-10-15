import { createTheme } from '@mui/material/styles';
import { ptBR } from '@mui/material/locale';
import { ptBR as ptBRDataGrid } from '@mui/x-data-grid/locales';
import { ptBR as ptBRDatePickers } from '@mui/x-date-pickers/locales';

export const tema = createTheme(
  {
    palette: {
      mode: 'light',
      primary: { main: '#1d4f91' },
      secondary: { main: '#00897b' },
      background: { default: '#f4f6fa', paper: '#ffffff' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: '"Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #e3e8ef' } } },
      MuiAppBar: { styleOverrides: { root: { border: 'none' } } },
      MuiDrawer: { styleOverrides: { paper: { border: 'none' } } },
      MuiButton: { defaultProps: { disableElevation: true } },
      MuiTextField: { defaultProps: { size: 'small', fullWidth: true } },
    },
  },
  ptBR,
  ptBRDataGrid,
  ptBRDatePickers,
);
