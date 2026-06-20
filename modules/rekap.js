/* ============================================================
   MODUL: REKAPITULASI RAB (sistem, bukan modul entry biasa)
   Menggabungkan total semua modul proyek, dikelompokkan per
   kategori (Struktur/Arsitektur/MEP/Luar), lalu menambahkan
   overhead, profit, contingency, dan PPN untuk Grand Total.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.modules = window.ICS.modules || {};

(function () {
  const U = window.ICS.utils, UI = window.ICS.components.ui, D = window.ICS.data;

  const KATEGORI_COLOR = { struktur: "#2563eb", arsitektur: "#16a34a", mep: "#f59e0b", luar: "#9333ea" };
  const KATEGORI_ORDER = ["struktur", "arsitektur", "mep", "luar"];

  function calculateRekap(project, prices) {
    const perModule = [];
    const perKategori = { struktur: 0, arsitektur: 0, mep: 0, luar: 0 };
    let totalBahanUpah = 0;
    const dash = { totalVolumeBeton: 0, totalBeratBesi: 0, totalLuasDinding: 0, totalLuasAtap: 0, totalLuasKeramik: 0, totalTitikListrik: 0 };

    D.MODULE_REGISTRY.forEach((m) => {
      if (m.depth === "alias" || m.depth === "system") return;
      const mod = window.ICS.modules[m.id];
      if (!mod) return;
      const entries = (project.entries && project.entries[m.id]) || [];
      const agg = U.aggregateModule(entries, mod.calculateEntry, prices);
      perModule.push({ id: m.id, label: m.label, kategori: m.kategori, totalMaterial: agg.totalMaterial, totalUpah: agg.totalUpah, total: agg.total, jumlahEntry: entries.length });
      perKategori[m.kategori] += agg.total;
      totalBahanUpah += agg.total;

      agg.perEntry.forEach((pe) => {
        const s = pe.result.summary || {};
        if (s.volumeBeton) dash.totalVolumeBeton += s.volumeBeton;
        if (s.berat) dash.totalBeratBesi += s.berat;
        if (m.id === "dindingBata" || m.id === "dindingHebel") dash.totalLuasDinding += s.luas || 0;
        if (m.id === "atapSpandek" || m.id === "atapGenteng") dash.totalLuasAtap += s.luasAtap || 0;
        if (m.id === "lantaiKeramik") dash.totalLuasKeramik += s.luas || 0;
        if (m.id === "instalasiListrik") dash.totalTitikListrik += s.titikTotal || 0;
      });
    });

    const rs = project.rekapSettings || { overheadPct: 8, profitPct: 10, ppnPct: 11, contingencyPct: 3 };
    const overhead = totalBahanUpah * (rs.overheadPct / 100);
    const s1 = totalBahanUpah + overhead;
    const profit = s1 * (rs.profitPct / 100);
    const s2 = s1 + profit;
    const contingency = s2 * (rs.contingencyPct / 100);
    const s3 = s2 + contingency;
    const ppn = s3 * (rs.ppnPct / 100);
    const grandTotal = s3 + ppn;

    return { perModule, perKategori, totalBahanUpah, overhead, profit, contingency, ppn, grandTotal, dashboard: dash, rekapSettings: rs };
  }

  function buildRows(r) {
    const rows = [];
    KATEGORI_ORDER.forEach((kat) => {
      const modulesInKat = r.perModule.filter((m) => m.kategori === kat);
      if (!modulesInKat.length) return;
      rows.push({ uraian: D.KATEGORI_LABEL[kat].toUpperCase(), isGroup: true });
      modulesInKat.forEach((m) => {
        rows.push({
          no: undefined, uraian: `${m.label}${m.jumlahEntry ? ` (${m.jumlahEntry} item)` : " (belum diisi)"}`,
          satuan: "", volume: "", harga: "", jumlah: m.total, tipe: "material",
        });
      });
      rows.push({ uraian: `Subtotal ${D.KATEGORI_LABEL[kat]}`, isSubtotal: true, jumlah: r.perKategori[kat] });
    });
    rows.push({ uraian: "TOTAL BIAYA BAHAN + UPAH", isGrand: true, jumlah: r.totalBahanUpah });
    rows.push({ uraian: `Overhead (${r.rekapSettings.overheadPct}%)`, satuan: "", volume: "", harga: "", jumlah: r.overhead, tipe: "material", no: undefined });
    rows.push({ uraian: `Profit (${r.rekapSettings.profitPct}%)`, satuan: "", volume: "", harga: "", jumlah: r.profit, tipe: "material", no: undefined });
    rows.push({ uraian: `Contingency (${r.rekapSettings.contingencyPct}%)`, satuan: "", volume: "", harga: "", jumlah: r.contingency, tipe: "material", no: undefined });
    rows.push({ uraian: `PPN (${r.rekapSettings.ppnPct}%)`, satuan: "", volume: "", harga: "", jumlah: r.ppn, tipe: "material", no: undefined });
    rows.push({ uraian: "GRAND TOTAL PROYEK", isGrand: true, jumlah: r.grandTotal });
    return rows;
  }

  function renderSettings(container, project, onSettingsChange) {
    const fields = [
      { key: "overheadPct", label: "Overhead", unit: "%", default: project.rekapSettings.overheadPct, step: 0.5 },
      { key: "profitPct", label: "Profit", unit: "%", default: project.rekapSettings.profitPct, step: 0.5 },
      { key: "contingencyPct", label: "Contingency", unit: "%", default: project.rekapSettings.contingencyPct, step: 0.5 },
      { key: "ppnPct", label: "PPN", unit: "%", default: project.rekapSettings.ppnPct, step: 0.5 },
    ];
    UI.renderFieldGrid(container, fields, project.rekapSettings, onSettingsChange, 4);
  }

  window.ICS.modules.rekap = {
    id: "rekap", label: "Rekapitulasi RAB", isSystem: true, calculateRekap, buildRows,
    render(container, project, prices, onSettingsChange) {
      const r = calculateRekap(project, prices);

      container.innerHTML = "";

      const statEl = document.createElement("div");
      UI.renderStatGrid(statEl, [
        { label: "Grand Total Proyek", value: U.fmtRp(r.grandTotal).replace("Rp ", ""), unit: " Rp" },
        { label: "Volume Beton Total", value: U.fmtNum(r.dashboard.totalVolumeBeton), unit: " m³" },
        { label: "Berat Besi + Baja", value: U.fmtNum(r.dashboard.totalBeratBesi), unit: " kg" },
        { label: "Luas Dinding", value: U.fmtNum(r.dashboard.totalLuasDinding), unit: " m²" },
        { label: "Luas Atap", value: U.fmtNum(r.dashboard.totalLuasAtap), unit: " m²" },
        { label: "Luas Keramik", value: U.fmtNum(r.dashboard.totalLuasKeramik), unit: " m²" },
        { label: "Titik Listrik", value: U.fmtInt(r.dashboard.totalTitikListrik), unit: " titik" },
      ]);
      container.appendChild(statEl);

      const chartCard = document.createElement("div");
      chartCard.className = "card-block";
      chartCard.innerHTML = `<h3>Distribusi Biaya per Kategori</h3>`;
      const chartEl = document.createElement("div");
      window.ICS.components.chart.renderPieChart(chartEl, KATEGORI_ORDER.map((k) => ({ label: D.KATEGORI_LABEL[k], value: r.perKategori[k], color: KATEGORI_COLOR[k] })));
      chartCard.appendChild(chartEl);
      container.appendChild(chartCard);

      const settingsCard = document.createElement("div");
      settingsCard.className = "card-block";
      settingsCard.innerHTML = `<h3>Parameter Markup</h3>`;
      const settingsEl = document.createElement("div");
      renderSettings(settingsEl, project, onSettingsChange);
      settingsCard.appendChild(settingsEl);
      container.appendChild(settingsCard);

      const tableEl = document.createElement("div");
      tableEl.style.marginTop = "16px";
      UI.renderTable(tableEl, buildRows(r));
      container.appendChild(tableEl);

      return r;
    },
  };
})();
