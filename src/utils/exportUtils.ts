import { saveAs } from 'file-saver';
export function convertToCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
        console.log('No data to export');
        return;
    }

    const headers = Object.keys(data[0]);

    const csvContent = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value ?? '';
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
}

export async function exportChartAsPNG(
    elementId: string,
    filename: string
): Promise<void> {
    try {
        const html2canvas = (await import('html2canvas')).default;

        const element = document.getElementById(elementId);
        if (!element) {
            console.log(`Element with id "${elementId}" not found`);
            return;
        }

        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
        });

        canvas.toBlob((blob) => {
            if (blob) {
                saveAs(blob, `${filename}.png`);
            }
        });
    } catch (error) {
        console.log('Error exporting chart as PNG:', error);
    }
}

export function exportTableToCSV(
    tableData: any[],
    columns: string[],
    filename: string
): void {
    if (!tableData || tableData.length === 0) {
        console.log('No table data to export');
        return;
    }

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

export function getFormattedDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

export function generateFilename(base: string, extension: string = ''): string {
    const date = getFormattedDate();
    const ext = extension ? `.${extension}` : '';
    return `${base}_${date}${ext}`;
}
