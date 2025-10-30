import { saveAs } from 'file-saver';

/**
 * Export Utilities for Charts and Tables
 * Provides CSV and PNG export functionality
 */

/**
 * Convert data array to CSV format
 */
export function convertToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle values that might contain commas
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value ?? '';
            }).join(',')
        )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
}

/**
 * Export chart as PNG image
 * Uses html2canvas library
 */
export async function exportChartAsPNG(
    elementId: string,
    filename: string
): Promise<void> {
    try {
        // Dynamically import html2canvas to reduce bundle size
        const html2canvas = (await import('html2canvas')).default;

        const element = document.getElementById(elementId);
        if (!element) {
            console.error(`Element with id "${elementId}" not found`);
            return;
        }

        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
        });

        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${filename}.png`);
            }
        });
    } catch (error) {
        console.error('Error exporting chart as PNG:', error);
    }
}

/**
 * Export table data to CSV
 */
export function exportTableToCSV(
    tableData: any[],
    columns: string[],
    filename: string
): void {
    if (!tableData || tableData.length === 0) {
        console.warn('No table data to export');
        return;
    }

    // Filter data to only include specified columns
    const filteredData = tableData.map(row => {
        const filtered: any = {};
        columns.forEach(col => {
            if (row[col] !== undefined) {
                filtered[col] = row[col];
            }
        });
        return filtered;
    });

    convertToCSV(filteredData, filename);
}

/**
 * Format date for filename
 */
export function getFormattedDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(base: string, extension: string = ''): string {
    const date = getFormattedDate();
    const ext = extension ? `.${extension}` : '';
    return `${base}_${date}${ext}`;
}
