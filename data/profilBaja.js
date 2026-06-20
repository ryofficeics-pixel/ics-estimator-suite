/* ============================================================
   DATABASE PROFIL BAJA & RANGKA
   Berat per meter (kg/m) — referensi tabel baja standar pasaran.
   Tambah/ubah baris di sini untuk memperluas database, semua
   modul (Kolom/Balok/Sloof/RingBalok/RangkaAtap) otomatis ikut.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.data = window.ICS.data || {};

window.ICS.data.profilBaja = {

  IWF: {
    label: "WF / IWF (Wide Flange)",
    items: {
      "IWF150": { label: "IWF 150x75",  beratPerM: 14.0 },
      "IWF200": { label: "IWF 200x100", beratPerM: 21.3 },
      "IWF250": { label: "IWF 250x125", beratPerM: 29.0 },
      "IWF300": { label: "IWF 300x150", beratPerM: 36.7 },
      "IWF350": { label: "IWF 350x175", beratPerM: 49.6 },
      "IWF400": { label: "IWF 400x200", beratPerM: 66.0 },
    },
  },

  WF_BUILTUP: {
    label: "WF Built-Up (plat susun)",
    items: {
      "WF100": { label: "WF Built-Up 100", beratPerM: 9.3 },
      "WF150": { label: "WF Built-Up 150", beratPerM: 13.5 },
      "WF200": { label: "WF Built-Up 200", beratPerM: 18.6 },
      "WF250": { label: "WF Built-Up 250", beratPerM: 24.6 },
      "WF300": { label: "WF Built-Up 300", beratPerM: 31.0 },
    },
  },

  HBEAM: {
    label: "H-Beam",
    items: {
      "H100":  { label: "H-Beam 100x100", beratPerM: 17.2 },
      "H150":  { label: "H-Beam 150x150", beratPerM: 31.5 },
      "H200":  { label: "H-Beam 200x200", beratPerM: 49.9 },
      "H250":  { label: "H-Beam 250x250", beratPerM: 72.4 },
      "H300":  { label: "H-Beam 300x300", beratPerM: 94.0 },
    },
  },

  CNP: {
    label: "CNP (Kanal C)",
    items: {
      "C75":  { label: "CNP 75",  beratPerM: 6.11 },
      "C100": { label: "CNP 100", beratPerM: 8.42 },
      "C125": { label: "CNP 125", beratPerM: 10.10 },
      "C150": { label: "CNP 150", beratPerM: 14.50 },
    },
  },

  HOLLOW: {
    label: "Hollow Galvanis",
    items: {
      "H40x40":   { label: "Hollow 40x40 (1.8mm)",  beratPerM: 2.07 },
      "H50x50":   { label: "Hollow 50x50 (2.0mm)",  beratPerM: 2.90 },
      "H75x75":   { label: "Hollow 75x75 (2.3mm)",  beratPerM: 5.01 },
      "H100x100": { label: "Hollow 100x100 (3.0mm)",beratPerM: 8.65 },
    },
  },

  BAJA_RINGAN: {
    label: "Baja Ringan (rangka atap)",
    items: {
      "C75BR":   { label: "Kanal C75 (TS 0.75mm)", beratPerM: 0.95 },
      "RENG31":  { label: "Reng R31 (TS 0.45mm)",  beratPerM: 0.45 },
    },
  },

  KAYU: {
    label: "Kayu Konstruksi",
    items: {
      "KASO5x7":  { label: "Kaso 5/7",  beratPerM: 0, hargaPerMeter: true },
      "USUK4x6":  { label: "Usuk 4/6",  beratPerM: 0, hargaPerMeter: true },
      "RENGKAYU": { label: "Reng kayu", beratPerM: 0, hargaPerMeter: true },
    },
  },
};

/* Helper lookup cepat: ambil objek profil dari key keluarga + key item */
window.ICS.data.getProfil = function (keluarga, key) {
  const fam = window.ICS.data.profilBaja[keluarga];
  if (!fam) return null;
  return fam.items[key] || null;
};
