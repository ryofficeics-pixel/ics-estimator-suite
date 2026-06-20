/* ============================================================
   STORAGE — Project Management (multi-proyek) + Master Harga
   Semua persist ke localStorage. Tidak ada backend.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

(function () {
  const KEY_PRICES = "ics_suite_prices_v1";
  const KEY_INDEX = "ics_suite_projects_index_v1";
  const KEY_PROJECT_PREFIX = "ics_suite_project_v1_";
  const KEY_ACTIVE = "ics_suite_active_project_v1";

  function safeParse(raw, fallback) {
    try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
  }

  /* ---------------- Master Harga ---------------- */
  function loadPrices() {
    const raw = localStorage.getItem(KEY_PRICES);
    const parsed = safeParse(raw, null);
    return { ...window.ICS.data.DEFAULT_PRICES, ...(parsed || {}) };
  }
  function savePrices(prices) {
    localStorage.setItem(KEY_PRICES, JSON.stringify(prices));
  }
  function resetPrices() {
    const p = { ...window.ICS.data.DEFAULT_PRICES };
    savePrices(p);
    return p;
  }

  /* ---------------- Index Proyek ---------------- */
  function listProjects() {
    return safeParse(localStorage.getItem(KEY_INDEX), []);
  }
  function saveIndex(idx) { localStorage.setItem(KEY_INDEX, JSON.stringify(idx)); }

  function touchIndexEntry(id, patch) {
    const idx = listProjects();
    const i = idx.findIndex((p) => p.id === id);
    if (i >= 0) idx[i] = { ...idx[i], ...patch };
    saveIndex(idx);
  }

  /* ---------------- Proyek CRUD ---------------- */
  function defaultProjectState(nama) {
    const now = new Date().toISOString();
    const entries = {};
    window.ICS.data.MODULE_REGISTRY.forEach((m) => { if (m.depth !== "system" && m.depth !== "alias") entries[m.id] = []; });
    return {
      meta: { id: window.ICS.utils.uid("proj"), nama: nama || "Proyek Baru", dibuat: now, diubah: now },
      entries,
      rekapSettings: { overheadPct: 8, profitPct: 10, ppnPct: 11, contingencyPct: 3 },
    };
  }

  function createProject(nama) {
    const state = defaultProjectState(nama);
    saveProject(state);
    const idx = listProjects();
    idx.push({ id: state.meta.id, nama: state.meta.nama, dibuat: state.meta.dibuat, diubah: state.meta.diubah });
    saveIndex(idx);
    setActiveProjectId(state.meta.id);
    return state;
  }

  function loadProject(id) {
    return safeParse(localStorage.getItem(KEY_PROJECT_PREFIX + id), null);
  }

  function saveProject(state) {
    state.meta.diubah = new Date().toISOString();
    localStorage.setItem(KEY_PROJECT_PREFIX + state.meta.id, JSON.stringify(state));
    touchIndexEntry(state.meta.id, { nama: state.meta.nama, diubah: state.meta.diubah });
  }

  function deleteProject(id) {
    localStorage.removeItem(KEY_PROJECT_PREFIX + id);
    saveIndex(listProjects().filter((p) => p.id !== id));
    if (getActiveProjectId() === id) {
      const remaining = listProjects();
      setActiveProjectId(remaining.length ? remaining[0].id : null);
    }
  }

  function cloneProject(id, namaBaru) {
    const src = loadProject(id);
    if (!src) return null;
    const clone = JSON.parse(JSON.stringify(src));
    clone.meta.id = window.ICS.utils.uid("proj");
    clone.meta.nama = namaBaru || src.meta.nama + " (copy)";
    clone.meta.dibuat = new Date().toISOString();
    saveProject(clone);
    const idx = listProjects();
    idx.push({ id: clone.meta.id, nama: clone.meta.nama, dibuat: clone.meta.dibuat, diubah: clone.meta.dibuat });
    saveIndex(idx);
    return clone;
  }

  function getActiveProjectId() {
    return localStorage.getItem(KEY_ACTIVE) || null;
  }
  function setActiveProjectId(id) {
    if (id) localStorage.setItem(KEY_ACTIVE, id); else localStorage.removeItem(KEY_ACTIVE);
  }

  function ensureActiveProject() {
    let id = getActiveProjectId();
    if (id && loadProject(id)) return loadProject(id);
    const list = listProjects();
    if (list.length) { setActiveProjectId(list[0].id); return loadProject(list[0].id); }
    return createProject("Proyek 1");
  }

  /* ---------------- Backup / Restore JSON ---------------- */
  function exportProjectJSON(id) {
    const state = loadProject(id);
    if (!state) return null;
    return JSON.stringify({ _type: "ics_suite_project_backup", version: 1, project: state }, null, 2);
  }
  function exportAllJSON() {
    const all = listProjects().map((p) => loadProject(p.id)).filter(Boolean);
    return JSON.stringify({ _type: "ics_suite_full_backup", version: 1, prices: loadPrices(), projects: all }, null, 2);
  }
  function importJSON(jsonStr) {
    const data = safeParse(jsonStr, null);
    if (!data) throw new Error("File backup tidak valid (bukan JSON).");
    const importedIds = [];
    if (data._type === "ics_suite_project_backup" && data.project) {
      const p = data.project;
      p.meta.id = window.ICS.utils.uid("proj"); // hindari id bentrok
      saveProject(p);
      const idx = listProjects();
      idx.push({ id: p.meta.id, nama: p.meta.nama, dibuat: p.meta.dibuat, diubah: p.meta.diubah });
      saveIndex(idx);
      importedIds.push(p.meta.id);
    } else if (data._type === "ics_suite_full_backup" && Array.isArray(data.projects)) {
      if (data.prices) savePrices({ ...window.ICS.data.DEFAULT_PRICES, ...data.prices });
      data.projects.forEach((p) => {
        p.meta.id = window.ICS.utils.uid("proj");
        saveProject(p);
        const idx = listProjects();
        idx.push({ id: p.meta.id, nama: p.meta.nama, dibuat: p.meta.dibuat, diubah: p.meta.diubah });
        saveIndex(idx);
        importedIds.push(p.meta.id);
      });
    } else {
      throw new Error("Format backup tidak dikenali.");
    }
    return importedIds;
  }

  window.ICS.utils.storage = {
    loadPrices, savePrices, resetPrices,
    listProjects, createProject, loadProject, saveProject, deleteProject, cloneProject,
    getActiveProjectId, setActiveProjectId, ensureActiveProject,
    exportProjectJSON, exportAllJSON, importJSON,
  };
})();
