import { Paper } from '@mui/material';
import { DataGrid, type DataGridProps, type GridValidRowModel } from '@mui/x-data-grid';
import { ptBR } from '@mui/x-data-grid/locales';

type TabelaDadosProps<T extends GridValidRowModel> = Omit<DataGridProps<T>, 'rows'> & { rows: readonly T[] };

/** DataGrid com os padrões do painel: paginação de 10 em 10 e altura automática. */
export function TabelaDados<T extends GridValidRowModel>({ initialState, sx, localeText, ...props }: TabelaDadosProps<T>) {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <DataGrid<T>
        autoHeight
        disableRowSelectionOnClick
        disableColumnMenu
        pageSizeOptions={[10, 25, 50]}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } }, ...initialState }}
        sx={[{ border: 'none' }, ...(Array.isArray(sx) ? sx : [sx])]}
        // A prop substitui o locale do tema em vez de mesclar; mescla aqui.
        localeText={{ ...ptBR.components.MuiDataGrid.defaultProps.localeText, ...localeText }}
        {...props}
      />
    </Paper>
  );
}
