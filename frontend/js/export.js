/**
 * export.js — CSV Export Utility
 * Parses visible HTML tables and downloads as .csv
 */

function exportTableToCSV(tableSelector, filename = 'report.csv') {
  const table = document.querySelector(tableSelector);
  if (!table) {
    Toast.error('No table data to export');
    return;
  }

  const rows = table.querySelectorAll('tr');
  if (rows.length === 0) {
    Toast.error('Table is empty');
    return;
  }

  const csvRows = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll('th, td');
    const rowData = [];

    cells.forEach(cell => {
      // Get text content, strip extra whitespace
      let text = cell.textContent.trim().replace(/\s+/g, ' ');

      // Escape quotes by doubling them
      text = text.replace(/"/g, '""');

      // Wrap in quotes if contains comma, newline, or quotes
      if (text.includes(',') || text.includes('\n') || text.includes('"')) {
        text = `"${text}"`;
      }

      rowData.push(text);
    });

    csvRows.push(rowData.join(','));
  });

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  Toast.success('Report exported successfully');
}
