/* ============================================================ MODUL: KUSEN ALUMINIUM, KUSEN KAYU, PINTU, JENDELA ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;

  function buatModulKusen(id, label, priceKey) {
    return U.createSimpleModule({
      id, label,
      fields: [
        { key: "jumlahSet", label: "Jumlah set", unit: "set", default: 4, step: 1 },
        { key: "kelilingPerSet", label: "Keliling per set", unit: "m", default: 5, step: 0.1 },
        { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
      ],
      calcFn(entry, prices) {
        const wasteMul = 1 + (entry.waste || 0) / 100;
        const panjangTotal = entry.jumlahSet * entry.kelilingPerSet * wasteMul;
        const rab = U.createRab();
        rab.group(`${label} — ${entry.jumlahSet} set`);
        rab.item(label, "m", panjangTotal, prices[priceKey]);
        rab.item("Upah pasang kusen", "set", entry.jumlahSet, prices.upahKusen, { tipe: "upah" });
        return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { jumlahSet: entry.jumlahSet } };
      },
    });
  }
  window.ICS.modules.kusenAluminium = buatModulKusen("kusenAluminium", "Kusen Aluminium", "kusenAluminium");
  window.ICS.modules.kusenKayu = buatModulKusen("kusenKayu", "Kusen Kayu", "kusenKayu");

  window.ICS.modules.pintu = U.createSimpleModule({
    id: "pintu", label: "Pintu",
    fields: [
      { key: "jumlah", label: "Jumlah pintu", unit: "unit", default: 6, step: 1 },
      { key: "jenis", label: "Jenis daun pintu", type: "select", default: "daunPintuKayu", options: [
        { value: "daunPintuKayu", label: "Kayu" }, { value: "daunPintuAluminium", label: "Aluminium" },
        { value: "daunPintuUPVC", label: "UPVC" }, { value: "daunPintuKacaFrameless", label: "Kaca Frameless" }, { value: "daunPintuHollow", label: "Besi Hollow" },
      ] },
      { key: "pakaiKusen", label: "Termasuk kusen baru", type: "select", default: "ya", options: [{ value: "ya", label: "Ya" }, { value: "tidak", label: "Tidak (pakai kusen existing)" }] },
      { key: "kelilingKusen", label: "Keliling kusen per unit", unit: "m", default: 5, step: 0.1 },
    ],
    calcFn(entry, prices) {
      const rab = U.createRab();
      rab.group(`Pintu — ${entry.jumlah} unit`);
      rab.item("Daun pintu", "unit", entry.jumlah, prices[entry.jenis]);
      if (entry.pakaiKusen === "ya") rab.item("Kusen kayu", "m", entry.jumlah * entry.kelilingKusen, prices.kusenKayu);
      rab.item("Aksesoris (engsel/handle/kunci)", "set", entry.jumlah, prices.aksesorisKusen);
      rab.item("Upah pasang pintu", "unit", entry.jumlah, prices.upahKusen, { tipe: "upah" });
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { jumlah: entry.jumlah } };
    },
  });

  window.ICS.modules.jendela = U.createSimpleModule({
    id: "jendela", label: "Jendela",
    fields: [
      { key: "jumlah", label: "Jumlah jendela", unit: "unit", default: 8, step: 1 },
      { key: "jenis", label: "Jenis jendela", type: "select", default: "jendelaAluminium", options: [
        { value: "jendelaAluminium", label: "Aluminium" }, { value: "jendelaUPVC", label: "UPVC" }, { value: "jendelaKayu", label: "Kayu" },
      ] },
    ],
    calcFn(entry, prices) {
      const rab = U.createRab();
      rab.group(`Jendela — ${entry.jumlah} unit`);
      rab.item("Jendela (set lengkap+kaca)", "unit", entry.jumlah, prices[entry.jenis]);
      rab.item("Aksesoris (handle/kunci)", "set", entry.jumlah, prices.aksesorisKusen);
      rab.item("Upah pasang jendela", "unit", entry.jumlah, prices.upahKusen, { tipe: "upah" });
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { jumlah: entry.jumlah } };
    },
  });
})();
