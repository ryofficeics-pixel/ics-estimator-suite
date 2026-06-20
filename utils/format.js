/* ============================================================ FORMATTER ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

window.ICS.utils.fmtRp = function (n) {
  if (!isFinite(n)) n = 0;
  return "Rp " + Math.round(n).toLocaleString("id-ID");
};
window.ICS.utils.fmtNum = function (n, dec = 2) {
  if (!isFinite(n)) n = 0;
  return n.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: dec });
};
window.ICS.utils.fmtInt = function (n) {
  if (!isFinite(n)) n = 0;
  return Math.round(n).toLocaleString("id-ID");
};
window.ICS.utils.uid = function (prefix) {
  return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
};
