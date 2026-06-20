/* ============================================================ MODUL: SLOOF — multi-metode (Beton / CNP Double / IWF) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton, baja = U.baja;

  const METHODS = [
    { key: "beton", label: "Beton Bertulang" },
    { key: "cnpDouble", label: "Baja CNP Double" },
    { key: "iwf", label: "Baja IWF" },
  ];

  const FIELDS_BETON = [
    { key: "lebar", label: "Lebar", unit: "m", default: 0.2, step: 0.01 },
    { key: "tinggi", label: "Tinggi", unit: "m", default: 0.2, step: 0.01 },
    { key: "panjangTotal", label: "Panjang total", unit: "m", default: 20, step: 0.5 },
    { key: "selimut", label: "Selimut beton", unit: "cm", default: 2.5, step: 0.5 },
    { key: "diameterUtama", label: "Diameter utama", type: "select", default: 12,
      options: [8, 10, 12, 13, 16].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jumlahUtama", label: "Jumlah tulangan utama", unit: "btg", default: 4, step: 1 },
    { key: "diameterSengkang", label: "Diameter sengkang", type: "select", default: 8,
      options: [8, 10].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarakSengkang", label: "Jarak sengkang", unit: "mm", default: 150, step: 10 },
    { key: "mutu", label: "Mutu beton", type: "select", default: "K225",
      options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  const FIELDS_CNP = [
    { key: "profilKey", label: "Profil CNP", type: "select", default: "C100", options: baja.opsiProfil("CNP").map((o) => ({ value: o.key, label: o.label })) },
    { key: "panjangTotal", label: "Panjang total", unit: "m", default: 20, step: 0.5 },
    { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
  ];

  const FIELDS_IWF = [
    { key: "profilKey", label: "Profil IWF", type: "select", default: "IWF150", options: baja.opsiProfil("IWF").map((o) => ({ value: o.key, label: o.label })) },
    { key: "panjangTotal", label: "Panjang total", unit: "m", default: 20, step: 0.5 },
    { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
  ];

  function fieldsFor(metode) {
    if (metode === "cnpDouble") return FIELDS_CNP;
    if (metode === "iwf") return FIELDS_IWF;
    return FIELDS_BETON;
  }

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

    const luasBekistingRaw = 2 * entry.tinggi * entry.panjangTotal; // 2 sisi (alas di atas urugan/batu kali)
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);
    const mix = beton.campuranBeton(volumeBeton, entry.mutu, wasteMul);

    const rab = U.createRab();
    rab.group(`Sloof Beton ${U.fmtNum(entry.lebar)}×${U.fmtNum(entry.tinggi)} m — panjang ${U.fmtNum(entry.panjangTotal)} m`);
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

    return {
      rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"),
      warnings: [], summary: { volumeBeton, beratBesi: besi.beratTotal, berat: besi.beratTotal },
    };
  }

  function calcBajaGeneric(entry, prices, keluarga, isDouble) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const panjangEfektif = entry.panjangTotal * (isDouble ? 2 : 1);
    const profil = baja.calcProfil(keluarga, entry.profilKey, panjangEfektif, wasteMul);
    if (!profil) return null;

    const rab = U.createRab();
    let biayaAksesoris = 0, jumlahSambungan;
    if (isDouble) {
      jumlahSambungan = Math.ceil(entry.panjangTotal / D.JARAK_KOPEL_CNP_DOUBLE) + 1;
      rab.group(`Sloof ${profil.label} Double — panjang ${U.fmtNum(entry.panjangTotal)} m`);
      rab.item("Plat kopel", "set", jumlahSambungan, prices.platSambungan);
      rab.item("Baut kopel", "set", jumlahSambungan * D.BAUT_PER_KOPEL, prices.bautMurBaja);
    } else {
      jumlahSambungan = Math.ceil(entry.panjangTotal / D.PANJANG_BATANG_BAJA_PASARAN);
      rab.group(`Sloof ${profil.label} — panjang ${U.fmtNum(entry.panjangTotal)} m`);
      rab.item("Plat sambungan", "set", jumlahSambungan, prices.platSambungan);
      rab.item("Baut sambungan", "set", jumlahSambungan * D.BAUT_PER_SAMBUNGAN, prices.bautMurBaja);
    }
    rab.item(`Profil ${profil.label}${isDouble ? " (double)" : ""}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
    rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
    rab.item("Upah fabrikasi", "kg", profil.beratTotal, prices.upahFabrikasiBaja, { tipe: "upah" });
    rab.item("Upah erection", "kg", profil.beratTotal, prices.upahErectionBaja, { tipe: "upah" });
    rab.item("Upah las", "titik", jumlahSambungan * D.LAS_PER_SAMBUNGAN, prices.upahLas, { tipe: "upah" });

    return {
      rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"),
      warnings: [], summary: { beratBesi: profil.beratTotal, berat: profil.beratTotal },
    };
  }

  function calculateEntry(entry, prices) {
    if (entry.metode === "cnpDouble") return calcBajaGeneric(entry, prices, "CNP", true);
    if (entry.metode === "iwf") return calcBajaGeneric(entry, prices, "IWF", false);
    return calcBeton(entry, prices);
  }

  function renderEntryBody(bodyEl, entry, idx, onChange) {
    const methodRow = document.createElement("div");
    methodRow.className = "field-grid";
    methodRow.style.marginBottom = "10px";
    const methodField = document.createElement("div");
    methodField.className = "field span-2";
    const sel = document.createElement("select");
    METHODS.forEach((m) => { const o = document.createElement("option"); o.value = m.key; o.textContent = m.label; if (m.key === entry.metode) o.selected = true; sel.appendChild(o); });
    sel.addEventListener("change", () => {
      const newEntry = makeDefaultEntry(sel.value);
      Object.assign(entry, newEntry);
      onChange();
    });
    const lbl = document.createElement("label"); lbl.textContent = "Metode konstruksi";
    methodField.appendChild(lbl); methodField.appendChild(sel);
    methodRow.appendChild(methodField);
    bodyEl.appendChild(methodRow);

    const fieldsContainer = document.createElement("div");
    bodyEl.appendChild(fieldsContainer);
    UI.renderFieldGrid(fieldsContainer, fieldsFor(entry.metode), entry, onChange, 3);
  }

  window.ICS.modules.sloof = {
    id: "sloof", label: "Sloof", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("beton"),
        entryLabel: (e, i) => `Sloof #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
        renderEntryBody, onChange,
      });
      const agg = U.aggregateModule(entries, calculateEntry, prices);
      const tableEl = document.createElement("div");
      tableEl.style.marginTop = "16px";
      UI.renderTable(tableEl, agg.rows);

      container.innerHTML = "";
      container.appendChild(shellEl);
      container.appendChild(tableEl);
      return agg;
    },
  };
})();
