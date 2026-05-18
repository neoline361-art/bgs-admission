import * as XLSX from "xlsx";
import type { Application } from "./types";

function getApplicationRows(applications: Application[]) {
  return applications.map((app) => ({
    "App ID": app.app_id,
    Date: new Date(app.created_at).toLocaleDateString("en-IN"),
    "Student Name": app.student_name,
    "Parent Name": app.parent_name,
    Phone: app.phone,
    "Alt Phone": app.alt_phone || "",
    Village: app.village,
    School: app.current_school,
    Course: app.course,
    "Marks %": app.marks_percent ?? "",
    Status: app.status,
    "Meeting Date": app.meeting_date || "",
    "Meeting Time": app.meeting_time || "",
    "Assigned Teacher": app.assigned_teacher?.name || "",
    Notes: app.notes || "",
  }));
}

export function exportToCSV(applications: Application[], filename = "bgs-applications") {
  const rows = getApplicationRows(applications);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h as keyof typeof row]).replace(/"/g, '""')}"`).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(applications: Application[], filename = "bgs-applications") {
  const rows = getApplicationRows(applications);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applications");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToODS(applications: Application[], filename = "bgs-applications") {
  const rows = getApplicationRows(applications);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Applications");
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.ods`);
}

export function printTable(applications: Application[]) {
  const rows = getApplicationRows(applications);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const html = `
    <html><head><title>BGS Applications</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
      th { background: #1e40af; color: white; }
      tr:nth-child(even) { background: #f0f4ff; }
      h2 { color: #1e40af; margin-bottom: 4px; }
      p { margin: 0 0 8px; color: #555; font-size: 10px; }
    </style></head>
    <body>
      <h2>BGS PU College – Admission Applications</h2>
      <p>Printed on: ${new Date().toLocaleString("en-IN")} | Total: ${rows.length}</p>
      <table>
        <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${headers.map((h) => `<td>${row[h as keyof typeof row]}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </body></html>
  `;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.print();
  }
}
