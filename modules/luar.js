/* ============================================================ MODUL PEKERJAAN LUAR: DRAINASE, KANOPI, PAGAR, CARPORT ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils, D = window.ICS.data;
  const baja = U.baja;

  /* ---------------- Drainase (pasangan batu kali U-ditch) ---------------- */
  window.ICS.modules.drainase = U.createSimpleModule({
    id: "drainase", label: "Drainase",
    fields: [
      { key: "panjang", label: "Panjang saluran", unit: "m", default: 20, step: 1 },
      { key: "lebarDalam", label: "Lebar dalam", unit: "m", default: 0.3, step: 0.05 },
      { key: "tinggiDalam", label: "Tinggi dalam", unit: "m", default: 0.4, step: 0.05 },
      { key: "tebalDinding", label: "Tebal dinding pasangan", unit: "m", default: 0.15, step: 0.01 },
      { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const kelilingPenampang = 2 * entry.tinggiDalam + entry.lebarDalam;
      const volumePasangan = entry.panjang * kelilingPenampang * entry.tebalDinding * wasteMul;
      const luasPlester = entry.panjang * kelilingPenampang;
      const semenPasangan = volumePasangan * 3.26, pasirPasangan = volumePasangan * 0.52;
      const semenPlester = luasPlester * 0.092, pasirPlester = luasPlester * 0.018;

      const rab = U.createRab();
      rab.group(`Drainase Pasangan Batu Kali — panjang ${U.fmtNum(entry.panjang)} m`);
      rab.item("Batu kali", "m³", volumePasangan, prices.batuKali);
      rab.item("Semen (pasangan)", "zak", semenPasangan, prices.semen);
      rab.item("Pasir (pasangan)", "m³", pasirPasangan, prices.pasir);
      rab.item("Semen (plester)", "zak", semenPlester, prices.semen);
      rab.item("Pasir (plester)", "m³", pasirPlester, prices.pasir);
      rab.item("Upah pasang batu", "m³", volumePasangan, prices.upahPasangBatu, { tipe: "upah" });
      rab.item("Upah plester saluran", "m²", luasPlester, prices.upahPlesterAci, { tipe: "upah" });

      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { panjang: entry.panjang } };
    },
  });

  /* ---------------- Kanopi & Carport (rangka ringan + penutup) ---------------- */
  const PROFIL_RINGAN_DEFAULT = { hollow: "H40x40", cnp: "C75" };

  function buatModulAtapRingan(id, label, luasDefault) {
    return U.createSimpleModule({
      id, label,
      fields: [
        { key: "luas", label: `Luas ${label.toLowerCase()}`, unit: "m²", default: luasDefault, step: 0.5 },
        { key: "jenisRangka", label: "Jenis rangka", type: "select", default: "bajaRingan", options: [
          { value: "bajaRingan", label: "Baja Ringan" }, { value: "hollow", label: "Hollow" }, { value: "cnp", label: "CNP" },
        ] },
        { key: "jenisPenutup", label: "Jenis penutup", type: "select", default: "spandek", options: [
          { value: "spandek", label: "Spandek" }, { value: "upvcAtap", label: "UPVC" }, { value: "sandwichPanel", label: "Sandwich Panel" },
        ] },
        { key: "koefisienRangka", label: "Koefisien rangka", unit: "m/m²", default: 2.5, step: 0.1 },
        { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
      ],
      calcFn(entry, prices) {
        const wasteMul = 1 + (entry.waste || 0) / 100;
        const panjangRangka = entry.luas * entry.koefisienRangka * wasteMul;
        const rab = U.createRab();
        rab.group(`${label} — luas ${U.fmtNum(entry.luas)} m²`);

        if (entry.jenisRangka === "bajaRingan") {
          rab.item("Baja ringan C75", "m", panjangRangka, prices.bajaRinganPerM);
        } else {
          const keluarga = entry.jenisRangka === "hollow" ? "HOLLOW" : "CNP";
          const profil = baja.calcProfil(keluarga, PROFIL_RINGAN_DEFAULT[entry.jenisRangka], panjangRangka, 1);
          rab.item(`Profil ${profil.label}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
          rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
        }
        rab.item("Penutup atap", "m²", entry.luas * wasteMul, prices[entry.jenisPenutup]);
        rab.item("Upah pasang rangka + penutup", "m²", entry.luas, prices.upahRangkaAtap, { tipe: "upah" });
        rab.item("Upah pasang penutup atap", "m²", entry.luas, prices.upahAtap, { tipe: "upah" });

        return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas: entry.luas } };
      },
    });
  }
  window.ICS.modules.kanopi = buatModulAtapRingan("kanopi", "Kanopi", 12);
  window.ICS.modules.carport = buatModulAtapRingan("carport", "Carport", 24);

  /* ---------------- Pagar ---------------- */
  window.ICS.modules.pagar = U.createSimpleModule({
    id: "pagar", label: "Pagar",
    fields: [
      { key: "panjang", label: "Panjang pagar", unit: "m", default: 25, step: 1 },
      { key: "tinggi", label: "Tinggi pagar", unit: "m", default: 1.8, step: 0.1 },
      { key: "jenis", label: "Jenis pagar", type: "select", default: "tembok", options: [{ value: "tembok", label: "Tembok Bata + Plester" }, { value: "hollow", label: "Besi Hollow" }] },
      { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
    ],
    calcFn(entry, prices) {
      const wasteMul = 1 + (entry.waste || 0) / 100;
      const luas = entry.panjang * entry.tinggi;
      const rab = U.createRab();
      rab.group(`Pagar ${entry.jenis === "tembok" ? "Tembok" : "Besi Hollow"} — panjang ${U.fmtNum(entry.panjang)} m`);

      if (entry.jenis === "tembok") {
        const bata = luas * 70 * wasteMul;
        const semenPasang = luas * 0.10 * wasteMul, pasirPasang = luas * 0.045 * wasteMul;
        const semenPlester = luas * 2 * 0.092 * wasteMul, pasirPlester = luas * 2 * 0.018 * wasteMul; // 2 sisi
        rab.item("Bata merah", "bh", bata, prices.bataMerah);
        rab.item("Semen (pasangan+plester)", "zak", semenPasang + semenPlester, prices.semen);
        rab.item("Pasir (pasangan+plester)", "m³", pasirPasang + pasirPlester, prices.pasir);
        rab.item("Cat tembok (2 sisi)", "kg", luas * 2 * 0.1 * 2 * wasteMul, prices.catTembok);
        rab.item("Upah pasang + plester + cat", "m²", luas * 2, prices.upahPlesterAci, { tipe: "upah" });
      } else {
        const panjangHollow = luas * 2.5 * wasteMul;
        const profil = baja.calcProfil("HOLLOW", "H40x40", panjangHollow, 1);
        rab.item(`Profil ${profil.label}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
        rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
        rab.item("Upah fabrikasi + pasang", "kg", profil.beratTotal, prices.upahFabrikasiBaja, { tipe: "upah" });
      }
      return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { panjang: entry.panjang } };
    },
  });
})();
