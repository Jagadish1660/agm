// utils.js - shared helpers

// storage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function loadData(key, fallback) {
  const v = localStorage.getItem(key);
  return v ? JSON.parse(v) : (typeof fallback !== "undefined" ? fallback : null);
}

// date helpers
function formatDate(d) {
  const dt = new Date(d);
  return dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
}

// Return the next Sunday on or after given date
function getNextOrCurrentSunday(fromDate) {
  const d = new Date(fromDate);
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const offset = (7 - day) % 7;
  d.setDate(d.getDate() + offset);
  return d;
}

// get all Sundays between start and end (inclusive). Start may be any date.
function getSundaysBetween(startDate, endDate) {
  const s = new Date(startDate);
  s.setHours(0,0,0,0);
  const e = new Date(endDate);
  e.setHours(0,0,0,0);

  // move s to next or same Sunday
  while (s.getDay() !== 0) s.setDate(s.getDate() + 1);

  const arr = [];
  const cur = new Date(s);
  while (cur <= e) {
    arr.push(new Date(cur));
    cur.setDate(cur.getDate() + 7);
  }
  return arr;
}

// CSV export
function exportToCSV(filename, rows) {
  if (!rows || !rows.length) { alert("No data to export"); return; }
  const csv = rows.map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// small helper to escape HTML in inserted strings
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
}


// ...existing code...
/**
 * formatCurrency - format number as INR currency (no decimal)
 * @param {number} value
 * @returns {string}
 */
function formatCurrency(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(n);
}