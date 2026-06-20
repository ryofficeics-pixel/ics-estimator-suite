/* ============================================================
   MASTER HARGA — default & metadata kategori
   Struktur: PRICE_GROUPS (untuk render tabel per kategori di UI)
   -> diturunkan otomatis jadi DEFAULT_PRICES (flat key:value)
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.data = window.ICS.data || {};

window.ICS.data.PRICE_GROUPS = [
  {
    group: "Beton & Pembesian",
    items: [
      { key: "semen", label: "Semen", unit: "/zak", value: 65000 },
      { key: "pasir", label: "Pasir", unit: "/m³", value: 350000 },
      { key: "split", label: "Split / Kerikil", unit: "/m³", value: 400000 },
      { key: "batuKali", label: "Batu kali", unit: "/m³", value: 320000 },
      { key: "besiD8", label: "Besi D8", unit: "/kg", value: 13500 },
      { key: "besiD10", label: "Besi D10", unit: "/kg", value: 13000 },
      { key: "besiD12", label: "Besi D12", unit: "/kg", value: 12800 },
      { key: "besiD13", label: "Besi D13", unit: "/kg", value: 12800 },
      { key: "besiD16", label: "Besi D16", unit: "/kg", value: 12500 },
      { key: "wiremesh", label: "Wiremesh M8 (lembar 2.1x5.4m)", unit: "/lembar", value: 850000 },
      { key: "bendrat", label: "Kawat bendrat", unit: "/kg", value: 24000 },
    ],
  },
  {
    group: "Bekisting & Kayu",
    items: [
      { key: "triplek", label: "Triplek cor", unit: "/lembar", value: 120000 },
      { key: "kasoBekisting", label: "Kayu kaso bekisting", unit: "/m", value: 25000 },
      { key: "paku", label: "Paku", unit: "/kg", value: 22000 },
      { key: "kasoKonstruksi", label: "Kaso 5/7 (kuda-kuda kayu)", unit: "/m", value: 32000 },
      { key: "usuk", label: "Usuk 4/6", unit: "/m", value: 18000 },
      { key: "rengKayu", label: "Reng kayu", unit: "/m", value: 8500 },
    ],
  },
  {
    group: "Baja Profil & Aksesoris",
    items: [
      { key: "bajaProfilPerKg", label: "Baja profil (IWF/WF/H-Beam/CNP/Hollow)", unit: "/kg", value: 16500 },
      { key: "bajaRinganPerM", label: "Baja ringan C75 / Reng", unit: "/m", value: 28000 },
      { key: "baseplate", label: "Plat baseplate (set)", unit: "/set", value: 350000 },
      { key: "angkur", label: "Angkur baut", unit: "/btg", value: 25000 },
      { key: "platSambungan", label: "Plat sambungan", unit: "/set", value: 180000 },
      { key: "bautMurBaja", label: "Baut + mur baja", unit: "/set", value: 8000 },
      { key: "elektrodaLas", label: "Elektroda las", unit: "/kg", value: 45000 },
      { key: "catBesi", label: "Cat besi (zincromate+top coat)", unit: "/kg", value: 55000 },
      { key: "dynabolt", label: "Dynabolt", unit: "/pcs", value: 9000 },
      { key: "sekrupBajaRingan", label: "Sekrup baja ringan", unit: "/pcs", value: 600 },
    ],
  },
  {
    group: "Pasangan & Plesteran",
    items: [
      { key: "bataMerah", label: "Bata merah", unit: "/bh", value: 900 },
      { key: "hebel", label: "Hebel / bata ringan AAC", unit: "/bh", value: 6500 },
      { key: "perekatHebel", label: "Semen instan perekat hebel", unit: "/zak", value: 75000 },
    ],
  },
  {
    group: "Atap & Talang",
    items: [
      { key: "spandek", label: "Spandek", unit: "/m²", value: 75000 },
      { key: "spandekPasir", label: "Spandek pasir", unit: "/m²", value: 95000 },
      { key: "gentengMetal", label: "Genteng metal", unit: "/lembar", value: 25000 },
      { key: "gentengBeton", label: "Genteng beton", unit: "/bh", value: 6500 },
      { key: "zincalume", label: "Zincalume", unit: "/m²", value: 70000 },
      { key: "upvcAtap", label: "UPVC atap", unit: "/m²", value: 145000 },
      { key: "sandwichPanel", label: "Sandwich panel", unit: "/m²", value: 210000 },
      { key: "nok", label: "Nok atap", unit: "/m", value: 65000 },
      { key: "talang", label: "Talang air", unit: "/m", value: 85000 },
      { key: "sekrupAtap", label: "Sekrup atap", unit: "/pcs", value: 700 },
    ],
  },
  {
    group: "Plafon",
    items: [
      { key: "gypsum", label: "Gypsum board (120x240)", unit: "/lembar", value: 68000 },
      { key: "pvcPlafon", label: "PVC plafon", unit: "/lembar", value: 95000 },
      { key: "grcPlafon", label: "GRC board", unit: "/lembar", value: 105000 },
      { key: "kalsiboard", label: "Kalsiboard", unit: "/lembar", value: 72000 },
      { key: "hollowPlafon", label: "Hollow rangka plafon", unit: "/m", value: 13000 },
      { key: "sekrupPlafon", label: "Sekrup plafon", unit: "/pcs", value: 350 },
      { key: "listPlafon", label: "List plafon", unit: "/m", value: 18000 },
    ],
  },
  {
    group: "Kusen, Pintu & Jendela",
    items: [
      { key: "kusenAluminium", label: "Kusen aluminium", unit: "/m", value: 95000 },
      { key: "kusenKayu", label: "Kusen kayu kamper", unit: "/m", value: 145000 },
      { key: "kusenUPVC", label: "Kusen UPVC", unit: "/m", value: 165000 },
      { key: "kusenBajaRingan", label: "Kusen baja ringan", unit: "/m", value: 110000 },
      { key: "daunPintuKayu", label: "Daun pintu kayu", unit: "/unit", value: 850000 },
      { key: "daunPintuAluminium", label: "Daun pintu aluminium", unit: "/unit", value: 1200000 },
      { key: "daunPintuUPVC", label: "Daun pintu UPVC", unit: "/unit", value: 1450000 },
      { key: "daunPintuKacaFrameless", label: "Pintu kaca frameless", unit: "/unit", value: 2500000 },
      { key: "daunPintuHollow", label: "Pintu besi hollow", unit: "/unit", value: 950000 },
      { key: "jendelaAluminium", label: "Jendela aluminium (set)", unit: "/unit", value: 650000 },
      { key: "jendelaUPVC", label: "Jendela UPVC (set)", unit: "/unit", value: 850000 },
      { key: "jendelaKayu", label: "Jendela kayu (set)", unit: "/unit", value: 750000 },
      { key: "kacaMati", label: "Kaca mati (set)", unit: "/unit", value: 450000 },
      { key: "kacaSliding", label: "Kaca sliding (set)", unit: "/unit", value: 950000 },
      { key: "kaca", label: "Kaca polos 5mm", unit: "/m²", value: 180000 },
      { key: "sealant", label: "Sealant", unit: "/tube", value: 35000 },
      { key: "aksesorisKusen", label: "Aksesoris (engsel/handle/kunci)", unit: "/set", value: 120000 },
    ],
  },
  {
    group: "Finishing & Cat",
    items: [
      { key: "catTembok", label: "Cat tembok", unit: "/kg", value: 38000 },
      { key: "plamir", label: "Plamir / skim coat", unit: "/kg", value: 15000 },
      { key: "primer", label: "Cat primer / alkali resisting", unit: "/kg", value: 32000 },
    ],
  },
  {
    group: "Lantai",
    items: [
      { key: "keramik", label: "Keramik 40x40 (per dus 1.44m²)", unit: "/dus", value: 65000 },
      { key: "granit", label: "Granit tile", unit: "/m²", value: 185000 },
      { key: "homogeneousTile", label: "Homogeneous tile", unit: "/m²", value: 165000 },
      { key: "vinyl", label: "Vinyl lantai", unit: "/m²", value: 120000 },
      { key: "epoxy", label: "Epoxy coating", unit: "/m²", value: 95000 },
      { key: "semenPerekatKeramik", label: "Semen perekat keramik", unit: "/zak", value: 70000 },
      { key: "nat", label: "Nat keramik", unit: "/kg", value: 18000 },
    ],
  },
  {
    group: "Listrik",
    items: [
      { key: "kabelNYM", label: "Kabel NYM", unit: "/m", value: 9500 },
      { key: "pipaConduit", label: "Pipa conduit", unit: "/m", value: 6500 },
      { key: "boxPanel", label: "Box panel / junction box", unit: "/unit", value: 35000 },
      { key: "stopKontak", label: "Stop kontak", unit: "/unit", value: 28000 },
      { key: "saklar", label: "Saklar", unit: "/unit", value: 25000 },
      { key: "lampu", label: "Lampu (titik)", unit: "/unit", value: 65000 },
      { key: "mcb", label: "MCB", unit: "/unit", value: 45000 },
    ],
  },
  {
    group: "Plumbing & Sanitair",
    items: [
      { key: "pipaPVCAirBersih", label: "Pipa PVC air bersih", unit: "/m", value: 18000 },
      { key: "pipaPVCBuangan", label: "Pipa PVC buangan", unit: "/m", value: 22000 },
      { key: "fitting", label: "Fitting / sambungan pipa", unit: "/set", value: 8500 },
      { key: "floorDrain", label: "Floor drain", unit: "/unit", value: 45000 },
      { key: "tandon", label: "Tandon air 1000L", unit: "/unit", value: 1850000 },
      { key: "pompaAir", label: "Pompa air", unit: "/unit", value: 950000 },
      { key: "closetDuduk", label: "Closet duduk", unit: "/unit", value: 1450000 },
      { key: "wastafel", label: "Wastafel", unit: "/unit", value: 650000 },
      { key: "shower", label: "Shower set", unit: "/unit", value: 450000 },
      { key: "kranAir", label: "Kran air", unit: "/unit", value: 85000 },
    ],
  },
  {
    group: "Plat Lantai & Precast",
    items: [
      { key: "bondek", label: "Bondek (decking cor)", unit: "/m²", value: 110000 },
      { key: "floordeck", label: "Floordeck (decking berat)", unit: "/m²", value: 165000 },
      { key: "panelPrecast", label: "Panel lantai precast", unit: "/m²", value: 320000 },
    ],
  },
  {
    group: "Upah Kerja",
    items: [
      { key: "upahGali", label: "Upah gali tanah", unit: "/m³", value: 75000 },
      { key: "upahPasangBatu", label: "Upah pasang batu kali", unit: "/m³", value: 120000 },
      { key: "upahBekisting", label: "Upah bekisting", unit: "/m²", value: 60000 },
      { key: "upahPembesian", label: "Upah pembesian", unit: "/kg", value: 3500 },
      { key: "upahPengecoran", label: "Upah pengecoran", unit: "/m³", value: 95000 },
      { key: "upahPasangBata", label: "Upah pasang bata/hebel", unit: "/m²", value: 45000 },
      { key: "upahPlesterAci", label: "Upah plester + acian", unit: "/m²", value: 40000 },
      { key: "upahKeramik", label: "Upah pasang keramik/lantai", unit: "/m²", value: 55000 },
      { key: "upahCat", label: "Upah cat", unit: "/m²", value: 18000 },
      { key: "upahPlafon", label: "Upah pasang plafon", unit: "/m²", value: 45000 },
      { key: "upahAtap", label: "Upah pasang penutup atap", unit: "/m²", value: 35000 },
      { key: "upahRangkaAtap", label: "Upah pasang rangka atap", unit: "/m²", value: 40000 },
      { key: "upahKusen", label: "Upah pasang kusen/pintu/jendela", unit: "/unit", value: 150000 },
      { key: "upahListrik", label: "Upah instalasi listrik", unit: "/titik", value: 85000 },
      { key: "upahPlumbing", label: "Upah instalasi plumbing", unit: "/titik", value: 95000 },
      { key: "upahSanitair", label: "Upah pasang sanitair", unit: "/unit", value: 150000 },
      { key: "upahFabrikasiBaja", label: "Upah fabrikasi baja", unit: "/kg", value: 4500 },
      { key: "upahErectionBaja", label: "Upah erection baja", unit: "/kg", value: 2500 },
      { key: "upahLas", label: "Upah las", unit: "/titik", value: 15000 },
      { key: "upahPasangPrecast", label: "Upah pasang panel precast", unit: "/m²", value: 45000 },
    ],
  },
];

/* Flatten -> DEFAULT_PRICES { key: value } dipakai langsung oleh engine kalkulasi */
window.ICS.data.DEFAULT_PRICES = (function () {
  const out = {};
  window.ICS.data.PRICE_GROUPS.forEach((g) => g.items.forEach((it) => { out[it.key] = it.value; }));
  return out;
})();
