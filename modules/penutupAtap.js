/* ============================================================ MODUL: PENUTUP ATAP (Spandek / Genteng — & alternatif lain) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;
  const OPSI = [
    { value: "spandek", label: "Spandek" }, { value: "spandekPasir", label: "Spandek Pasir" },
    { value: "gentengMetal", label: "Genteng Metal" }, { value: "gentengBeton", label: "Genteng Beton" },
    { value: "zincalume", label: "Zincalume" }, { value: "upvcAtap", label: "UPVC" }, { value: "sandwichPanel", label: "Sandwich Panel" },
  ];
  const PER_M2_KEYS = ["spandek", "spandekPasir", "zincalume", "upvcAtap", "sandwichPanel"];

  function buatModulPenutupAtap(id, label, defaultJenis) {
    return U.createSimpleModule({
      id, label,
      fields: [
        { key: "luasAtap", label: "Luas atap", unit: "m²", default: 80, step: 1 },
        { key: "jenis", label: "Jenis penutup", type: "select", default: defaultJenis, options: OPSI },
        { key: "panjangNok", label: "Panjang nok (bubungan)", unit: "m", default: 10, step: 0.5 },
        { key: "waste", label: "Waste factor", unit: "%", default: 8, step: 1 },
      ],
      calcFn(entry, prices) {
        const wasteMul = 1 + (entry.waste || 0) / 100;
        const rab = U.createRab();
        rab.group(`Penutup Atap ${OPSI.find((o) => o.value === entry.jenis).label} — luas ${U.fmtNum(entry.luasAtap)} m²`);

        if (PER_M2_KEYS.includes(entry.jenis)) {
          rab.item(OPSI.find((o) => o.value === entry.jenis).label, "m²", entry.luasAtap * wasteMul, prices[entry.jenis]);
        } else if (entry.jenis === "gentengMetal") {
          rab.item("Genteng metal", "lembar", (entry.luasAtap / 0.5) * wasteMul, prices.gentengMetal);
        } else if (entry.jenis === "gentengBeton") {
          rab.item("Genteng beton", "bh", (entry.luasAtap / 0.083) * wasteMul, prices.gentengBeton);
        }
        rab.item("Nok atap", "m", entry.panjangNok, prices.nok);
        rab.item("Sekrup atap", "pcs", Math.ceil(entry.luasAtap * 8 * wasteMul), prices.sekrupAtap);
        rab.item("Upah pasang penutup atap", "m²", entry.luasAtap, prices.upahAtap, { tipe: "upah" });

        return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luasAtap: entry.luasAtap } };
      },
    });
  }

  window.ICS.modules.atapSpandek = buatModulPenutupAtap("atapSpandek", "Atap Spandek", "spandek");
  window.ICS.modules.atapGenteng = buatModulPenutupAtap("atapGenteng", "Atap Genteng", "gentengMetal");
})();
