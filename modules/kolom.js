/* ============================================================ MODUL: KOLOM — multi-metode (Beton / IWF / WF Built-Up / H-Beam / CNP Double / Hollow) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton, baja = U.baja;

  const METHODS = [
    { key: "beton", label: "Beton Bertulang" },
    { key: "iwf", label: "Baja IWF" },
    { key: "wfBuiltup", label: "Baja WF Built-Up" },
    { key: "hbeam", label: "H-Beam" },
    { key: "cnpDouble", label: "CNP Double" },
    { key: "hollow", label: "Hollow Galvanis" },
  ];
  const METHOD_KELUARGA = { iwf: "IWF", wfBuiltup: "WF_BUILTUP", hbeam: "HBEAM", cnpDouble: "CNP", hollow: "HOLLOW" };

  const FIELDS_BETON = [
    { key: "lebar", label: "Lebar kolom", unit: "m", default: 0.25, step: 0.01 },
    { key: "dalam", label: "Dalam kolom", unit: "m", default: 0.25, step: 0.01 },
    { key: "tinggi", label: "Tinggi kolom", unit: "m", default: 3.5, step: 0.05 },
    { key: "jumlah", label: "Jumlah kolom", unit: "btg", default: 10, step: 1 },
    { key: "selimut", label: "Selimut beton", unit: "cm", default: 2.5, step: 0.5 },
    { key: "diameterUtama", label: "Diameter utama", type: "select", default: 12, options: [8, 10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jumlahUtama", label: "Jumlah tulangan utama", unit: "btg", default: 4, step: 1 },
    { key: "diameterSengkang", label: "Diameter sengkang", type: "select", default: 8, options: [8, 10].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarakSengkang", label: "Jarak sengkang", unit: "mm", default: 150, step: 10 },
    { key: "mutu", label: "Mutu beton", type: "select", default: "K225", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  function fieldsBaja(metode) {
    const keluarga = METHOD_KELUARGA[metode];
    return [
      { key: "profilKey", label: "Profil", type: "select", default: Object.keys(D.profilBaja[keluarga].items)[0], options: baja.opsiProfil(keluarga).map((o) => ({ value: o.key, label: o.label })) },
      { key: "tinggi", label: "Tinggi kolom", unit: "m", default: 3.5, step: 0.05 },
      { key: "jumlah", label: "Jumlah kolom", unit: "btg", default: 10, step: 1 },
      { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
    ];
  }

  function fieldsFor(metode) { return metode === "beton" ? FIELDS_BETON : fieldsBaja(metode); }

  function makeDefaultEntry(metode) {
    metode = metode || "beton";
    const entry = { metode };
    fieldsFor(metode).forEach((f) => { entry[f.key] = f.default; });
    return entry;
  }

  function calcBeton(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const selimut_m = (entry.selimut || 0) / 100;
    const volumeBeton = entry.lebar * entry.dalam * entry.tinggi * entry.jumlah;

    const groups = {};
    groups[entry.diameterUtama] = (groups[entry.diameterUtama] || 0) + entry.jumlahUtama * entry.tinggi * entry.jumlah;
    const sengkang = beton.hitungSengkang(entry.tinggi, entry.jarakSengkang, entry.lebar, entry.dalam, selimut_m);
    groups[entry.diameterSengkang] = (groups[entry.diameterSengkang] || 0) + sengkang.totalPanjang * entry.jumlah;
    const besi = beton.gabungkanBesi(groups, wasteMul);
    const bendrat = beton.hitungBendrat(besi.beratTotal);

    const luasBekistingRaw = 2 * (entry.lebar + entry.dalam) * entry.tinggi * entry.jumlah;
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);
    const mix = beton.campuranBeton(volumeBeton, entry.mutu, wasteMul);

    const rab = U.createRab();
    rab.group(`Kolom Beton ${U.fmtNum(entry.lebar)}×${U.fmtNum(entry.dalam)} m × ${U.fmtNum(entry.tinggi)} m — ${entry.jumlah} btg`);
    rab.item("Semen", "zak", mix.semen, prices.semen);
    rab.item("Pasir", "m³", mix.pasir, prices.pasir);
    rab.item("Split", "m³", mix.split, prices.split);
    besi.detail.forEach((b) => rab.item(`Besi D${b.diameter} (${b.jumlahBatang} btg×12m)`, "kg", b.berat, prices["besiD" + b.diameter]));
    rab.item("Kawat bendrat", "kg", bendrat, prices.bendrat);
    rab.item("Triplek", "lembar", bek.triplekLembar, prices.triplek);
    rab.item("Kayu kaso bekisting", "m", bek.kasoMeter, prices.kasoBekisting);
    rab.item("Paku", "kg", bek.pakuKg, prices.paku);
    rab.item("Upah bekisting", "m²", bek.luasRaw, prices.upahBekisting, { tipe: "upah" });
    rab.item("Upah pembesian", "kg", besi.beratTotal, prices.upahPembesian, { tipe: "upah" });
    rab.item("Upah pengecoran", "m³", volumeBeton, prices.upahPengecoran, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { volumeBeton, berat: besi.beratTotal } };
  }

  function calcBajaKolom(entry, prices, metode) {
    const keluarga = METHOD_KELUARGA[metode];
    const isDouble = metode === "cnpDouble";
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const panjangEfektif = entry.tinggi * entry.jumlah * (isDouble ? 2 : 1);
    const profil = baja.calcProfil(keluarga, entry.profilKey, panjangEfektif, wasteMul);
    if (!profil) return null;

    const warnings = [];
    if (entry.tinggi > 6) warnings.push(`Tinggi kolom ${U.fmtNum(entry.tinggi)} m melebihi panjang batang pasaran (6m) — perlu sambungan tambahan, belum dihitung otomatis.`);

    const rab = U.createRab();
    rab.group(`Kolom ${profil.label}${isDouble ? " (double)" : ""} — tinggi ${U.fmtNum(entry.tinggi)} m × ${entry.jumlah} btg`);
    rab.item(`Profil ${profil.label}${isDouble ? " (double)" : ""}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
    rab.item("Baseplate", "set", entry.jumlah, prices.baseplate);
    rab.item("Angkur baut", "btg", entry.jumlah * D.ANGKUR_PER_KOLOM, prices.angkur);
    if (isDouble) {
      const kopelPerKolom = Math.ceil(entry.tinggi / D.JARAK_KOPEL_CNP_DOUBLE) + 1;
      rab.item("Plat kopel", "set", kopelPerKolom * entry.jumlah, prices.platSambungan);
      rab.item("Baut kopel", "set", kopelPerKolom * entry.jumlah * D.BAUT_PER_KOPEL, prices.bautMurBaja);
    }
    rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
    rab.item("Upah fabrikasi", "kg", profil.beratTotal, prices.upahFabrikasiBaja, { tipe: "upah" });
    rab.item("Upah erection", "kg", profil.beratTotal, prices.upahErectionBaja, { tipe: "upah" });
    rab.item("Upah las", "titik", entry.jumlah * 2, prices.upahLas, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings, summary: { berat: profil.beratTotal } };
  }

  function calculateEntry(entry, prices) {
    if (entry.metode === "beton") return calcBeton(entry, prices);
    return calcBajaKolom(entry, prices, entry.metode);
  }

  function renderEntryBody(bodyEl, entry, idx, onChange) {
    const methodField = document.createElement("div");
    methodField.className = "field-grid"; methodField.style.marginBottom = "10px";
    const f = document.createElement("div"); f.className = "field span-2";
    const sel = document.createElement("select");
    METHODS.forEach((m) => { const o = document.createElement("option"); o.value = m.key; o.textContent = m.label; if (m.key === entry.metode) o.selected = true; sel.appendChild(o); });
    sel.addEventListener("change", () => { Object.assign(entry, makeDefaultEntry(sel.value)); onChange(); });
    const lbl = document.createElement("label"); lbl.textContent = "Metode konstruksi";
    f.appendChild(lbl); f.appendChild(sel); methodField.appendChild(f);
    bodyEl.appendChild(methodField);

    const fc = document.createElement("div");
    bodyEl.appendChild(fc);
    UI.renderFieldGrid(fc, fieldsFor(entry.metode), entry, onChange, 3);
  }

  window.ICS.modules.kolom = {
    id: "kolom", label: "Kolom", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("beton"),
        entryLabel: (e, i) => `Kolom #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
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
