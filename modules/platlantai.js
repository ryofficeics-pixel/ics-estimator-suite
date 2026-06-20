/* ============================================================ MODUL: PLAT LANTAI — multi-metode (Cor konvensional / Bondek+Wiremesh / Floordeck / Panel Precast) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton;

  const METHODS = [
    { key: "cor", label: "Plat Beton Cor" },
    { key: "bondek", label: "Bondek + Wiremesh" },
    { key: "floordeck", label: "Floordeck + Topping" },
    { key: "precast", label: "Panel Precast" },
  ];

  const FIELDS_COR = [
    { key: "panjang", label: "Panjang", unit: "m", default: 6, step: 0.1 },
    { key: "lebar", label: "Lebar", unit: "m", default: 5, step: 0.1 },
    { key: "tebal", label: "Tebal plat", unit: "cm", default: 12, step: 0.5 },
    { key: "selimut", label: "Selimut beton", unit: "cm", default: 2, step: 0.5 },
    { key: "diameter", label: "Diameter tulangan", type: "select", default: 10, options: [8, 10, 12].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarak", label: "Jarak tulangan", unit: "mm", default: 150, step: 10 },
    { key: "duaLapis", label: "Tulangan 2 lapis (atas+bawah)", type: "select", default: "ya", options: [{ value: "ya", label: "Ya" }, { value: "tidak", label: "Tidak, 1 lapis" }] },
    { key: "mutu", label: "Mutu beton", type: "select", default: "K250", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  const FIELDS_BONDEK = [
    { key: "panjang", label: "Panjang", unit: "m", default: 6, step: 0.1 },
    { key: "lebar", label: "Lebar", unit: "m", default: 5, step: 0.1 },
    { key: "tebalTopping", label: "Tebal topping beton", unit: "cm", default: 7, step: 0.5 },
    { key: "mutu", label: "Mutu beton topping", type: "select", default: "K225", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  const FIELDS_FLOORDECK = [
    { key: "panjang", label: "Panjang", unit: "m", default: 6, step: 0.1 },
    { key: "lebar", label: "Lebar", unit: "m", default: 5, step: 0.1 },
    { key: "tebalTopping", label: "Tebal topping beton", unit: "cm", default: 10, step: 0.5 },
    { key: "mutu", label: "Mutu beton topping", type: "select", default: "K250", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ];

  const FIELDS_PRECAST = [
    { key: "panjang", label: "Panjang", unit: "m", default: 6, step: 0.1 },
    { key: "lebar", label: "Lebar", unit: "m", default: 5, step: 0.1 },
    { key: "waste", label: "Waste factor", unit: "%", default: 3, step: 1 },
  ];

  function fieldsFor(metode) {
    return { cor: FIELDS_COR, bondek: FIELDS_BONDEK, floordeck: FIELDS_FLOORDECK, precast: FIELDS_PRECAST }[metode];
  }
  function makeDefaultEntry(metode) {
    metode = metode || "cor";
    const entry = { metode };
    fieldsFor(metode).forEach((f) => { entry[f.key] = f.default; });
    return entry;
  }

  function calcCor(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const selimut_m = (entry.selimut || 0) / 100;
    const volumeBeton = entry.panjang * entry.lebar * (entry.tebal / 100);
    const lapis = entry.duaLapis === "ya" ? 2 : 1;

    const mesh = beton.hitungJaringTulangan(entry.jarak, entry.panjang, entry.lebar, selimut_m);
    const groups = {}; groups[entry.diameter] = mesh.totalPanjang * lapis;
    const besi = beton.gabungkanBesi(groups, wasteMul);
    const bendrat = beton.hitungBendrat(besi.beratTotal);
    const mix = beton.campuranBeton(volumeBeton, entry.mutu, wasteMul);
    const luasBekistingRaw = entry.panjang * entry.lebar; // bekisting bawah (perancah/suri-suri disederhanakan sbg luas dasar)
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);

    const rab = U.createRab();
    rab.group(`Plat Lantai Cor ${U.fmtNum(entry.panjang)}×${U.fmtNum(entry.lebar)} m, tebal ${entry.tebal}cm`);
    rab.item("Semen", "zak", mix.semen, prices.semen);
    rab.item("Pasir", "m³", mix.pasir, prices.pasir);
    rab.item("Split", "m³", mix.split, prices.split);
    besi.detail.forEach((b) => rab.item(`Besi D${b.diameter} (${b.jumlahBatang} btg×12m)`, "kg", b.berat, prices["besiD" + b.diameter]));
    rab.item("Kawat bendrat", "kg", bendrat, prices.bendrat);
    rab.item("Triplek + perancah", "lembar", bek.triplekLembar, prices.triplek);
    rab.item("Kayu kaso bekisting", "m", bek.kasoMeter, prices.kasoBekisting);
    rab.item("Paku", "kg", bek.pakuKg, prices.paku);
    rab.item("Upah bekisting", "m²", bek.luasRaw, prices.upahBekisting, { tipe: "upah" });
    rab.item("Upah pembesian", "kg", besi.beratTotal, prices.upahPembesian, { tipe: "upah" });
    rab.item("Upah pengecoran", "m³", volumeBeton, prices.upahPengecoran, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { volumeBeton, berat: besi.beratTotal, luas: entry.panjang * entry.lebar } };
  }

  function calcDecking(entry, prices, jenis) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const luas = entry.panjang * entry.lebar;
    const luasWaste = luas * wasteMul;
    const volumeTopping = luas * (entry.tebalTopping / 100);
    const mix = beton.campuranBeton(volumeTopping, entry.mutu, wasteMul);
    const lembar = jenis === "bondek" ? prices.bondek : prices.floordeck;

    const rab = U.createRab();
    rab.group(`Plat Lantai ${jenis === "bondek" ? "Bondek" : "Floordeck"} ${U.fmtNum(entry.panjang)}×${U.fmtNum(entry.lebar)} m`);
    rab.item(jenis === "bondek" ? "Bondek" : "Floordeck", "m²", luasWaste, lembar);
    rab.item("Wiremesh", "lembar", Math.ceil(luas / 11.34), prices.wiremesh); // 1 lembar wiremesh ~2.1x5.4m = 11.34 m2
    rab.item("Semen (topping)", "zak", mix.semen, prices.semen);
    rab.item("Pasir (topping)", "m³", mix.pasir, prices.pasir);
    rab.item("Split (topping)", "m³", mix.split, prices.split);
    rab.item("Upah pasang decking", "m²", luas, prices.upahBekisting, { tipe: "upah" });
    rab.item("Upah pengecoran topping", "m³", volumeTopping, prices.upahPengecoran, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { volumeBeton: volumeTopping, luas } };
  }

  function calcPrecast(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const luas = entry.panjang * entry.lebar;
    const luasWaste = luas * wasteMul;

    const rab = U.createRab();
    rab.group(`Plat Lantai Panel Precast ${U.fmtNum(entry.panjang)}×${U.fmtNum(entry.lebar)} m`);
    rab.item("Panel precast", "m²", luasWaste, prices.panelPrecast);
    rab.item("Upah pasang (crane/manual)", "m²", luas, prices.upahPasangPrecast, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luas } };
  }

  function calculateEntry(entry, prices) {
    if (entry.metode === "cor") return calcCor(entry, prices);
    if (entry.metode === "precast") return calcPrecast(entry, prices);
    return calcDecking(entry, prices, entry.metode);
  }

  function renderEntryBody(bodyEl, entry, idx, onChange) {
    const methodField = document.createElement("div");
    methodField.className = "field-grid"; methodField.style.marginBottom = "10px";
    const f = document.createElement("div"); f.className = "field span-2";
    const sel = document.createElement("select");
    METHODS.forEach((m) => { const o = document.createElement("option"); o.value = m.key; o.textContent = m.label; if (m.key === entry.metode) o.selected = true; sel.appendChild(o); });
    sel.addEventListener("change", () => { Object.assign(entry, makeDefaultEntry(sel.value)); onChange(); });
    const lbl = document.createElement("label"); lbl.textContent = "Metode struktur lantai";
    f.appendChild(lbl); f.appendChild(sel); methodField.appendChild(f);
    bodyEl.appendChild(methodField);
    const fc = document.createElement("div");
    bodyEl.appendChild(fc);
    UI.renderFieldGrid(fc, fieldsFor(entry.metode), entry, onChange, 3);
  }

  window.ICS.modules.platlantai = {
    id: "platlantai", label: "Plat Lantai", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("cor"),
        entryLabel: (e, i) => `Plat Lantai #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
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
