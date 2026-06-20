/* ============================================================
   MODUL: RANGKA ATAP — multi-metode (Baja Ringan / CNP / IWF-Hbeam / Hollow / Kayu)
   Geometri atap dipakai untuk hitung luas atap & panjang kuda-kuda
   nyata; member rangka (top+bottom chord+web+gording) diringkas
   lewat "faktor rangka" (koefisien total panjang per kuda-kuda)
   yang bisa disesuaikan sesuai data lapangan ICS.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const baja = U.baja;

  const METHODS = [
    { key: "bajaRingan", label: "Baja Ringan" },
    { key: "cnp", label: "Baja CNP" },
    { key: "iwfHbeam", label: "Baja IWF / H-Beam" },
    { key: "hollow", label: "Hollow Galvanis" },
    { key: "kayu", label: "Kayu Konvensional" },
  ];

  const FIELDS_GEOMETRI = [
    { key: "panjangBangunan", label: "Panjang bangunan", unit: "m", default: 10, step: 0.1 },
    { key: "lebarBangunan", label: "Lebar bangunan", unit: "m", default: 8, step: 0.1 },
    { key: "sudutAtap", label: "Kemiringan atap", unit: "°", default: 30, step: 1 },
    { key: "overstek", label: "Overstek (tritisan)", unit: "m", default: 0.5, step: 0.1 },
    { key: "tipeAtap", label: "Tipe atap", type: "select", default: "pelana", options: [{ value: "pelana", label: "Pelana" }, { value: "limas", label: "Limas" }] },
    { key: "jarakKudaKuda", label: "Jarak kuda-kuda", unit: "m", default: 1.2, step: 0.1 },
  ];

  const KOEF_DEFAULT = { bajaRingan: 2.3, cnp: 2.0, iwfHbeam: 1.8, hollow: 2.2, kayu: 2.0 };
  const METHOD_KELUARGA = { cnp: "CNP", iwfHbeam: "IWF", hollow: "HOLLOW" };

  function fieldsFor(metode) {
    const fields = FIELDS_GEOMETRI.slice();
    if (metode === "iwfHbeam" || metode === "cnp" || metode === "hollow") {
      const keluarga = metode === "iwfHbeam" ? "IWF" : METHOD_KELUARGA[metode];
      fields.push({ key: "profilKey", label: "Profil", type: "select", default: Object.keys(D.profilBaja[keluarga].items)[0], options: baja.opsiProfil(keluarga).map((o) => ({ value: o.key, label: o.label })) });
    }
    fields.push({ key: "faktorRangka", label: "Faktor rangka (total panjang/kuda-kuda)", unit: "x", default: KOEF_DEFAULT[metode], step: 0.1 });
    fields.push({ key: "waste", label: "Waste factor", unit: "%", default: metode === "kayu" ? 10 : 5, step: 1 });
    return fields;
  }

  function makeDefaultEntry(metode) {
    metode = metode || "bajaRingan";
    const entry = { metode };
    fieldsFor(metode).forEach((f) => { entry[f.key] = f.default; });
    return entry;
  }

  function geometri(entry) {
    const sudutRad = (entry.sudutAtap * Math.PI) / 180;
    const panjangMiringPerSisi = (entry.lebarBangunan / 2 + entry.overstek) / Math.cos(sudutRad);
    const panjangEfektifBangunan = entry.panjangBangunan + 2 * entry.overstek;
    const limasFactor = entry.tipeAtap === "limas" ? 1.15 : 1.0;
    const luasAtap = panjangEfektifBangunan * panjangMiringPerSisi * 2 * limasFactor;
    const jumlahKudaKuda = Math.ceil(entry.panjangBangunan / entry.jarakKudaKuda) + 1;
    const panjangTopChordTotal = jumlahKudaKuda * 2 * panjangMiringPerSisi;
    const panjangEfektifRangka = panjangTopChordTotal * entry.faktorRangka * limasFactor;
    return { panjangMiringPerSisi, panjangEfektifBangunan, luasAtap, jumlahKudaKuda, panjangEfektifRangka };
  }

  function calcBajaRingan(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const g = geometri(entry);
    const panjangWaste = g.panjangEfektifRangka * wasteMul;
    const jumlahSekrup = Math.ceil(panjangWaste / 0.3);
    const jumlahDynabolt = g.jumlahKudaKuda * 2;

    const rab = U.createRab();
    rab.group(`Rangka Atap Baja Ringan — luas ${U.fmtNum(g.luasAtap)} m², ${g.jumlahKudaKuda} kuda-kuda`);
    rab.item("Baja ringan C75 + Reng", "m", panjangWaste, prices.bajaRinganPerM);
    rab.item("Sekrup baja ringan", "pcs", jumlahSekrup, prices.sekrupBajaRingan);
    rab.item("Dynabolt angkur", "pcs", jumlahDynabolt, prices.dynabolt);
    rab.item("Upah pasang rangka atap", "m²", g.luasAtap, prices.upahRangkaAtap, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luasAtap: g.luasAtap, jumlahKudaKuda: g.jumlahKudaKuda } };
  }

  function calcBajaProfil(entry, prices, metode) {
    const keluarga = metode === "iwfHbeam" ? "IWF" : METHOD_KELUARGA[metode];
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const g = geometri(entry);
    const profil = baja.calcProfil(keluarga, entry.profilKey, g.panjangEfektifRangka, wasteMul);
    const jumlahLas = g.jumlahKudaKuda * 4;
    const jumlahDynabolt = g.jumlahKudaKuda * 2;

    const rab = U.createRab();
    rab.group(`Rangka Atap ${profil.label} — luas ${U.fmtNum(g.luasAtap)} m², ${g.jumlahKudaKuda} kuda-kuda`);
    rab.item(`Profil ${profil.label}`, "kg", profil.beratTotal, prices.bajaProfilPerKg);
    rab.item("Dynabolt angkur", "pcs", jumlahDynabolt, prices.dynabolt);
    rab.item("Cat besi", "kg", profil.beratTotal * D.CAT_BESI_KG_PER_KG_BESI, prices.catBesi);
    rab.item("Upah fabrikasi", "kg", profil.beratTotal, prices.upahFabrikasiBaja, { tipe: "upah" });
    rab.item("Upah las", "titik", jumlahLas, prices.upahLas, { tipe: "upah" });
    rab.item("Upah pasang rangka atap", "m²", g.luasAtap, prices.upahRangkaAtap, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luasAtap: g.luasAtap, berat: profil.beratTotal, jumlahKudaKuda: g.jumlahKudaKuda } };
  }

  function calcKayu(entry, prices) {
    const wasteMul = 1 + (entry.waste || 0) / 100;
    const g = geometri(entry);
    const panjangWaste = g.panjangEfektifRangka * wasteMul;

    const rab = U.createRab();
    rab.group(`Rangka Atap Kayu — luas ${U.fmtNum(g.luasAtap)} m², ${g.jumlahKudaKuda} kuda-kuda`);
    rab.item("Kaso 5/7 (kuda-kuda + gording)", "m", panjangWaste * 0.6, prices.kasoKonstruksi);
    rab.item("Reng kayu", "m", panjangWaste * 0.4, prices.rengKayu);
    rab.item("Paku", "kg", panjangWaste * 0.05, prices.paku);
    rab.item("Upah pasang rangka atap", "m²", g.luasAtap, prices.upahRangkaAtap, { tipe: "upah" });

    return { rows: rab.rows, totalMaterial: rab.totalByTipe("material"), totalUpah: rab.totalByTipe("upah"), warnings: [], summary: { luasAtap: g.luasAtap, jumlahKudaKuda: g.jumlahKudaKuda } };
  }

  function calculateEntry(entry, prices) {
    if (entry.metode === "bajaRingan") return calcBajaRingan(entry, prices);
    if (entry.metode === "kayu") return calcKayu(entry, prices);
    return calcBajaProfil(entry, prices, entry.metode);
  }

  function renderEntryBody(bodyEl, entry, idx, onChange) {
    const methodField = document.createElement("div");
    methodField.className = "field-grid"; methodField.style.marginBottom = "10px";
    const f = document.createElement("div"); f.className = "field span-2";
    const sel = document.createElement("select");
    METHODS.forEach((m) => { const o = document.createElement("option"); o.value = m.key; o.textContent = m.label; if (m.key === entry.metode) o.selected = true; sel.appendChild(o); });
    sel.addEventListener("change", () => { Object.assign(entry, makeDefaultEntry(sel.value)); onChange(); });
    const lbl = document.createElement("label"); lbl.textContent = "Metode rangka atap";
    f.appendChild(lbl); f.appendChild(sel); methodField.appendChild(f);
    bodyEl.appendChild(methodField);
    const fc = document.createElement("div");
    bodyEl.appendChild(fc);
    UI.renderFieldGrid(fc, fieldsFor(entry.metode), entry, onChange, 3);
  }

  window.ICS.modules.rangkaAtap = {
    id: "rangkaAtap", label: "Rangka Atap", methods: METHODS, makeDefaultEntry, calculateEntry,
    render(container, entries, prices, onChange) {
      const shellEl = document.createElement("div");
      UI.renderEntryShell(shellEl, {
        entries, makeDefaultEntry: () => makeDefaultEntry("bajaRingan"),
        entryLabel: (e, i) => `Rangka Atap #${i + 1} — ${METHODS.find((m) => m.key === e.metode).label}`,
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
