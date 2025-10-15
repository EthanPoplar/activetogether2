import Papa from "papaparse";

export function exportToCsv(filename, rows) {
  if (!rows?.length) return;
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(filename.endsWith(".csv") ? filename : `${filename}.csv`, blob);
}

export async function exportToPdf(filename, rows) {
  if (!rows?.length) return;
  let jsPDF;
  try {
    ({ jsPDF } = await import("jspdf"));
  } catch (err) {
    console.error("Install jspdf to enable PDF export", err);
    return;
  }
  const doc = new jsPDF({ orientation: "landscape" });
  const columns = Object.keys(rows[0]);
  const cellWidth = 280 / columns.length;
  doc.setFontSize(12);
  columns.forEach((col, idx) => {
    doc.text(String(col).toUpperCase(), 10 + idx * cellWidth, 20);
  });
  doc.setFontSize(10);
  rows.forEach((row, rowIdx) => {
    columns.forEach((col, colIdx) => {
      doc.text(String(row[col] ?? ""), 10 + colIdx * cellWidth, 30 + rowIdx * 10, { maxWidth: cellWidth - 4 });
    });
  });
  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

function triggerFileDownload(name, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
