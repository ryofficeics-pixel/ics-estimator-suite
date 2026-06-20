/* ============================================================ MODUL: DINDING BATA MERAH & DINDING HEBEL ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;

  const FIELDS_COMMON = [
    { key: "panjang", label: "Panjang dinding", unit: "m", default: 10, step: 0.1 },
    { key: "tinggi", label: "Tinggi dinding", unit: "m", default: 3, step: 0.1 },
    { key: "luasBukaan", label: "Luas dikurangi (pintu/jendela)", unit: "m²", default: 0, step: 0.1 },
    { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
  ];

  window.ICS.modules.dindingBata = U.createSimpleModule({
    id: "dindingBata", label: "Dinding Bata Merah",
    fields: [
      FIELDS_COMMON[0], FIELDS_COMMON[1], FIELDS_COMMON[2],
      { key: "tebalDinding", label: "Tebal dinding", type: "select", default: "halfBata", options: [{ value: "halfBata", label: "1/2 Bata" }, { value: "fullBata", label: "1 Bata" }] },
      FIELDS_COMMON[3],
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const luasBersih = Math.max(entry.panjang * entry.tinggi - entry.luasBukaan, 0);
      const isFullBata = entry.tebalDinding === "fullBata";
      const bataPerM2 = isFullBata ? 140 : 70;
      const semenPerM2 = isFullBata ? 0.18 : 0.10;
      const pasirPerM2 = isFullBata ? 0.08 : 0.045;

      const jumlahBata = luasBersih * bataPerM2 * wasteMul;
      const semen = luasBersih * semenPerM2 * wasteMul;
      const pasir = luasBersih * pasirPerM2 * wasteMul;

      const rab = U.createRab();
      rab.group(`Dinding Bata Merah (${isFullBata ? "1 Bata" : "1/2 Bata"}) — luas ${U.fmtNum(luasBersih)} m²`);
      rab.item("Bata merah", "bh", jumlahBata, prices.bataMerah);
      rab.item("Semen (spesi)", "zak", semen, prices.semen);
      rab.item("Pasir (spesi)", "m³", pasir, prices.pasir);
      rab.item("Upah pasang bata", "m²", luasBersih, prices.upahPasangBata, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: luasBersih } };
    },
  });

  window.ICS.modules.dindingHebel = U.createSimpleModule({
    id: "dindingHebel", label: "Dinding Hebel",
    fields: FIELDS_COMMON,
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const luasBersih = Math.max(entry.panjang * entry.tinggi - entry.luasBukaan, 0);
      const jumlahHebel = (luasBersih / 0.12) * wasteMul; // blok 60x20cm = 0.12 m2/blok
      const perekatZak = (luasBersih * 3.5 / 40) * wasteMul; // ~3.5kg/m2, zak 40kg

      const rab = U.createRab();
      rab.group(`Dinding Hebel — luas ${U.fmtNum(luasBersih)} m²`);
      rab.item("Hebel / bata ringan AAC", "bh", jumlahHebel, prices.hebel);
      rab.item("Semen instan perekat hebel", "zak", perekatZak, prices.perekatHebel);
      rab.item("Upah pasang hebel", "m²", luasBersih, prices.upahPasangBata, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: luasBersih } };
    },
  });
})();
