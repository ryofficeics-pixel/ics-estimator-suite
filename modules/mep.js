/* ============================================================ MODUL MEP: INSTALASI LISTRIK, INSTALASI AIR BERSIH, SANITAIR ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils;

  window.ICS.modules.instalasiListrik = U.createSimpleModule({
    id: "instalasiListrik", label: "Instalasi Listrik",
    fields: [
      { key: "jumlahLampu", label: "Jumlah titik lampu", unit: "titik", default: 12, step: 1 },
      { key: "jumlahStopKontak", label: "Jumlah stop kontak", unit: "titik", default: 10, step: 1 },
      { key: "jumlahSaklar", label: "Jumlah saklar", unit: "titik", default: 8, step: 1 },
      { key: "panjangKabel", label: "Panjang kabel total", unit: "m", default: 200, step: 5 },
      { key: "jumlahMCB", label: "Jumlah MCB", unit: "unit", default: 4, step: 1 },
      { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const titikTotal = entry.jumlahLampu + entry.jumlahStopKontak + entry.jumlahSaklar;
      const rab = U.createRab();
      rab.group(`Instalasi Listrik — ${titikTotal} titik`);
      rab.item("Kabel NYM", "m", entry.panjangKabel * wasteMul, prices.kabelNYM);
      rab.item("Pipa conduit", "m", entry.panjangKabel * wasteMul, prices.pipaConduit);
      rab.item("Titik lampu", "unit", entry.jumlahLampu, prices.lampu);
      rab.item("Stop kontak", "unit", entry.jumlahStopKontak, prices.stopKontak);
      rab.item("Saklar", "unit", entry.jumlahSaklar, prices.saklar);
      rab.item("MCB", "unit", entry.jumlahMCB, prices.mcb);
      rab.item("Box panel", "unit", 1, prices.boxPanel);
      rab.item("Upah instalasi listrik", "titik", titikTotal, prices.upahListrik, { tipe: "upah" });
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { titikTotal } };
    },
  });

  window.ICS.modules.instalasiAir = U.createSimpleModule({
    id: "instalasiAir", label: "Instalasi Air Bersih",
    fields: [
      { key: "panjangAirBersih", label: "Panjang pipa air bersih", unit: "m", default: 60, step: 5 },
      { key: "panjangBuangan", label: "Panjang pipa buangan", unit: "m", default: 40, step: 5 },
      { key: "jumlahTitikKran", label: "Jumlah titik distribusi", unit: "titik", default: 8, step: 1 },
      { key: "jumlahTandon", label: "Jumlah tandon air", unit: "unit", default: 1, step: 1 },
      { key: "jumlahPompa", label: "Jumlah pompa air", unit: "unit", default: 1, step: 1 },
      { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const jumlahFitting = Math.ceil(((entry.panjangAirBersih + entry.panjangBuangan) / 3) * wasteMul);
      const rab = U.createRab();
      rab.group(`Instalasi Air Bersih & Buangan — ${entry.jumlahTitikKran} titik`);
      rab.item("Pipa PVC air bersih", "m", entry.panjangAirBersih * wasteMul, prices.pipaPVCAirBersih);
      rab.item("Pipa PVC buangan", "m", entry.panjangBuangan * wasteMul, prices.pipaPVCBuangan);
      rab.item("Fitting / sambungan pipa", "set", jumlahFitting, prices.fitting);
      rab.item("Tandon air", "unit", entry.jumlahTandon, prices.tandon);
      if (entry.jumlahPompa > 0) rab.item("Pompa air", "unit", entry.jumlahPompa, prices.pompaAir);
      rab.item("Upah instalasi plumbing", "titik", entry.jumlahTitikKran, prices.upahPlumbing, { tipe: "upah" });
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { jumlahTitikKran: entry.jumlahTitikKran } };
    },
  });

  window.ICS.modules.sanitair = U.createSimpleModule({
    id: "sanitair", label: "Sanitair",
    fields: [
      { key: "jumlahCloset", label: "Jumlah closet duduk", unit: "unit", default: 2, step: 1 },
      { key: "jumlahWastafel", label: "Jumlah wastafel", unit: "unit", default: 2, step: 1 },
      { key: "jumlahShower", label: "Jumlah shower", unit: "unit", default: 2, step: 1 },
      { key: "jumlahKranAir", label: "Jumlah kran air", unit: "unit", default: 4, step: 1 },
      { key: "jumlahFloorDrain", label: "Jumlah floor drain", unit: "unit", default: 2, step: 1 },
    ],
    calcFn(entry, prices) {
      const unitTotal = entry.jumlahCloset + entry.jumlahWastafel + entry.jumlahShower + entry.jumlahKranAir + entry.jumlahFloorDrain;
      const rab = U.createRab();
      rab.group(`Sanitair — ${unitTotal} unit`);
      rab.item("Closet duduk", "unit", entry.jumlahCloset, prices.closetDuduk);
      rab.item("Wastafel", "unit", entry.jumlahWastafel, prices.wastafel);
      rab.item("Shower set", "unit", entry.jumlahShower, prices.shower);
      rab.item("Kran air", "unit", entry.jumlahKranAir, prices.kranAir);
      rab.item("Floor drain", "unit", entry.jumlahFloorDrain, prices.floorDrain);
      rab.item("Upah pasang sanitair", "unit", unitTotal, prices.upahSanitair, { tipe: "upah" });
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { unitTotal } };
    },
  });
})();
