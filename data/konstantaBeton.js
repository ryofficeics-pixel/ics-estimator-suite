/* ============================================================ KONSTANTA BETON & PEMBESIAN (dipakai bersama oleh semua modul beton) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.data = window.ICS.data || {};

window.ICS.data.BERAT_BESI = { 8: 0.395, 10: 0.617, 12: 0.888, 13: 1.04, 16: 1.58 }; // kg/m
window.ICS.data.PANJANG_BATANG_STD = 12; // meter/batang pasaran
window.ICS.data.RASIO_BENDRAT = 1 / 40;  // kg bendrat per kg besi
window.ICS.data.HOOK_ALLOWANCE_M = 0.10; // tambahan panjang kait/bengkokan sengkang per batang (m)

window.ICS.data.MIX_BETON = { // per 1 m3 beton: semen(zak 50kg), pasir & split (m3)
  K175: { semen: 6.8, pasir: 0.54, split: 0.81 },
  K225: { semen: 8.0, pasir: 0.50, split: 0.80 },
  K250: { semen: 8.4, pasir: 0.49, split: 0.78 },
  K300: { semen: 9.2, pasir: 0.47, split: 0.76 },
};

window.ICS.data.MIX_LANTAI_KERJA = { semen: 4.0, pasir: 0.60, split: 0.80 }; // per m3, rabat

window.ICS.data.BEKISTING_ASUMSI = {
  luasPerTriplek: 2.98, // m2/lembar
  kasoPerM2: 4.0,       // m kayu kaso per m2 bekisting
  pakuPerM2: 0.05,      // kg paku per m2 bekisting
};
