/* ============================================================ MODUL: CAT DINDING ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;
  window.ICS.modules.catDinding = U.createSimpleModule({
    id: "catDinding", label: "Cat Dinding",
    fields: [
      { key: "luas", label: "Luas dinding", unit: "m²", default: 80, step: 1 },
      { key: "jumlahLapis", label: "Jumlah lapis cat", unit: "lapis", default: 2, step: 1 },
      { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const catKg = entry.luas * entry.jumlahLapis * 0.1 * wasteMul;
      const plamirKg = entry.luas * 0.15 * wasteMul;
      const primerKg = entry.luas * 0.1 * wasteMul;

      const rab = U.createRab();
      rab.group(`Cat Dinding (${entry.jumlahLapis} lapis) — luas ${U.fmtNum(entry.luas)} m²`);
      rab.item("Plamir / skim coat", "kg", plamirKg, prices.plamir);
      rab.item("Cat primer", "kg", primerKg, prices.primer);
      rab.item("Cat tembok", "kg", catKg, prices.catTembok);
      rab.item("Upah pengecatan", "m²", entry.luas, prices.upahCat, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: entry.luas } };
    },
  });
})();
