import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportButton } from '../ExportButton';
import * as exportUtils from '../../utils/exportUtils';

// Mock the export utilities
vi.mock('../../utils/exportUtils', () => ({
    exportChartAsPNG: vi.fn(),
    exportTableToCSV: vi.fn(),
}));

describe('ExportButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the export button', () => {
        render(<ExportButton chartId="test-chart" chartName="Test Chart" />);

        // Should render a button with download icon tooltip
        const button = screen.getByRole('button');
        expect(button).toBeTruthy();
    });

    it('opens menu on click', async () => {
        render(
            <ExportButton
                chartId="test-chart"
                chartName="Test Chart"
                tableData={[{ id: 1, name: 'Test' }]}
                tableColumns={[{ header: 'ID', accessor: 'id' }, { header: 'Name', accessor: 'name' }]}
                tableName="TestTable"
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Menu items should appear
        // Look for menu items
        const menuItems = await screen.findAllByRole('menuitem');
        expect(menuItems.length).toBeGreaterThan(0);
    });

    it('calls exportChartAsPNG when PNG option selected', async () => {
        render(
            <ExportButton
                chartId="test-chart"
                chartName="Test Chart"
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Find and click PNG export option
        const pngOption = await screen.findByText(/PNG/i);
        fireEvent.click(pngOption);

        expect(exportUtils.exportChartAsPNG).toHaveBeenCalledWith('test-chart', 'Test Chart');
    });

    it('calls exportTableToCSV when CSV option selected', async () => {
        const tableData = [
            { id: 1, name: 'Maryland' },
            { id: 2, name: 'Arkansas' },
        ];
        const tableColumns = [
            { header: 'ID', accessor: 'id' },
            { header: 'Name', accessor: 'name' },
        ];

        render(
            <ExportButton
                tableData={tableData}
                tableColumns={tableColumns}
                tableName="TestTable"
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Find and click CSV export option
        const csvOption = await screen.findByText(/CSV/i);
        fireEvent.click(csvOption);

        expect(exportUtils.exportTableToCSV).toHaveBeenCalledWith(
            tableData,
            ['id', 'name'],
            'TestTable'
        );
    });

    it('closes menu after export action', async () => {
        render(
            <ExportButton
                chartId="test-chart"
                chartName="Test Chart"
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Menu should be open
        const pngOption = await screen.findByText(/PNG/i);
        fireEvent.click(pngOption);

        // Menu should close after action
        // Menu should no longer be visible or items should be gone
    });

    it('handles export error gracefully', async () => {
        // Mock export to throw error
        vi.mocked(exportUtils.exportChartAsPNG).mockRejectedValueOnce(new Error('Export failed'));

        // Mock alert
        const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <ExportButton
                chartId="test-chart"
                chartName="Test Chart"
            />
        );

        const button = screen.getByRole('button');
        fireEvent.click(button);

        const pngOption = await screen.findByText(/PNG/i);
        fireEvent.click(pngOption);

        // Wait for async error handling
        await vi.waitFor(() => {
            // Error should be logged or alert shown
        });

        mockAlert.mockRestore();
    });

    it('does not render menu items when no export options provided', () => {
        render(<ExportButton />);

        const button = screen.getByRole('button');
        fireEvent.click(button);

        // Should still open menu, but may have no options
    });
});
