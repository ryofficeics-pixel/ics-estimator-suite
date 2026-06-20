/* ============================================================
   REGISTRY 30 MODUL PEKERJAAN
   Hanya metadata navigasi/kategori. Implementasi kalkulasi tiap
   modul didaftarkan sendiri di /modules/*.js ke window.ICS.modules[id]
   kategori dipakai untuk subtotal Rekapitulasi & Dashboard:
   "struktur" | "arsitektur" | "mep" | "luar"
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.data = window.ICS.data || {};

window.ICS.data.MODULE_REGISTRY = [
  { id: "pondasi",        label: "Pondasi Footplat",        kategori: "struktur",   depth: "full" },
  { id: "sloof",           label: "Sloof",                   kategori: "struktur",   depth: "full" },
  { id: "kolom",           label: "Kolom",                   kategori: "struktur",   depth: "full" },
  { id: "balok",           label: "Balok",                   kategori: "struktur",   depth: "full" },
  { id: "ringbalok",       label: "Ring Balok",              kategori: "struktur",   depth: "full" },
  { id: "platlantai",      label: "Plat Lantai",             kategori: "struktur",   depth: "full" },
  { id: "tangga",          label: "Tangga",                  kategori: "struktur",   depth: "full" },
  { id: "dindingBata",     label: "Dinding Bata Merah",      kategori: "arsitektur", depth: "simple" },
  { id: "dindingHebel",    label: "Dinding Hebel",           kategori: "arsitektur", depth: "simple" },
  { id: "plesterAcian",    label: "Plester dan Acian",       kategori: "arsitektur", depth: "simple" },
  { id: "lantaiKeramik",   label: "Lantai Keramik",          kategori: "arsitektur", depth: "simple" },
  { id: "plafonGypsum",    label: "Plafon Gypsum",           kategori: "arsitektur", depth: "simple" },
  { id: "rangkaHollowPlafon", label: "Rangka Hollow Plafon", kategori: "arsitektur", depth: "alias", aliasOf: "plafonGypsum" },
  { id: "rangkaAtap",      label: "Rangka Atap Baja Ringan", kategori: "struktur",   depth: "full" },
  { id: "atapSpandek",     label: "Atap Spandek",            kategori: "arsitektur", depth: "simple" },
  { id: "atapGenteng",     label: "Atap Genteng",             kategori: "arsitektur", depth: "simple" },
  { id: "talang",          label: "Talang",                  kategori: "arsitektur", depth: "simple" },
  { id: "kusenAluminium",  label: "Kusen Aluminium",          kategori: "arsitektur", depth: "simple" },
  { id: "kusenKayu",       label: "Kusen Kayu",               kategori: "arsitektur", depth: "simple" },
  { id: "pintu",           label: "Pintu",                    kategori: "arsitektur", depth: "simple" },
  { id: "jendela",         label: "Jendela",                  kategori: "arsitektur", depth: "simple" },
  { id: "catDinding",      label: "Cat Dinding",              kategori: "arsitektur", depth: "simple" },
  { id: "instalasiListrik",label: "Instalasi Listrik",        kategori: "mep",        depth: "simple" },
  { id: "instalasiAir",    label: "Instalasi Air Bersih",     kategori: "mep",        depth: "simple" },
  { id: "sanitair",        label: "Sanitair",                 kategori: "mep",        depth: "simple" },
  { id: "drainase",        label: "Drainase",                 kategori: "luar",       depth: "simple" },
  { id: "kanopi",          label: "Kanopi",                   kategori: "luar",       depth: "simple" },
  { id: "pagar",           label: "Pagar",                    kategori: "luar",       depth: "simple" },
  { id: "carport",         label: "Carport",                  kategori: "luar",       depth: "simple" },
  { id: "rekap",           label: "Rekapitulasi RAB",         kategori: "rekap",      depth: "system" },
];

window.ICS.data.KATEGORI_LABEL = {
  struktur: "Struktur",
  arsitektur: "Arsitektur",
  mep: "MEP",
  luar: "Pekerjaan Luar",
  rekap: "Rekapitulasi",
};
