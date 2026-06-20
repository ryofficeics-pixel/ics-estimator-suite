/* ============================================================
   APP SHELL — routing antar modul, manajemen proyek, master
   harga, dan export. Semua kalkulasi sebenarnya ada di modules/*.
   ============================================================ */
(function () {
  const D = window.ICS.data, U = window.ICS.utils, UI = window.ICS.components.ui;
  const storage = U.storage;

  let PRICES = storage.loadPrices();
  let PROJECT = storage.ensureActiveProject();
  let CURRENT_MODULE_ID = "pondasi";
  let LAST_EXPORT_ROWS = [];
  let LAST_EXPORT_TITLE = "RAB";

  const $ = (id) => document.getElementById(id);

  /* ---------------- THEME ---------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("ics_suite_theme_v1", theme); } catch (e) {}
  }
  function initTheme() {
    let theme = "light";
    try { theme = localStorage.getItem("ics_suite_theme_v1") || "light"; } catch (e) {}
    applyTheme(theme);
    $("btnTheme").addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }

  /* ---------------- SIDEBAR ---------------- */
  function renderSidebarNav() {
    UI.renderSidebar($("sidebar"), CURRENT_MODULE_ID, (id) => {
      CURRENT_MODULE_ID = id;
      renderSidebarNav();
      renderMain();
    });
  }

  /* ---------------- PROJECT SELECT ---------------- */
  function renderProjectSelect() {
    const sel = $("projectSelect");
    const list = storage.listProjects();
    sel.innerHTML = "";
    list.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id; o.textContent = p.nama;
      if (p.id === PROJECT.meta.id) o.selected = true;
      sel.appendChild(o);
    });
  }

  function switchProject(id) {
    const p = storage.loadProject(id);
    if (!p) return;
    PROJECT = p;
    storage.setActiveProjectId(id);
    renderProjectSelect();
    renderMain();
  }

  function bindProjectControls() {
    $("projectSelect").addEventListener("change", (e) => switchProject(e.target.value));

    $("btnNewProject").addEventListener("click", () => {
      const nama = prompt("Nama proyek baru:", "Proyek Baru");
      if (!nama) return;
      PROJECT = storage.createProject(nama);
      renderProjectSelect();
      renderMain();
    });

    $("btnCloneProject").addEventListener("click", () => {
      const nama = prompt("Nama untuk hasil duplikat:", PROJECT.meta.nama + " (copy)");
      if (!nama) return;
      const clone = storage.cloneProject(PROJECT.meta.id, nama);
      if (clone) { PROJECT = clone; renderProjectSelect(); renderMain(); }
    });

    $("btnRenameProject").addEventListener("click", () => {
      const nama = prompt("Nama baru proyek:", PROJECT.meta.nama);
      if (!nama) return;
      PROJECT.meta.nama = nama;
      storage.saveProject(PROJECT);
      renderProjectSelect();
    });

    $("btnDeleteProject").addEventListener("click", () => {
      if (storage.listProjects().length <= 1) { alert("Tidak bisa menghapus satu-satunya proyek yang ada."); return; }
      if (!confirm(`Hapus proyek "${PROJECT.meta.nama}"? Tindakan ini tidak bisa dibatalkan.`)) return;
      storage.deleteProject(PROJECT.meta.id);
      PROJECT = storage.ensureActiveProject();
      renderProjectSelect();
      renderMain();
    });
  }

  /* ---------------- MASTER HARGA ---------------- */
  function renderMasterHargaTable() {
    const body = $("masterHargaBody");
    body.innerHTML = "";
    D.PRICE_GROUPS.forEach((group) => {
      const h = document.createElement("h4");
      h.className = "harga-group-label";
      h.textContent = group.group;
      body.appendChild(h);

      const table = document.createElement("table");
      table.className = "harga-table";
      const tbody = document.createElement("tbody");
      group.items.forEach((item) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${item.label}</td><td class="center muted-note">${item.unit}</td>
          <td class="num"><input type="number" class="price-edit" data-key="${item.key}" value="${PRICES[item.key]}" step="500"></td>`;
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
    });
    body.querySelectorAll(".price-edit").forEach((input) => {
      input.addEventListener("change", () => {
        PRICES[input.dataset.key] = parseFloat(input.value) || 0;
        storage.savePrices(PRICES);
        renderMain();
      });
    });
  }

  function bindMasterHarga() {
    $("btnMasterHarga").addEventListener("click", () => {
      renderMasterHargaTable();
      $("masterHargaModal").style.display = "flex";
    });
    $("btnCloseMasterHarga").addEventListener("click", () => { $("masterHargaModal").style.display = "none"; });
    $("masterHargaModal").addEventListener("click", (e) => { if (e.target.id === "masterHargaModal") $("masterHargaModal").style.display = "none"; });
    $("btnResetHarga").addEventListener("click", () => {
      if (!confirm("Kembalikan semua harga ke nilai default?")) return;
      PRICES = storage.resetPrices();
      renderMasterHargaTable();
      renderMain();
    });
  }

  /* ---------------- BACKUP / RESTORE ---------------- */
  function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function bindBackup() {
    $("btnBackupExport").addEventListener("click", () => {
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadBlob(storage.exportAllJSON(), `ICS-Estimator-Backup-${dateStr}.json`, "application/json");
    });
    $("btnBackupImport").addEventListener("click", () => $("fileImport").click());
    $("fileImport").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const ids = storage.importJSON(reader.result);
          alert(`Berhasil mengimpor ${ids.length} proyek.`);
          if (ids.length) switchProject(ids[0]);
          renderProjectSelect();
        } catch (err) {
          alert("Gagal mengimpor: " + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  /* ---------------- EXPORT: PDF / EXCEL / CSV / PRINT ---------------- */
  function rowsToAOA(rows) {
    const aoa = [["No", "Uraian", "Satuan", "Volume", "Harga Satuan", "Jumlah"]];
    rows.forEach((row) => {
      if (row.isGroup) aoa.push([row.uraian]);
      else if (row.isSubtotal || row.isGrand) aoa.push(["", row.uraian, "", "", "", row.jumlah]);
      else aoa.push([row.no, row.uraian, row.satuan, row.volume, row.harga, row.jumlah]);
    });
    return aoa;
  }

  function bindExports() {
    $("btnPrint").addEventListener("click", () => window.print());

    $("btnExportPDF").addEventListener("click", () => {
      if (!LAST_EXPORT_ROWS.length) { alert("Tidak ada data untuk dicetak."); return; }
      if (!window.jspdf) { alert("Pustaka export PDF gagal dimuat. Periksa koneksi internet."); return; }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`RAB — ${LAST_EXPORT_TITLE}`, 14, 16);
      doc.setFontSize(9); doc.setTextColor(100);
      doc.text(`Proyek: ${PROJECT.meta.nama} — ICS Estimator Suite`, 14, 21);

      const body = LAST_EXPORT_ROWS.map((row) => {
        if (row.isGroup) return [{ content: row.uraian, colSpan: 6, styles: { fillColor: [236, 240, 245], fontStyle: "bold", textColor: [11, 37, 69] } }];
        if (row.isSubtotal) return [{ content: row.uraian, colSpan: 5, styles: { fontStyle: "bold" } }, { content: U.fmtRp(row.jumlah), styles: { fontStyle: "bold", halign: "right" } }];
        if (row.isGrand) return [{ content: row.uraian, colSpan: 5, styles: { fontStyle: "bold", fillColor: [11, 37, 69], textColor: 255 } }, { content: U.fmtRp(row.jumlah), styles: { fontStyle: "bold", fillColor: [11, 37, 69], textColor: 255, halign: "right" } }];
        return [row.no || "", row.uraian, row.satuan || "", (row.volume !== "" && row.volume !== undefined) ? U.fmtNum(row.volume) : "", row.harga ? U.fmtRp(row.harga) : "", { content: U.fmtRp(row.jumlah), styles: { halign: "right" } }];
      });

      doc.autoTable({
        startY: 27, head: [["No", "Uraian", "Satuan", "Volume", "Harga Satuan", "Jumlah"]], body,
        styles: { fontSize: 8, cellPadding: 2.2 }, headStyles: { fillColor: [11, 37, 69] },
        columnStyles: { 0: { cellWidth: 9 }, 2: { cellWidth: 16 }, 3: { halign: "right" }, 4: { halign: "right" } },
      });
      doc.save(`RAB-${LAST_EXPORT_TITLE}.pdf`);
    });

    $("btnExportExcel").addEventListener("click", () => {
      if (!LAST_EXPORT_ROWS.length) { alert("Tidak ada data untuk diexport."); return; }
      if (!window.XLSX) { alert("Pustaka export Excel gagal dimuat. Periksa koneksi internet."); return; }
      const aoa = rowsToAOA(LAST_EXPORT_ROWS);
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = [{ wch: 4 }, { wch: 34 }, { wch: 8 }, { wch: 10 }, { wch: 14 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, LAST_EXPORT_TITLE.slice(0, 28) || "RAB");
      XLSX.writeFile(wb, `RAB-${LAST_EXPORT_TITLE}.xlsx`);
    });

    $("btnExportCSV").addEventListener("click", () => {
      if (!LAST_EXPORT_ROWS.length) { alert("Tidak ada data untuk diexport."); return; }
      const aoa = rowsToAOA(LAST_EXPORT_ROWS);
      const csv = aoa.map((r) => r.map((c) => {
        const s = String(c === undefined || c === null ? "" : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(",")).join("\n");
      downloadBlob(csv, `RAB-${LAST_EXPORT_TITLE}.csv`, "text/csv");
    });
  }

  /* ---------------- MAIN VIEW ROUTER ---------------- */
  function renderMain() {
    const reg = D.MODULE_REGISTRY.find((m) => m.id === CURRENT_MODULE_ID);
    const container = $("mainContent");
    $("alertGlobal").innerHTML = "";
    $("moduleTitle").textContent = reg.label;
    $("moduleSubtitle").textContent = D.KATEGORI_LABEL[reg.kategori] || "";

    if (reg.depth === "alias") {
      const target = D.MODULE_REGISTRY.find((m) => m.id === reg.aliasOf);
      container.innerHTML = `<div class="card-block">
        <p>Kebutuhan <strong>${reg.label}</strong> sudah dihitung otomatis di dalam modul <strong>${target.label}</strong>, sehingga tidak perlu diisi terpisah (menghindari hitung ganda).</p>
        <button id="btnGotoAlias" class="btn btn-secondary">Buka Modul ${target.label}</button>
      </div>`;
      $("btnGotoAlias").addEventListener("click", () => { CURRENT_MODULE_ID = target.id; renderSidebarNav(); renderMain(); });
      LAST_EXPORT_ROWS = []; LAST_EXPORT_TITLE = reg.label;
      return;
    }

    if (CURRENT_MODULE_ID === "rekap") {
      const r = window.ICS.modules.rekap.render(container, PROJECT, PRICES, () => { storage.saveProject(PROJECT); renderMain(); });
      LAST_EXPORT_ROWS = window.ICS.modules.rekap.buildRows(r);
      LAST_EXPORT_TITLE = "Rekapitulasi RAB";
      return;
    }

    const mod = window.ICS.modules[CURRENT_MODULE_ID];
    if (!mod) { container.innerHTML = `<p class="muted-note">Modul belum tersedia.</p>`; return; }
    if (!PROJECT.entries[CURRENT_MODULE_ID]) PROJECT.entries[CURRENT_MODULE_ID] = [];
    const entries = PROJECT.entries[CURRENT_MODULE_ID];
    const agg = mod.render(container, entries, PRICES, () => { storage.saveProject(PROJECT); renderMain(); });
    LAST_EXPORT_ROWS = agg.rows;
    LAST_EXPORT_TITLE = mod.label;
  }

  /* ---------------- SIDEBAR TOGGLE (mobile) ---------------- */
  function bindSidebarToggle() {
    $("btnSidebarToggle").addEventListener("click", () => {
      document.querySelector(".app-body").classList.toggle("sidebar-collapsed");
    });
  }

  /* ---------------- INIT ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    renderProjectSelect();
    renderSidebarNav();
    bindProjectControls();
    bindMasterHarga();
    bindBackup();
    bindExports();
    bindSidebarToggle();
    renderMain();
  });
})();
