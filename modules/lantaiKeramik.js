/* ============================================================ MODUL: LANTAI KERAMIK (+ alternatif Granit/Homogeneous/Vinyl/Epoxy) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;

  window.ICS.modules.lantaiKeramik = U.createSimpleModule({
    id: "lantaiKeramik", label: "Lantai Keramik",
    fields: [
      { key: "luas", label: "Luas lantai", unit: "m²", default: 30, step: 1 },
      { key: "tipe", label: "Jenis penutup lantai", type: "select", default: "keramik", options: [
        { value: "keramik", label: "Keramik 40x40" }, { value: "granit", label: "Granit Tile" },
        { value: "homogeneousTile", label: "Homogeneous Tile" }, { value: "vinyl", label: "Vinyl" }, { value: "epoxy", label: "Epoxy Coating" },
      ] },
      { key: "waste", label: "Waste factor", unit: "%", default: 8, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const rab = U.createRab();
      rab.group(`Lantai ${entry.tipe === "keramik" ? "Keramik" : entry.tipe} — luas ${U.fmtNum(entry.luas)} m²`);

      if (entry.tipe === "keramik") {
        const dus = (entry.luas / 1.44) * wasteMul;
        rab.item("Keramik 40x40", "dus", dus, prices.keramik);
        rab.item("Semen perekat keramik", "zak", entry.luas / 6, prices.semenPerekatKeramik);
        rab.item("Nat keramik", "kg", entry.luas * 0.3, prices.nat);
      } else if (entry.tipe === "granit" || entry.tipe === "homogeneousTile") {
        const harga = entry.tipe === "granit" ? prices.granit : prices.homogeneousTile;
        rab.item(entry.tipe === "granit" ? "Granit tile" : "Homogeneous tile", "m²", entry.luas * wasteMul, harga);
        rab.item("Semen perekat", "zak", entry.luas / 5, prices.semenPerekatKeramik);
        rab.item("Nat", "kg", entry.luas * 0.25, prices.nat);
      } else if (entry.tipe === "vinyl") {
        rab.item("Vinyl lantai", "m²", entry.luas * wasteMul, prices.vinyl);
      } else if (entry.tipe === "epoxy") {
        rab.item("Epoxy coating", "m²", entry.luas * wasteMul, prices.epoxy);
      }
      rab.item("Upah pasang lantai", "m²", entry.luas, prices.upahKeramik, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: entry.luas } };
    },
  });
})();
