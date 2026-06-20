/* ============================================================
   AGGREGATE — gabungkan banyak "entry" dalam satu modul jadi
   satu hasil RAB (subtotal & grand total tunggal di akhir).
   Dipakai oleh render() tiap modul & oleh Rekapitulasi.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

window.ICS.utils.aggregateModule = function (entries, calculateEntryFn, prices) {
  const allRows = [];
  let totalMaterial = 0, totalUpah = 0;
  const warnings = [];
  const perEntry = [];

  (entries || []).forEach((entry, idx) => {
    const result = calculateEntryFn(entry, prices, idx);
    if (!result) return;
    allRows.push(...result.rows);
    totalMaterial += result.totalMaterial;
    totalUpah += result.totalUpah;
    if (result.warnings) warnings.push(...result.warnings);
    perEntry.push({ entry, result, idx });
  });

  if (allRows.length) {
    allRows.push({ uraian: "Subtotal Material", isSubtotal: true, jumlah: totalMaterial });
    allRows.push({ uraian: "Subtotal Upah", isSubtotal: true, jumlah: totalUpah });
    allRows.push({ uraian: "TOTAL MODUL", isGrand: true, jumlah: totalMaterial + totalUpah });
  }

  return { rows: allRows, totalMaterial, totalUpah, total: totalMaterial + totalUpah, warnings, perEntry };
};
