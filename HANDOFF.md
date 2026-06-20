# ICS Estimator Suite — Handoff Document

**Status: v1 complete, tested, delivered.**
Pure HTML/CSS/JS, no backend, no build step. Open `index.html` directly in a browser (double-click works, or serve via any static server).

---

## 1. Scope delivered (per your answers)

- **30 modul kerja** lengkap di sidebar, dikelompokkan: Struktur (8) / Arsitektur (13, termasuk 1 alias) / MEP (3) / Pekerjaan Luar (4) / Rekapitulasi (1).
- **8 modul struktur** = full depth, multi-metode dengan perbandingan Beton vs Baja (value engineering): Pondasi, Sloof, Kolom, Balok, Ring Balok, Plat Lantai, Tangga, Rangka Atap.
- **20 modul arsitektur/MEP/luar** = kerangka siap isi: working formula sederhana (1 metode), bukan placeholder kosong — semua sudah menghasilkan RAB nyata dan masuk ke Rekapitulasi, tinggal didalami lagi nanti (tambah metode, tambah detail) kalau dibutuhkan.
- **1 alias**: "Rangka Hollow Plafon" tidak punya kalkulasi sendiri — sudah otomatis termasuk dalam modul "Plafon Gypsum" (klik di sidebar akan menampilkan pesan pengalihan, menghindari hitung ganda).
- **Manajemen proyek penuh**: multi-proyek (buat/duplikat/ganti nama/hapus), backup & restore JSON (full backup: semua proyek + master harga sekaligus), localStorage persistence.
- **Master Harga**: ~95 item harga dikelompokkan per kategori, semua bisa diedit dan langsung memengaruhi semua modul (live recompute), reset ke default tersedia.
- **Rekapitulasi RAB**: subtotal per kategori, dashboard (volume beton, berat besi+baja, luas dinding, luas atap, luas keramik, titik listrik), pie chart distribusi biaya per kategori, parameter markup (overhead/profit/contingency/PPN) yang bisa diatur per proyek.
- **Export**: Cetak (print CSS), PDF (jsPDF+autotable), Excel (SheetJS), CSV — generik, bekerja untuk modul apa pun yang sedang dibuka (termasuk Rekapitulasi).

## 2. Folder structure

```
index.html         <- shell HTML, urutan <script> = urutan dependency
style.css          <- satu file, terang+gelap via [data-theme]
script.js          <- app shell: routing, project mgmt, master harga, export

data/               konstanta & data statis (tidak ada logika)
  profilBaja.js       database profil baja/kayu (kg/m)
  hargaDefault.js     PRICE_GROUPS (utk UI) + DEFAULT_PRICES (flat, utk kalkulasi)
  moduleRegistry.js   30 modul: id/label/kategori/depth/aliasOf
  konstantaBeton.js   tabel berat besi, mix beton per mutu, asumsi bekisting
  konstantaBaja.js    jarak sambungan/kopel, jumlah baut/las per titik

utils/              fungsi murni (testable tanpa DOM) + 1 factory
  format.js           fmtRp/fmtNum/fmtInt/uid
  betonCalc.js        engine beton+besi generik (dipakai semua modul beton)
  bajaCalc.js         konversi panjang->berat profil baja generik
  rab.js              RAB row builder (group/item/subtotal/grand)
  aggregate.js        gabungkan banyak "entry" jadi 1 hasil per modul
  storage.js          localStorage: master harga + CRUD proyek + backup/restore
  simpleModuleFactory.js  factory utk 20 modul "simple" (hemat duplikasi kode)

components/         UI generik dipakai semua modul
  ui.js               sidebar, tabel RAB, entry-list shell, field grid, stat grid, alert
  chart.js            pie chart SVG murni (tanpa library)

modules/            satu file = satu domain pekerjaan, 1+ modul terdaftar
  pondasi.js, sloof.js, kolom.js, balok.js, ringbalok.js,
  platlantai.js, tangga.js, rangkaAtap.js   <- 8 modul struktur (full)
  dinding.js, plesterAcian.js, lantaiKeramik.js, plafon.js,
  penutupAtap.js, talang.js, kusenPintuJendela.js, catDinding.js,
  mep.js, luar.js                           <- 20 modul simple
  rekap.js                                  <- sistem agregator
```

## 3. Pola arsitektur kunci

**Namespace global**: semua file menempel ke `window.ICS = {data, utils, components, modules}`. Tidak pakai ES modules — sengaja, supaya bisa dibuka langsung dari `file://` tanpa server (ES module import via `file://` diblokir CORS di Chrome).

**Interface modul standar** (struktur & simple sama-sama begini):
```js
window.ICS.modules.<id> = {
  id, label, methods: [{key,label}],
  makeDefaultEntry(metode),          // -> 1 object input default
  calculateEntry(entry, prices),     // PURE, no DOM -> {rows, totalMaterial, totalUpah, warnings, summary}
  render(container, entries, prices, onChange)  // tampilkan UI, return hasil agregat
}
```
`calculateEntry` selalu murni (tidak sentuh DOM) — ini yang memungkinkan logika dites lewat Node tanpa browser sama sekali (lihat §5).

**Multi-instance per modul**: tiap modul menyimpan ARRAY of entries (bukan 1 objek), jadi user bisa punya beberapa "Kolom K1 30x30" dan "Kolom K2 40x40" sebagai entry terpisah dalam modul Kolom yang sama. `utils/aggregate.js` menggabungkan semua entry jadi satu RAB dengan satu subtotal/grand di akhir.

**Factory utk modul simple**: `utils/simpleModuleFactory.js` menangani render/shell/agregasi secara generik — tiap modul simple HANYA perlu definisikan `fields` (metadata input) + `calcFn(entry, prices)`. Ini yang membuat 20 modul bisa selesai cepat & konsisten.

**Rangka Atap — pendekatan koefisien**: alih-alih memodelkan tiap batang kuda-kuda/gording/reng satu per satu (kompleks & butuh asumsi spacing yang akan meleset di lapangan), modul ini pakai geometri NYATA (panjang miring dari kemiringan atap sungguhan) dikombinasi dengan satu "Faktor Rangka" yang editable (default 1.8–2.3x tergantung metode) yang merepresentasikan total kebutuhan member tambahan (bottom chord+web+gording) relatif terhadap top chord. Ini pola estimator standar industri utk baja ringan; nilai default bisa disesuaikan begitu Anda punya data konsumsi riil dari proyek ICS.

## 4. Keputusan desain yang mungkin perlu Anda tahu

- **Pondasi tetap 1 metode (beton)** — sengaja, footplat tidak punya alternatif baja yang umum dipakai.
- **Ring Balok pakai CNP tunggal** (bukan double seperti Sloof/Kolom) — sesuai kebiasaan lapangan, ring balok lebih ringan.
- **"Berat" di summary modul struktur** dipakai gabungan utk dashboard "Berat Besi + Baja" — secara fisik ini mencampur kg besi tulangan dan kg profil baja, ini SENGAJA sebagai satu angka tonase total struktur, bukan kesalahan.
- **Harga baja ringan & kayu** di-set per-meter (`bajaRinganPerM`, `kasoKonstruksi`), BUKAN per-kg — karena itu cara pasar menjualnya. Profil IWF/WF/H-Beam/CNP/Hollow pakai `bajaProfilPerKg` (dijual per kg di pasaran).
- **Penutup Atap (Spandek/Genteng)** sebenarnya SATU mesin kalkulasi (factory `buatModulPenutupAtap`), didaftarkan 2x dengan default material berbeda — supaya bisa dipakai independen utk 2 area atap berbeda dalam 1 proyek tanpa konflik data.
- **Kanopi & Carport** demikian juga, satu factory `buatModulAtapRingan`, beda default luas saja.

## 5. Testing yang sudah dilakukan (penting — baca sebelum mengubah apa pun)

Tiga lapis testing dijalankan SEBELUM file ini diserahkan:

1. **Unit logic test (Node, tanpa DOM)** — tiap `calculateEntry` dari 28 modul nyata (8 struktur × semua metode + 20 simple) dijalankan dengan default entry, dicek tidak ada `NaN`, nilai masuk akal secara relatif (mis. Hollow Galvanis kolom jauh lebih murah dari H-Beam, baja ringan jauh lebih murah dari IWF utk rangka atap — sesuai realita pasar). Rekapitulasi diverifikasi manual: hasil markup chain (overhead→profit→contingency→PPN berantai) dicocokkan dengan hitungan manual, sama persis.
2. **Full load test** — ke-34 file JS dimuat berurutan persis seperti urutan `<script>` di `index.html`, dicek tidak ada syntax error, semua modul di `MODULE_REGISTRY` (kecuali alias & rekap) terdaftar di `window.ICS.modules`, semua path `<script src>` di `index.html` benar-benar ada di disk.
3. **Integration test (jsdom — DOM asli, bukan mock)** — simulasi interaksi user sungguhan: klik sidebar pindah modul, klik "+ Tambah Item"/"Hapus" pada entry, ganti metode (Beton→CNP Double) dan verifikasi RAB berubah, edit harga semen di Master Harga dan verifikasi nilai itu langsung muncul di RAB Pondasi tanpa reload, buka modul alias dan cek pesan pengalihan muncul, buka Rekapitulasi dan cek stat grid+pie chart+grand total muncul lalu berubah saat overhead% diubah, buat proyek baru dan cek datanya terisolasi (kosong) dari proyek sebelumnya. **28 dari 28 pengecekan lolos.**

Tidak ada test file yang ikut diserahkan (sudah dibersihkan) — kalau Anda mau saya tulis ulang test harness-nya kapan-kapan (misal setelah menambah modul baru), tinggal minta.

## 6. Cara extend (kalau mau memperdalam modul "simple")

Contoh: ingin menambah metode ke modul Cat Dinding (sekarang cuma 1 metode).
1. Buka `modules/catDinding.js`.
2. Modul ini dibuat via `U.createSimpleModule({...})` — kalau mau multi-metode, ganti pola jadi seperti modul struktur (lihat `modules/sloof.js` sebagai template plg sederhana): definisikan `METHODS`, beberapa `FIELDS_*` per metode, `fieldsFor(metode)`, lalu `calculateEntry` yang switch berdasar `entry.metode`.
3. Jangan lupa cek nama price key persis sama dengan yang ada di `data/hargaDefault.js` — ini sumber bug paling sering (sudah 1x kejadian saat development: `upahCor` vs `upahPengecoran`).

Kalau mau menambah modul ke-31 (di luar 30 yang sudah ada): tambahkan entri baru di `data/moduleRegistry.js` (id/label/kategori/depth), buat file modul baru yang registrasi ke `window.ICS.modules.<id>`, tambahkan `<script src="modules/xxx.js">` di `index.html` SEBELUM `script.js`. Selesai — sidebar, Rekapitulasi, dan project storage otomatis mengenalinya (tidak perlu ubah `script.js` atau `storage.js`).

## 7. Belum dikerjakan / batasan yang disadari

- Tidak ada validasi input "hard limit" (misal tinggi kolom negatif) selain beberapa warning di Pondasi & Kolom (tinggi>6m). Kalau mau lebih defensif, tambahkan validasi di `calculateEntry` masing-masing modul.
- Export CSV/Excel/PDF mengambil rows dari TAMPILAN YANG SEDANG AKTIF (`LAST_EXPORT_ROWS` di `script.js`) — kalau ingin export "semua modul jadi 1 file Excel multi-sheet", itu belum ada, perlu ditambahkan terpisah.
- Faktor-faktor koefisien (Rangka Atap, Plafon hollow, Kanopi/Carport/Pagar) adalah ASUMSI DEFAULT yang masuk akal tapi generik — sangat disarankan disesuaikan dengan data konsumsi riil proyek ICS begitu tersedia, lewat field "Koefisien..." yang sudah disediakan di tiap modul terkait (tidak perlu edit kode).

---
*Dibuat otomatis sebagai bagian dari proses delivery v1, untuk memudahkan sesi lanjutan jika Anda kembali membahas suite ini.*
