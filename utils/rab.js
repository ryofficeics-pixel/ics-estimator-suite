/* ============================================================
   RAB BUILDER — struktur baris RAB yang konsisten untuk semua
   modul: { no, uraian, satuan, volume, harga, jumlah, tipe }
   tipe: 'material' | 'upah'  (dipakai untuk subtotal otomatis)
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

window.ICS.utils.createRab = function () {
  const rows = [];
  let no = 0;

  function group(label) { rows.push({ uraian: label, isGroup: true }); }

  function item(uraian, satuan, volume, harga, opts = {}) {
    const jumlah = opts.jumlah !== undefined ? opts.jumlah : volume * harga;
    rows.push({
      no: ++no, uraian, satuan, volume, harga, jumlah,
      tipe: opts.tipe || "material", note: opts.note || null,
    });
  }

  function subtotal(label, jumlah) { rows.push({ uraian: label, isSubtotal: true, jumlah }); }
  function grand(label, jumlah) { rows.push({ uraian: label, isGrand: true, jumlah }); }

  function totalByTipe(tipe) {
    return rows.filter((r) => !r.isGroup && !r.isSubtotal && !r.isGrand && r.tipe === tipe)
      .reduce((a, b) => a + b.jumlah, 0);
  }

  function finalize(labelMaterial = "Subtotal Material", labelUpah = "Subtotal Upah", labelGrand = "Total") {
    const totalMaterial = totalByTipe("material");
    const totalUpah = totalByTipe("upah");
    subtotal(labelMaterial, totalMaterial);
    subtotal(labelUpah, totalUpah);
    grand(labelGrand, totalMaterial + totalUpah);
    return { rows, totalMaterial, totalUpah, total: totalMaterial + totalUpah };
  }

  return { group, item, subtotal, grand, totalByTipe, finalize, rows };
};
