/* ============================================================
   MODUL: PONDASI FOOTPLAT — beton bertulang (single metode)
   Logika kalkulasi identik dengan engine standalone footplat
   estimator yang sudah divalidasi sebelumnya (volume, tulangan
   jaring 2 arah, starter kolom, bekisting, galian/urugan).
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton;

  const METHODS = [{ key: "beton", label: "Beton Bertulang" }];

  const FIELDS = [
    { key: "panjang", label: "Panjang footplat", unit: "m", default: 1.2, step: 0.05 },
    { key: "lebar", label: "Lebar footplat", unit: "m", default: 1.2, step: 0.05 },
    { key: "tebal", label: "Tebal footplat", unit: "m", default: 0.5, step: 0.05 },
    { key: "jumlah", label: "Jumlah titik", unit: "titik", default: 8, step: 1 },
    { key: "tebalLantaiKerja", label: "Tebal lantai kerja", unit: "cm", default: 5, step: 0.5 },
    { key: "selimut", label: "Selimut beton", unit: "cm", default: 5, step: 0.5 },
    { key: "galianPanjang", label: "Panjang galian", unit: "m", default: 1.5, step: 0.05 },
    { key: "galianLebar", label: "Lebar galian", unit: "m", default: 1.5, step: 0.05 },
    { key: "galianKedalaman", label: "Kedalaman galian", unit: "m", default: 0.65, step: 0.05 },
    { key: "diameterBawah", label: "Diameter tulangan bawah", type: "select", default: 10, options: [8, 10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarakBawah", label: "Jarak tulangan bawah", unit: "mm", default: 150, step: 10 },
    { key: "tulanganAtasAktif", label: "Tulangan atas (rangkap)", type: "select", default: "tidak", options: [{ value: "ya", label: "Ya" }, { value: "tidak", label: "Tidak" }] },
    { key: "diameterAtas", label: "Diameter tulangan atas", type: "select", default: 10, options: [8, 10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarakAtas", label: "Jarak tulangan atas", unit: "mm", default: 150, step: 10 },
    { key: "jumlahStarter", label: "Jumlah besi starter kolom", unit: "btg", default: 4, step: 1 },
    { key: "diameterStarter", label: "Diameter besi starter", type: "select", default: 10, options: [8, 10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "tinggiStarter", label: "Tinggi besi starter", unit: "m", default: 1.0, step: 0.1 },
    { key: "mutu", label: "Mutu beton", type: "select", default: "K225", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  function makeDefaultEntry() {
    const entry = { metode: "beton" };
    FIELDS.forEach((f) => { entry[f.key] = f.default; });
    return entry;
  }

  function calculateEntry(entry, prices) {
    const warnings = [];
    if (entry.panjang <= 0 || entry.lebar <= 0 || entry.tebal <= 0 || entry.jumlah <= 0) {
      warnings.push("Dimensi footplat / jumlah titik harus lebih besar dari 0.");
    }
    if (entry.galianPanjang < entry.panjang || entry.galianLebar < entry.lebar) {
      warnings.push("Dimensi galian lebih kecil dari dimensi footplat — periksa kembali input.");
    }

    const wasteMul = 1 + (entry.waste || 0) / 100;
    const selimut_m = (entry.selimut || 0) / 100;

    const volBeton = entry.panjang * entry.lebar * entry.tebal * entry.jumlah;
    const volLantaiKerja = entry.panjang * entry.lebar * (entry.tebalLantaiKerja / 100) * entry.jumlah;
    const volGalian = entry.galianPanjang * entry.galianLebar * entry.galianKedalaman * entry.jumlah;
    const volUrugan = Math.max(0, volGalian - volBeton - volLantaiKerja);

    const mixBeton = beton.campuranBeton(volBeton, entry.mutu, wasteMul);
    const mixLK = beton.campuranLantaiKerja(volLantaiKerja, wasteMul);
    const semenTotal = mixBeton.semen + mixLK.semen;
    const pasirTotal = mixBeton.pasir + mixLK.pasir;
    const splitTotal = mixBeton.split + mixLK.split;

    const bawah = beton.hitungJaringTulangan(entry.jarakBawah, entry.panjang, entry.lebar, selimut_m);
    const panjangBawahTotal = bawah.totalPanjang * entry.jumlah;
    let panjangAtasTotal = 0;
    if (entry.tulanganAtasAktif === "ya") {
      const atas = beton.hitungJaringTulangan(entry.jarakAtas, entry.panjang, entry.lebar, selimut_m);
      panjangAtasTotal = atas.totalPanjang * entry.jumlah;
    }
    const panjangStarterTotal = entry.jumlahStarter * entry.tinggiStarter * entry.jumlah;

    const groups = {};
    const addBesi = (d, p) => { groups[d] = (groups[d] || 0) + p; };
    addBesi(entry.diameterBawah, panjangBawahTotal);
    if (entry.tulanganAtasAktif === "ya") addBesi(entry.diameterAtas, panjangAtasTotal);
    addBesi(entry.diameterStarter, panjangStarterTotal);
    const besi = beton.gabungkanBesi(groups, wasteMul);
    const bendrat = beton.hitungBendrat(besi.beratTotal);

    const luasBekistingRaw = entry.jumlah * (2 * (entry.panjang * entry.tebal) + 2 * (entry.lebar * entry.tebal));
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);

    const rab = U.createRab();
    rab.group(`Pondasi Footplat ${U.fmtNum(entry.panjang)}×${U.fmtNum(entry.lebar)}×${U.fmtNum(entry.tebal)} m — ${entry.jumlah} titik`);
    rab.item("Galian tanah pondasi", "m³", volGalian, prices.upahGali, { tipe: "upah" });
    rab.item("Urugan kembali", "m³", volUrugan, prices.upahGali, { tipe: "upah", note: "asumsi tarif sama dengan galian" });
    rab.item("Semen", "zak", semenTotal, prices.semen);
    rab.item("Pasir", "m³", pasirTotal, prices.pasir);
    rab.item("Split", "m³", splitTotal, prices.split);
    rab.item("Upah pengecoran", "m³", volBeton + volLantaiKerja, prices.upahPengecoran, { tipe: "upah" });
    besi.detail.forEach((b) => rab.item(`Besi D${b.diameter} (${b.jumlahBatang} btg×12m)`, "kg", b.berat, prices["besiD" + b.diameter]));
    rab.item("Kawat bendrat", "kg", bendrat, prices.bendrat);
    rab.item("Upah pembesian", "kg", besi.beratTotal, prices.upahPembesian, { tipe: "upah" });
    rab.item("Triplek", "lembar", bek.triplekLembar, prices.triplek);
    rab.item("Kayu kaso", "m", bek.kasoMeter, prices.kasoBekisting);
    rab.item("Paku", "kg", bek.pakuKg, prices.paku);
    rab.item("Upah bekisting", "m²", bek.luasRaw, prices.upahBekisting, { tipe: "upah" });

    return {
      rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"),
      warnings, summary: { volumeBeton: volBeton, berat: besi.beratTotal, volGalian, volUrugan },
    };
  }

  function renderEntryBody(bodyEl, entry, idx, onChange) {
    UI.renderFieldGrid(bodyEl, FIELDS, entry, onChange, 3);
  }

  window.ICS.modules.pondasi = {
    id: "pondasi", label: "Pondasi Footplat", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry,
        entryLabel: (e, i) => `Footplat #${i + 1} — ${U.fmtNum(e.panjang)}×${U.fmtNum(e.lebar)}×${U.fmtNum(e.tebal)} m`,
        renderEntryBody, onChange,
      });
      const agg = U.aggregateModule(entries, calculateEntry, prices);
      const tableEl = document.createElement("div"); tableEl.style.marginTop = "16px";
      UI.renderTable(tableEl, agg.rows);
      const alertEl = document.createElement("div");
      UI.renderAlerts(alertEl, agg.warnings);
      container.innerHTML = "";
      container.appendChild(shellEl);
      container.appendChild(alertEl);
      container.appendChild(tableEl);
      return agg;
    },
  };
})();
