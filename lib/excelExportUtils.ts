import ExcelJS from 'exceljs';

interface ExportBrandedExcelParams {
  sheetName: string;
  title: string;
  originTab: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}

export async function exportBrandedExcel({
  sheetName,
  title,
  originTab,
  headers,
  rows,
  filename,
}: ExportBrandedExcelParams) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });

  // Fetch SBM logo from /sbm-logo.png
  let logoBuffer: ArrayBuffer | null = null;
  try {
    const res = await fetch('/sbm-logo.png');
    if (res.ok) {
      logoBuffer = await res.arrayBuffer();
    }
  } catch (err) {
    console.warn('Could not load SBM logo for Excel header export:', err);
  }

  // Header Title Block (Row 1 - 3)
  worksheet.mergeCells('C1:G1');
  worksheet.mergeCells('C2:G2');
  worksheet.mergeCells('C3:G3');

  const titleCell = worksheet.getCell('C1');
  titleCell.value = title.toUpperCase();
  titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFF26522' } }; // SBM Orange (#F26522)

  const originCell = worksheet.getCell('C2');
  originCell.value = `Report Origin: ${originTab}`;
  originCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF005DAA' } }; // SBM Blue (#005DAA)

  const dateCell = worksheet.getCell('C3');
  const timestampStr = new Date().toLocaleString('pt-BR');
  dateCell.value = `Exported at: ${timestampStr} | Environment: Cognite Data Fusion (CDF) | System: Monitoring Rules App`;
  dateCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF666666' } };

  // Set row heights for header block
  worksheet.getRow(1).height = 20;
  worksheet.getRow(2).height = 18;
  worksheet.getRow(3).height = 16;
  worksheet.getRow(4).height = 12; // Blank row separator

  // Embed logo image if available across cells A1:B3
  if (logoBuffer) {
    const logoId = workbook.addImage({
      buffer: logoBuffer,
      extension: 'png',
    });
    worksheet.addImage(logoId, {
      tl: { col: 0, row: 0 },
      ext: { width: 70, height: 64 },
    });
  }

  // Row 5: Table Header Row
  const headerRowIndex = 5;
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.values = headers;
  headerRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E293B' }, // Dark Slate (#1E293B)
  };
  headerRow.height = 24;

  // Add Data Rows (Row 6 onwards)
  rows.forEach(r => {
    worksheet.addRow(r);
  });

  // Auto-fit Column Widths based on maximum content length
  worksheet.columns.forEach((col, idx) => {
    let maxLen = headers[idx] ? headers[idx].length : 12;
    col.eachCell?.({ includeEmpty: false }, (cell, rowNum) => {
      if (rowNum >= headerRowIndex) {
        const valStr = String(cell.value || '');
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      }
    });
    col.width = Math.min(Math.max(maxLen + 4, 14), 65);
  });

  // Generate binary buffer & trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
