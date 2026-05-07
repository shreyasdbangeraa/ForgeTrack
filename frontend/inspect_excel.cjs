const XLSX = require('xlsx');
const path = require('path');

const filePath = 'c:/ForgeTrack/doc/Data Engineering and AI - Actual Program.xlsx';
try {
  const wb = XLSX.readFile(filePath);
  console.log('File loaded successfully');
  wb.SheetNames.forEach(name => {
    console.log('\n--- SHEET:', name, '---');
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    
    // Find first non-empty row
    const firstRow = data.find(row => row && row.length > 0);
    console.log('Headers (Raw):', firstRow);
    
    // Show first 2 data rows
    const dataRows = data.filter(row => row && row.length > 0).slice(1, 3);
    dataRows.forEach((row, i) => {
      console.log(`Sample Row ${i+1}:`, row);
    });
  });
} catch (e) {
  console.error('Error:', e.message);
}
