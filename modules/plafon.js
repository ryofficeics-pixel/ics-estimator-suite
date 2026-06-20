/* ============================================================ MODUL: PLAFON GYPSUM (termasuk rangka hollow — "Rangka Hollow Plafon" di sidebar adalah alias ke modul ini) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;
  const PRICE_KEY = { gypsum: "gypsum", pvc: "pvcPlafon", grc: "grcPlafon", kalsiboard: "kalsiboard" };
  const LABEL = { gypsum: "Gypsum Board", pvc: "PVC Plafon", grc: "GRC Board", kalsiboard: "Kalsiboard" };

  window.ICS.modules.plafonGypsum = U.createSimpleModule({
    id: "plafonGypsum", label: "Plafon Gypsum",
    fields: [
      { key: "luas", label: "Luas plafon", unit: "m²", default: 40, step: 1 },
      { key: "jenisPenutup", label: "Jenis penutup", type: "select", default: "gypsum", options: Object.keys(LABEL).map((k) => ({ value: k, label: LABEL[k] })) },
      { key: "koefisienHollow", label: "Koefisien rangka hollow", unit: "m/m²", default: 3.0, step: 0.1 },
      { key: "kelilingRuangan", label: "Keliling ruangan (utk list plafon)", unit: "m", default: 24, step: 1 },
      { key: "waste", label: "Waste factor", unit: "%", default: 8, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const lembar = (entry.luas / 2.88) * wasteMul;
      const panjangHollow = entry.luas * entry.koefisienHollow * wasteMul;
      const sekrup = Math.ceil(panjangHollow / 0.5);

      const rab = U.createRab();
      rab.group(`Plafon ${LABEL[entry.jenisPenutup]} + Rangka Hollow — luas ${U.fmtNum(entry.luas)} m²`);
      rab.item(LABEL[entry.jenisPenutup], "lembar", lembar, prices[PRICE_KEY[entry.jenisPenutup]]);
      rab.item("Hollow rangka plafon", "m", panjangHollow, prices.hollowPlafon);
      rab.item("Sekrup plafon", "pcs", sekrup, prices.sekrupPlafon);
      rab.item("List plafon", "m", entry.kelilingRuangan, prices.listPlafon);
      rab.item("Upah pasang plafon", "m²", entry.luas, prices.upahPlafon, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: entry.luas } };
    },
  });
})();
