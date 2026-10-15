import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  AppBar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState, type ReactElement } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useServicos } from '@/app/providers/useServicos';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useMutacao } from '@/hooks/useDados';

const LARGURA_MENU = 248;

interface ItemMenu {
  rotulo: string;
  caminho: string;
  icone: ReactElement;
}

const ITENS_MENU: ItemMenu[] = [
  { rotulo: 'Dashboard', caminho: '/', icone: <DashboardOutlinedIcon /> },
  { rotulo: 'Colaboradores', caminho: '/colaboradores', icone: <PeopleAltOutlinedIcon /> },
  { rotulo: 'Projetos', caminho: '/projetos', icone: <FolderOutlinedIcon /> },
  { rotulo: 'Períodos', caminho: '/periodos', icone: <DateRangeOutlinedIcon /> },
  { rotulo: 'Solicitações', caminho: '/solicitacoes', icone: <AssignmentOutlinedIcon /> },
  { rotulo: 'Calendário', caminho: '/calendario', icone: <CalendarMonthOutlinedIcon /> },
];

function ConteudoMenu({ onNavegar }: { onNavegar: () => void }) {
  const { demonstracao } = useServicos();
  const { pathname } = useLocation();
  const [confirmandoRestauracao, setConfirmandoRestauracao] = useState(false);
  const restaurar = useMutacao(async () => demonstracao?.restaurarDados(), {
    sucesso: 'Dados de demonstração restaurados.',
  });

  const ativo = (caminho: string) => (caminho === '/' ? pathname === '/' : pathname.startsWith(caminho));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#102a4c', color: '#e8eef7' }}>
      <Toolbar sx={{ gap: 1.5 }}>
        <EventBusyOutlinedIcon />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          Conflitos de Agenda
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)' }} />
      <List component="nav" aria-label="Navegação principal" sx={{ px: 1, py: 2, flex: 1 }}>
        {ITENS_MENU.map((item) => (
          <ListItemButton
            key={item.caminho}
            component={NavLink}
            to={item.caminho}
            onClick={onNavegar}
            selected={ativo(item.caminho)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'inherit',
              '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.14)' },
              '&.Mui-selected:hover, &:hover': { bgcolor: 'rgba(255,255,255,0.10)' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icone}</ListItemIcon>
            <ListItemText primary={item.rotulo} />
          </ListItemButton>
        ))}
      </List>
      {demonstracao && (
        <Box sx={{ p: 2 }}>
          <Chip label="Modo demonstração" size="small" sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.14)', color: 'inherit' }} />
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<RestartAltIcon />}
            onClick={() => setConfirmandoRestauracao(true)}
          >
            Restaurar dados
          </Button>
          <ConfirmDialog
            aberto={confirmandoRestauracao}
            titulo="Restaurar dados de demonstração?"
            mensagem="Todas as alterações feitas serão descartadas e os dados iniciais serão recarregados."
            rotuloConfirmar="Restaurar"
            cor="warning"
            processando={restaurar.isPending}
            onFechar={() => setConfirmandoRestauracao(false)}
            onConfirmar={() => restaurar.mutate(undefined, { onSuccess: () => setConfirmandoRestauracao(false) })}
          />
        </Box>
      )}
    </Box>
  );
}

export function AppShell() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!desktop && (
        <AppBar position="fixed" color="inherit" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Toolbar>
            <IconButton edge="start" aria-label="Abrir menu" onClick={() => setMenuAberto(true)} sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Conflitos de Agenda
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box component="aside" sx={{ width: { md: LARGURA_MENU }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={desktop ? 'permanent' : 'temporary'}
          open={desktop || menuAberto}
          onClose={() => setMenuAberto(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: LARGURA_MENU, boxSizing: 'border-box' } }}
        >
          <ConteudoMenu onNavegar={() => setMenuAberto(false)} />
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 3, md: 4 },
          mt: { xs: 7, md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
