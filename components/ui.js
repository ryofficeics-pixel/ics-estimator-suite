/* ============================================================
   UI COMPONENTS — dipakai bersama oleh seluruh modul & app shell
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.components = window.ICS.components || {};

(function () {
  const U = window.ICS.utils;

  /* ---------------- Sidebar ---------------- */
  function renderSidebar(container, activeId, onSelect) {
    const reg = window.ICS.data.MODULE_REGISTRY;
    const katLabel = window.ICS.data.KATEGORI_LABEL;
    const order = ["struktur", "arsitektur", "mep", "luar", "rekap"];
    container.innerHTML = "";
    order.forEach((kat) => {
      const items = reg.filter((m) => m.kategori === kat);
      if (!items.length) return;
      const h = document.createElement("div");
      h.className = "sidebar-group-label";
      h.textContent = katLabel[kat];
      container.appendChild(h);
      items.forEach((m) => {
        const a = document.createElement("button");
        a.className = "sidebar-item" + (m.id === activeId ? " active" : "");
        a.textContent = m.label;
        a.dataset.moduleId = m.id;
        if (m.depth === "alias") a.classList.add("is-alias");
        a.addEventListener("click", () => onSelect(m.id));
        container.appendChild(a);
      });
    });
  }

  /* ---------------- RAB Table ---------------- */
  function renderTable(container, rows, opts = {}) {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("table");
    table.innerHTML = `
      <thead><tr>
        <th class="center">No</th><th>Uraian</th><th class="center">Satuan</th>
        <th class="num">Volume</th><th class="num">Harga Satuan</th><th class="num">Jumlah</th>
      </tr></thead><tbody></tbody>`;
    const tbody = table.querySelector("tbody");
    if (!rows || !rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="center muted-note" style="padding:18px;">Belum ada data.</td></tr>`;
    }
    (rows || []).forEach((row) => {
      const tr = document.createElement("tr");
      if (row.isGroup) {
        tr.className = "group-row";
        tr.innerHTML = `<td colspan="6">${row.uraian}</td>`;
      } else if (row.isSubtotal) {
        tr.className = "subtotal-row";
        tr.innerHTML = `<td colspan="5">${row.uraian}</td><td class="num">${U.fmtRp(row.jumlah)}</td>`;
      } else if (row.isGrand) {
        tr.className = "grand-row";
        tr.innerHTML = `<td colspan="5">${row.uraian}</td><td class="num">${U.fmtRp(row.jumlah)}</td>`;
      } else {
        tr.innerHTML = `
          <td class="center">${row.no}</td>
          <td>${row.uraian}${row.note ? `<div class="muted-note" style="margin-top:2px;">*${row.note}</div>` : ""}</td>
          <td class="center">${row.satuan}</td>
          <td class="num">${U.fmtNum(row.volume)}</td>
          <td class="num">${U.fmtRp(row.harga)}</td>
          <td class="num">${U.fmtRp(row.jumlah)}</td>`;
      }
      tbody.appendChild(tr);
    });
    wrap.appendChild(table);
    container.innerHTML = "";
    container.appendChild(wrap);
  }

  /* ---------------- Stat grid ---------------- */
  function renderStatGrid(container, stats) {
    container.innerHTML = "";
    container.className = "stat-grid";
    stats.forEach((s) => {
      const div = document.createElement("div");
      div.className = "stat";
      div.innerHTML = `<span class="lbl">${s.label}</span><span class="val">${s.value}<span class="u">${s.unit || ""}</span></span>`;
      container.appendChild(div);
    });
  }

  /* ---------------- Alert ---------------- */
  function renderAlerts(container, warnings) {
    container.innerHTML = "";
    (warnings || []).forEach((w) => {
      const div = document.createElement("div");
      div.className = "alert";
      div.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg><span>${w}</span>`;
      container.appendChild(div);
    });
  }

  /* ---------------- Generic field grid (untuk modul "simple") ---------------- */
  function renderFieldGrid(container, fields, entry, onChange, cols = 3) {
    container.innerHTML = "";
    container.className = "field-grid cols-" + cols;
    fields.forEach((f) => {
      const div = document.createElement("div");
      div.className = "field" + (f.span2 ? " span-2" : "");
      const label = document.createElement("label");
      label.innerHTML = `${f.label}${f.unit ? `<span class="unit">${f.unit}</span>` : ""}`;
      div.appendChild(label);
      let input;
      if (f.type === "select") {
        input = document.createElement("select");
        f.options.forEach((o) => {
          const opt = document.createElement("option");
          opt.value = o.value; opt.textContent = o.label;
          if (String(entry[f.key]) === String(o.value)) opt.selected = true;
          input.appendChild(opt);
        });
      } else {
        input = document.createElement("input");
        input.type = f.type || "number";
        if (f.step) input.step = f.step;
        input.value = entry[f.key] !== undefined ? entry[f.key] : (f.default !== undefined ? f.default : "");
      }
      input.addEventListener("change", () => {
        const v = (f.type === "select" || f.type === "text") ? input.value : (parseFloat(input.value) || 0);
        entry[f.key] = v;
        onChange();
      });
      div.appendChild(input);
      container.appendChild(div);
    });
  }

  /* ---------------- Entry-list shell (tambah/hapus banyak instance per modul) ---------------- */
  function renderEntryShell(container, opts) {
    // opts: { entries, makeDefaultEntry, renderEntryBody(bodyEl, entry, idx, onChange), entryLabel(entry, idx), onChange }
    container.innerHTML = "";
    opts.entries.forEach((entry, idx) => {
      const card = document.createElement("div");
      card.className = "entry-card";
      const head = document.createElement("div");
      head.className = "entry-card-head";
      head.innerHTML = `<span>${opts.entryLabel ? opts.entryLabel(entry, idx) : "Item " + (idx + 1)}</span>`;
      const btnDel = document.createElement("button");
      btnDel.className = "btn btn-ghost btn-sm";
      btnDel.textContent = "Hapus";
      btnDel.addEventListener("click", () => {
        opts.entries.splice(idx, 1);
        opts.onChange();
      });
      head.appendChild(btnDel);
      card.appendChild(head);
      const body = document.createElement("div");
      body.className = "entry-card-body";
      card.appendChild(body);
      opts.renderEntryBody(body, entry, idx, opts.onChange);
      container.appendChild(card);
    });
    const btnAdd = document.createElement("button");
    btnAdd.className = "btn btn-secondary btn-block";
    btnAdd.textContent = "+ Tambah Item";
    btnAdd.addEventListener("click", () => {
      opts.entries.push(opts.makeDefaultEntry());
      opts.onChange();
    });
    container.appendChild(btnAdd);
  }

  window.ICS.components.ui = {
    renderSidebar, renderTable, renderStatGrid, renderAlerts, renderFieldGrid, renderEntryShell,
  };
})();
