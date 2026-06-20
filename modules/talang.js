/* ============================================================ MODUL: TALANG ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;
  window.ICS.modules.talang = U.createSimpleModule({
    id: "talang", label: "Talang",
    fields: [
      { key: "panjang", label: "Panjang talang", unit: "m", default: 15, step: 0.5 },
      { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const rab = U.createRab();
      rab.group(`Talang Air — panjang ${U.fmtNum(entry.panjang)} m`);
      rab.item("Talang air (lengkap aksesoris)", "m", entry.panjang * wasteMul, prices.talang);
      rab.item("Upah pasang talang", "m", entry.panjang, prices.upahAtap, { tipe: "upah" });
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { panjang: entry.panjang } };
    },
  });
})();
