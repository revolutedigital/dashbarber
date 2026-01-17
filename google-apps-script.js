/**
 * SCRIPT PARA GOOGLE SHEETS - Dashboard de Tráfego
 *
 * COMO USAR:
 * 1. Na planilha, vá em Extensões > Apps Script
 * 2. Cole este código
 * 3. Clique em "Implantar" > "Nova implantação"
 * 4. Tipo: "App da Web"
 * 5. Quem pode acessar: "Qualquer pessoa"
 * 6. Copie a URL gerada
 */

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  const funnels = [];

  // Busca todas as abas que começam com "data meta"
  sheets.forEach(sheet => {
    const sheetName = sheet.getName();

    if (sheetName.toLowerCase().startsWith('data meta')) {
      const data = sheet.getDataRange().getValues();

      if (data.length > 1) {
        const headers = data[0];
        const rows = data.slice(1);

        // Extrai nome do funil (remove "data meta " do início)
        const funnelName = sheetName
          .replace(/^data meta\s*/i, '')
          .trim();

        const funnelData = rows
          .filter(row => row[0]) // Remove linhas vazias
          .map(row => {
            return {
              day: formatDate(row[0]),
              amountSpent: parseNumber(row[1]),
              reach: parseNumber(row[2]),
              impressions: parseNumber(row[3]),
              clicksAll: parseNumber(row[4]),
              uniqueLinkClicks: parseNumber(row[5]),
              costPerLandingPageView: parseNumber(row[6]),
              purchases: parseNumber(row[7]),
              cpm: parseNumber(row[8]),
              ctrLink: parseNumber(row[9]),
              connectRate: parseNumber(row[10]),
              cpa: parseNumber(row[11]),
              cpc: parseNumber(row[12]),
              txConv: parseNumber(row[13])
            };
          });

        if (funnelData.length > 0) {
          funnels.push({
            id: sheetName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase(),
            name: funnelName,
            data: funnelData
          });
        }
      }
    }
  });

  const response = {
    funnels: funnels,
    lastUpdated: new Date().toISOString()
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Formata data para string
function formatDate(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  }
  return String(value);
}

// Converte para número, tratando NaN
function parseNumber(value) {
  if (value === null || value === undefined || value === '' || value === 'NaN') {
    return 0;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}
