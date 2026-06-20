/* ============================================================ MODUL: BALOK — multi-metode (Beton / IWF / H-Beam / CNP Double / Hollow) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton, baja = U.baja;

  const METHODS = [
    { key: "beton", label: "Beton Bertulang" },
    { key: "iwf", label: "Baja IWF" },
    { key: "hbeam", label: "H-Beam" },
    { key: "cnpDouble", label: "CNP Double" },
    { key: "hollow", label: "Hollow" },
  ];
  const METHOD_KELUARGA = { iwf: "IWF", hbeam: "HBEAM", cnpDouble: "CNP", hollow: "HOLLOW" };

  const FIELDS_BETON = [
    { key: "lebar", label: "Lebar balok", unit: "m", default: 0.2, step: 0.01 },
    { key: "tinggi", label: "Tinggi balok", unit: "m", default: 0.35, step: 0.01 },
    { key: "panjangTotal", label: "Panjang per balok", unit: "m", default: 4, step: 0.1 },
    { key: "jumlah", label: "Jumlah balok", unit: "btg", default: 6, step: 1 },
    { key: "selimut", label: "Selimut beton", unit: "cm", default: 2.5, step: 0.5 },
    { key: "diameterAtas", label: "Diameter besi atas", type: "select", default: 12, options: [10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jumlahAtas", label: "Jumlah besi atas", unit: "btg", default: 2, step: 1 },
    { key: "diameterBawah", label: "Diameter besi bawah", type: "select", default: 12, options: [10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jumlahBawah", label: "Jumlah besi bawah", unit: "btg", default: 3, step: 1 },
    { key: "diameterSengkang", label: "Diameter sengkang", type: "select", default: 8, options: [8, 10].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarakSengkang", label: "Jarak sengkang", unit: "mm", default: 150, step: 10 },
    { key: "mutu", label: "Mutu beton", type: "select", default: "K225", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  function fieldsBaja(metode) {
    const keluarga = METHOD_KELUARGA[metode];
    return [
      { key: "profilKey", label: "Profil", type: "select", default: Object.keys(D.profilBaja[keluarga].items)[0], options: baja.opsiProfil(keluarga).map((o) => ({ value: o.key, label: o.label })) },
      { key: "panjangTotal", label: "Panjang per balok", unit: "m", default: 4, step: 0.1 },
      { key: "jumlah", label: "Jumlah balok", unit: "btg", default: 6, step: 1 },
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
    const panjangTotalSemua = entry.panjangTotal * entry.jumlah;
    const volumeBeton = entry.lebar * entry.tinggi * panjangTotalSemua;

    const groups = {};
    groups[entry.diameterAtas] = (groups[entry.diameterAtas] || 0) + entry.jumlahAtas * panjangTotalSemua;
    groups[entry.diameterBawah] = (groups[entry.diameterBawah] || 0) + entry.jumlahBawah * panjangTotalSemua;
    const sengkangSatu = beton.hitungSengkang(entry.panjangTotal, entry.jarakSengkang, entry.lebar, entry.tinggi, selimut_m);
    groups[entry.diameterSengkang] = (groups[entry.diameterSengkang] || 0) + sengkangSatu.totalPanjang * entry.jumlah;
    const besi = beton.gabungkanBesi(groups, wasteMul);
    const bendrat = beton.hitungBendrat(besi.beratTotal);

    const luasBekistingRaw = (entry.lebar + 2 * entry.tinggi) * panjangTotalSemua; // alas + 2 sisi (atas tersambung plat)
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);
    const mix = beton.campuranBeton(volumeBeton, entry.mutu, wasteMul);

    const rab = U.createRab();
    rab.group(`Balok Beton ${U.fmtNum(entry.lebar)}×${U.fmtNum(entry.tinggi)} m × ${U.fmtNum(entry.panjangTotal)} m — ${entry.jumlah} btg`);
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
    const isDouble = metode === "cnpDouble";
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const panjangTotalSemua = entry.panjangTotal * entry.jumlah;
    const panjangEfektif = panjangTotalSemua * (isDouble ? 2 : 1);
    const profil = baja.calcProfil(keluarga, entry.profilKey, panjangEfektif, wasteMul);
    if (!profil) return null;

    const rab = U.createRab();
    let jumlahSambungan;
    rab.group(`Balok ${profil.label}${isDouble ? " (double)" : ""} — ${U.fmtNum(entry.panjangTotal)} m × ${entry.jumlah} btg`);
    if (isDouble) {
      jumlahSambungan = (Math.ceil(entry.panjangTotal / D.JARAK_KOPEL_CNP_DOUBLE) + 1) * entry.jumlah;
      rab.item("Plat kopel", "set", jumlahSambungan, prices.platSambungan);
      rab.item("Baut kopel", "set", jumlahSambungan * D.BAUT_PER_KOPEL, prices.bautMurBaja);
    } else {
      jumlahSambungan = entry.jumlah * 2; // sambungan ke kolom di tiap ujung
      rab.item("Plat sambungan", "set", jumlahSambungan, prices.platSambungan);
      rab.item("Baut sambungan", "set", jumlahSambungan * D.BAUT_PER_SAMBUNGAN, prices.bautMurBaja);
    }
    rab.item(`Profil ${profil.label}${isDouble ? " (double)" : ""}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
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

  window.ICS.modules.balok = {
    id: "balok", label: "Balok", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("beton"),
        entryLabel: (e, i) => `Balok #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
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
