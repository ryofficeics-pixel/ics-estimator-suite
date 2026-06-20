/* ============================================================ MODUL: RING BALOK — multi-metode (Beton / CNP / Hollow / IWF) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton, baja = U.baja;

  const METHODS = [
    { key: "beton", label: "Beton Bertulang" },
    { key: "cnp", label: "Baja CNP" },
    { key: "hollow", label: "Baja Hollow" },
    { key: "iwf", label: "Baja IWF" },
  ];
  const METHOD_KELUARGA = { cnp: "CNP", hollow: "HOLLOW", iwf: "IWF" };

  const FIELDS_BETON = [
    { key: "lebar", label: "Lebar", unit: "m", default: 0.15, step: 0.01 },
    { key: "tinggi", label: "Tinggi", unit: "m", default: 0.15, step: 0.01 },
    { key: "panjangTotal", label: "Panjang total", unit: "m", default: 30, step: 0.5 },
    { key: "selimut", label: "Selimut beton", unit: "cm", default: 2, step: 0.5 },
    { key: "diameterUtama", label: "Diameter utama", type: "select", default: 10, options: [8, 10, 12].map((d) => ({ value: d, label: "D" + d })) },
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
      { key: "panjangTotal", label: "Panjang total", unit: "m", default: 30, step: 0.5 },
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
    const volumeBeton = entry.lebar * entry.tinggi * entry.panjangTotal;

    const groups = {};
    groups[entry.diameterUtama] = (groups[entry.diameterUtama] || 0) + entry.jumlahUtama * entry.panjangTotal;
    const sengkang = beton.hitungSengkang(entry.panjangTotal, entry.jarakSengkang, entry.lebar, entry.tinggi, selimut_m);
    groups[entry.diameterSengkang] = (groups[entry.diameterSengkang] || 0) + sengkang.totalPanjang;
    const besi = beton.gabungkanBesi(groups, wasteMul);
    const bendrat = beton.hitungBendrat(besi.beratTotal);

    const luasBekistingRaw = 2 * entry.tinggi * entry.panjangTotal; // dicor di atas pasangan bata, 2 sisi
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);
    const mix = beton.campuranBeton(volumeBeton, entry.mutu, wasteMul);

    const rab = U.createRab();
    rab.group(`Ring Balok Beton ${U.fmtNum(entry.lebar)}×${U.fmtNum(entry.tinggi)} m — panjang ${U.fmtNum(entry.panjangTotal)} m`);
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

  function calcBaja(entry, prices, metode) {
    const keluarga = METHOD_KELUARGA[metode];
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const profil = baja.calcProfil(keluarga, entry.profilKey, entry.panjangTotal, wasteMul);
    if (!profil) return null;
    const jumlahSambungan = Math.ceil(entry.panjangTotal / D.PANJANG_BATANG_BAJA_PASARAN);

    const rab = U.createRab();
    rab.group(`Ring Balok ${profil.label} — panjang ${U.fmtNum(entry.panjangTotal)} m`);
    rab.item(`Profil ${profil.label}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
    rab.item("Plat sambungan", "set", jumlahSambungan, prices.platSambungan);
    rab.item("Baut sambungan", "set", jumlahSambungan * D.BAUT_PER_SAMBUNGAN, prices.bautMurBaja);
    rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
    rab.item("Upah fabrikasi", "kg", profil.beratTotal, prices.upahFabrikasiBaja, { tipe: "upah" });
    rab.item("Upah erection", "kg", profil.beratTotal, prices.upahErectionBaja, { tipe: "upah" });
    rab.item("Upah las", "titik", jumlahSambungan * D.LAS_PER_SAMBUNGAN, prices.upahLas, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { berat: profil.beratTotal } };
  }

  function calculateEntry(entry, prices) {
    return entry.metode === "beton" ? calcBeton(entry, prices) : calcBaja(entry, prices, entry.metode);
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

  window.ICS.modules.ringbalok = {
    id: "ringbalok", label: "Ring Balok", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("beton"),
        entryLabel: (e, i) => `Ring Balok #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
        renderEntryBody, onChange,
      });
      const agg = U.aggregateModule(entries, calculateEntry, prices);
      const tableEl = document.createElement("div"); tableEl.style.marginTop = "16px";
      UI.renderTable(tableEl, agg.rows);
      container.innerHTML = "";
      container.appendChild(shellEl);
      container.appendChild(tableEl);
      return agg;
    },
  };
})();
