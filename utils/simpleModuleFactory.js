/* ============================================================
   FACTORY MODUL SEDERHANA — dipakai oleh 22 modul arsitektur/
   MEP/pekerjaan luar. Setiap modul hanya perlu definisikan
   `fields` (input) dan `calcFn(entry, prices)` (logika hitung);
   render/shell/agregasi ditangani otomatis di sini.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

window.ICS.utils.createSimpleModule = function (config) {
  const U = window.ICS.utils, UI = window.ICS.components.ui;
  const { id, label, fields, calcFn } = config;

  function makeDefaultEntry() {
    const entry = { metode: "default" };
    fields.forEach((f) => { entry[f.key] = f.default; });
    return entry;
  }

  function calculateEntry(entry, prices) { return calcFn(entry, prices); }

  function renderEntryBody(bodyEl, entry, idx, onChange) {
    UI.renderFieldGrid(bodyEl, fields, entry, onChange, 3);
  }

  function render(container, entries, prices, onChange) {
    const shellEl = document.createElement("div");
    UI.renderEntryShell(shellEl, {
      entries, makeDefaultEntry,
      entryLabel: (e, i) => `${label} #${i + 1}`,
      renderEntryBody, onChange,
    });
    const agg = U.aggregateModule(entries, calculateEntry, prices);
    const tableEl = document.createElement("div"); tableEl.style.marginTop = "16px";
    UI.renderTable(tableEl, agg.rows);
    container.innerHTML = "";
    container.appendChild(shellEl);
    container.appendChild(tableEl);
    return agg;
  }

  return { id, label, methods: [{ key: "default", label }], makeDefaultEntry, calculateEntry, render };
};
