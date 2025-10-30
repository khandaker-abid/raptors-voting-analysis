import React from 'react';
import { IconButton, Menu, MenuItem, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { exportChartAsPNG, exportTableToCSV } from '../utils/exportUtils';

interface ExportButtonProps {
    chartId?: string;
    chartName?: string;
    tableData?: any[];
    tableColumns?: { header: string; accessor: string }[];
    tableName?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
    chartId,
    chartName,
    tableData,
    tableColumns,
    tableName,
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleExportPNG = async () => {
        if (chartId && chartName) {
            try {
                await exportChartAsPNG(chartId, chartName);
            } catch (error) {
                console.error('Failed to export chart as PNG:', error);
                alert('Failed to export chart. Please try again.');
            }
        }
        handleClose();
    };

    const handleExportCSV = () => {
        if (tableData && tableColumns && tableName) {
            try {
                // Extract accessor names from column definitions
                const columnAccessors = tableColumns.map(col => col.accessor);
                exportTableToCSV(tableData, columnAccessors, tableName);
            } catch (error) {
                console.error('Failed to export table as CSV:', error);
                alert('Failed to export data. Please try again.');
            }
        }
        handleClose();
    };

    return (
        <>
            <Tooltip title="Export Data">
                <IconButton
                    onClick={handleClick}
                    size="small"
                    sx={{
                        color: 'primary.main',
                        '&:hover': { backgroundColor: 'action.hover' },
                    }}
                >
                    <DownloadIcon />
                </IconButton>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                {chartId && chartName && (
                    <MenuItem onClick={handleExportPNG}>Export Chart as PNG</MenuItem>
                )}
                {tableData && tableColumns && tableName && (
                    <MenuItem onClick={handleExportCSV}>Export Data as CSV</MenuItem>
                )}
            </Menu>
        </>
    );
};
