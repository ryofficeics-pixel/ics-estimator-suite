/* ============================================================ MODUL: TANGGA — multi-metode (Beton / Baja IWF / Hollow / Kayu) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const beton = U.beton, baja = U.baja;

  const METHODS = [
    { key: "beton", label: "Beton" },
    { key: "iwf", label: "Baja IWF (stringer)" },
    { key: "hollow", label: "Hollow (stringer)" },
    { key: "kayu", label: "Kayu" },
  ];

  const FIELDS_COMMON = [
    { key: "tinggiTotal", label: "Tinggi total (lantai-lantai)", unit: "m", default: 3.5, step: 0.05 },
    { key: "lebarTangga", label: "Lebar tangga", unit: "m", default: 1.0, step: 0.05 },
    { key: "tinggiAnakTangga", label: "Tinggi anak tangga (optrede)", unit: "m", default: 0.18, step: 0.005 },
    { key: "lebarAnakTangga", label: "Lebar anak tangga (antrede)", unit: "m", default: 0.28, step: 0.01 },
  ];
  const FIELDS_BETON = FIELDS_COMMON.concat([
    { key: "tebalPlat", label: "Tebal plat tangga", unit: "cm", default: 12, step: 0.5 },
    { key: "diameter", label: "Diameter tulangan", type: "select", default: 10, options: [8, 10, 12].map((d) => ({ value: d, label: "D" + d })) },
    { key: "jarak", label: "Jarak tulangan", unit: "mm", default: 150, step: 10 },
    { key: "mutu", label: "Mutu beton", type: "select", default: "K225", options: ["K175", "K225", "K250", "K300"].map((m) => ({ value: m, label: m })) },
    { key: "pakaiKeramik", label: "Finishing keramik", type: "select", default: "ya", options: [{ value: "ya", label: "Ya" }, { value: "tidak", label: "Tidak" }] },
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ]);
  const FIELDS_BAJA = FIELDS_COMMON.concat([
    { key: "waste", label: "Waste factor", unit: "%", default: 5, step: 1 },
  ]);
  const FIELDS_KAYU = FIELDS_COMMON.concat([
    { key: "waste", label: "Waste factor", unit: "%", default: 10, step: 1 },
  ]);

  function fieldsFor(metode) {
    if (metode === "beton") return FIELDS_BETON;
    if (metode === "kayu") return FIELDS_KAYU;
    return FIELDS_BAJA;
  }
  function makeDefaultEntry(metode) {
    metode = metode || "beton";
    const entry = { metode };
    fieldsFor(metode).forEach((f) => { entry[f.key] = f.default; });
    return entry;
  }

  function geometri(entry) {
    const jumlahAnakTangga = Math.max(1, Math.ceil(entry.tinggiTotal / entry.tinggiAnakTangga));
    const tinggiAktual = entry.tinggiTotal / jumlahAnakTangga;
    const panjangHorizontal = (jumlahAnakTangga - 1) * entry.lebarAnakTangga;
    const panjangMiring = Math.sqrt(entry.tinggiTotal ** 2 + panjangHorizontal ** 2);
    return { jumlahAnakTangga, tinggiAktual, panjangHorizontal, panjangMiring };
  }

  function calcBeton(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const g = geometri(entry);
    const volumePlat = g.panjangMiring * entry.lebarTangga * (entry.tebalPlat / 100);
    const volumeAnakTangga = 0.5 * g.tinggiAktual * entry.lebarAnakTangga * g.jumlahAnakTangga * entry.lebarTangga;
    const volumeBeton = volumePlat + volumeAnakTangga;

    const selimut_m = 0.02;
    const mesh = beton.hitungJaringTulangan(entry.jarak, g.panjangMiring, entry.lebarTangga, selimut_m);
    const groups = {}; groups[entry.diameter] = mesh.totalPanjang;
    const besi = beton.gabungkanBesi(groups, wasteMul);
    const bendrat = beton.hitungBendrat(besi.beratTotal);
    const mix = beton.campuranBeton(volumeBeton, entry.mutu, wasteMul);

    const luasBekistingRaw = g.panjangMiring * entry.lebarTangga + g.jumlahAnakTangga * g.tinggiAktual * entry.lebarTangga;
    const bek = beton.hitungBekisting(luasBekistingRaw, wasteMul);

    const rab = U.createRab();
    rab.group(`Tangga Beton — tinggi ${U.fmtNum(entry.tinggiTotal)} m, ${g.jumlahAnakTangga} anak tangga`);
    rab.item("Semen", "zak", mix.semen, prices.semen);
    rab.item("Pasir", "m³", mix.pasir, prices.pasir);
    rab.item("Split", "m³", mix.split, prices.split);
    besi.detail.forEach((b) => rab.item(`Besi D${b.diameter} (${b.jumlahBatang} btg×12m)`, "kg", b.berat, prices["besiD" + b.diameter]));
    rab.item("Kawat bendrat", "kg", bendrat, prices.bendrat);
    rab.item("Triplek + perancah", "lembar", bek.triplekLembar, prices.triplek);
    rab.item("Kayu kaso bekisting", "m", bek.kasoMeter, prices.kasoBekisting);
    rab.item("Paku", "kg", bek.pakuKg, prices.paku);

    if (entry.pakaiKeramik === "ya") {
      const luasFinishing = g.jumlahAnakTangga * (entry.lebarAnakTangga + g.tinggiAktual) * entry.lebarTangga;
      const dus = Math.ceil((luasFinishing * wasteMul) / 1.44);
      rab.item("Keramik finishing tangga", "dus", dus, prices.keramik);
      rab.item("Semen perekat keramik", "zak", Math.ceil(luasFinishing / 6), prices.semenPerekatKeramik);
      rab.item("Nat keramik", "kg", luasFinishing * 0.3, prices.nat);
      rab.item("Upah pasang keramik tangga", "m²", luasFinishing, prices.upahKeramik, { tipe: "upah" });
    }
    rab.item("Upah bekisting", "m²", bek.luasRaw, prices.upahBekisting, { tipe: "upah" });
    rab.item("Upah pembesian", "kg", besi.beratTotal, prices.upahPembesian, { tipe: "upah" });
    rab.item("Upah pengecoran", "m³", volumeBeton, prices.upahPengecoran, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { volumeBeton, jumlahAnakTangga: g.jumlahAnakTangga } };
  }

  function calcStringerBaja(entry, prices, keluarga) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const g = geometri(entry);
    const panjangStringer = g.panjangMiring * 2; // 2 stringer kiri-kanan
    const panjangAnakTangga = g.jumlahAnakTangga * entry.lebarTangga; // cross member tiap anak tangga
    const panjangTotal = panjangStringer + panjangAnakTangga;
    const profilKeyDefault = Object.keys(D.profilBaja[keluarga].items)[0];
    const profil = baja.calcProfil(keluarga, entry.profilKey || profilKeyDefault, panjangTotal, wasteMul);

    const rab = U.createRab();
    rab.group(`Tangga ${profil.label} — tinggi ${U.fmtNum(entry.tinggiTotal)} m, ${g.jumlahAnakTangga} anak tangga`);
    rab.item(`Profil ${profil.label}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
    rab.item("Plat injakan (anak tangga)", "m²", g.jumlahAnakTangga * entry.lebarAnakTangga * entry.lebarTangga, prices.bondek);
    rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
    rab.item("Upah fabrikasi", "kg", profil.beratTotal, prices.upahFabrikasiBaja, { tipe: "upah" });
    rab.item("Upah erection", "kg", profil.beratTotal, prices.upahErectionBaja, { tipe: "upah" });
    rab.item("Upah las", "titik", g.jumlahAnakTangga, prices.upahLas, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { berat: profil.beratTotal, jumlahAnakTangga: g.jumlahAnakTangga } };
  }

  function calcKayu(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const g = geometri(entry);
    const panjangStringer = g.panjangMiring * 2 * wasteMul;
    const panjangAnakTangga = g.jumlahAnakTangga * entry.lebarTangga * wasteMul;

    const rab = U.createRab();
    rab.group(`Tangga Kayu — tinggi ${U.fmtNum(entry.tinggiTotal)} m, ${g.jumlahAnakTangga} anak tangga`);
    rab.item("Kayu stringer (kaso besar)", "m", panjangStringer, prices.kasoKonstruksi);
    rab.item("Kayu anak tangga (papan)", "m", panjangAnakTangga, prices.usuk);
    rab.item("Paku/skrup kayu", "kg", g.jumlahAnakTangga * 0.15, prices.paku);
    rab.item("Upah pasang tangga kayu", "m²", g.panjangMiring * entry.lebarTangga, prices.upahBekisting, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { jumlahAnakTangga: g.jumlahAnakTangga } };
  }

  function calculateEntry(entry, prices) {
    if (entry.metode === "beton") return calcBeton(entry, prices);
    if (entry.metode === "kayu") return calcKayu(entry, prices);
    return calcStringerBaja(entry, prices, entry.metode === "iwf" ? "IWF" : "HOLLOW");
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

  window.ICS.modules.tangga = {
    id: "tangga", label: "Tangga", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("beton"),
        entryLabel: (e, i) => `Tangga #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
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
