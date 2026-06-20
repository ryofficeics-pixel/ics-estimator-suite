/* ============================================================ MODUL: PLESTER DAN ACIAN ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;

  window.ICS.modules.plesterAcian = U.createSimpleModule({
    id: "plesterAcian", label: "Plester dan Acian",
    fields: [
      { key: "luas", label: "Luas dinding diplester", unit: "m²", default: 50, step: 1 },
      { key: "tebal", label: "Tebal plester", unit: "cm", default: 1.5, step: 0.1 },
      { key: "pakaiAcian", label: "Pakai acian", type: "select", default: "ya", options: [{ value: "ya", label: "Ya" }, { value: "tidak", label: "Tidak" }] },
      { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const faktorTebal = entry.tebal / 1.5; // skala terhadap acuan 1.5cm
      const semenPlester = entry.luas * 0.092 * faktorTebal * wasteMul;
      const pasirPlester = entry.luas * 0.018 * faktorTebal * wasteMul;
      const semenAcian = entry.pakaiAcian === "ya" ? entry.luas * 0.05 * wasteMul : 0;

      const rab = U.createRab();
      rab.group(`Plester${entry.pakaiAcian === "ya" ? " + Acian" : ""} — luas ${U.fmtNum(entry.luas)} m²`);
      rab.item("Semen (plester)", "zak", semenPlester, prices.semen);
      rab.item("Pasir (plester)", "m³", pasirPlester, prices.pasir);
      if (entry.pakaiAcian === "ya") rab.item("Semen (acian)", "zak", semenAcian, prices.semen);
      rab.item("Upah plester + acian", "m²", entry.luas, prices.upahPlesterAci, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: entry.luas } };
    },
  });
})();
