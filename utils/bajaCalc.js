/* ============================================================
   ENGINE PROFIL BAJA (generik) — konversi panjang -> berat,
   dipakai oleh modul Kolom/Balok/Sloof/RingBalok metode baja.
   Biaya aksesoris (baseplate/baut/las/cat) dihitung di tiap
   modul karena jumlahnya spesifik per jenis elemen.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

window.ICS.data.CAT_BESI_KG_PER_KG_BESI = 0.06; // asumsi kebutuhan cat besi per kg berat profil

(function () {
  const D = window.ICS.data;

  /** panjangTotal_m = total panjang profil terpakai (sebelum waste). */
  function calcProfil(keluarga, profilKey, panjangTotal_m, wasteMul) {
    const profil = D.getProfil(keluarga, profilKey);
    if (!profil) return null;
    const panjangWaste = panjangTotal_m * wasteMul;
    const beratTotal = panjangWaste * profil.beratPerM;
    return { keluarga, profilKey, label: profil.label, beratPerM: profil.beratPerM, panjangWaste, beratTotal };
  }

  /** Biaya cat besi berdasarkan berat total profil. */
  function biayaCatBesi(beratTotal_kg, hargaCatPerKg) {
    return beratTotal_kg * D.CAT_BESI_KG_PER_KG_BESI * hargaCatPerKg;
  }

  /** Daftar opsi <select> untuk satu keluarga profil — dipakai render UI. */
  function opsiProfil(keluarga) {
    const fam = D.profilBaja[keluarga];
    if (!fam) return [];
    return Object.keys(fam.items).map((key) => ({ key, label: fam.items[key].label }));
  }

  window.ICS.utils.baja = { calcProfil, biayaCatBesi, opsiProfil };
})();
