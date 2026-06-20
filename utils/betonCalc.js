/* ============================================================
   ENGINE BETON & PEMBESIAN (generik, dipakai semua modul beton:
   Pondasi, Sloof, Kolom, Balok, Ring Balok, Plat Lantai, Tangga)
   Semua fungsi di sini PURE (tanpa akses DOM) agar mudah ditest.
   ============================================================ */
window.ICS = window.ICS || {};
window.ICS.utils = window.ICS.utils || {};

(function () {
  const D = window.ICS.data;

  /** Campuran beton (semen/pasir/split) untuk satu volume m3, sudah +waste. */
  function campuranBeton(volumeM3, mutu, wasteMul) {
    const mix = D.MIX_BETON[mutu] || D.MIX_BETON.K225;
    return {
      semen: mix.semen * volumeM3 * wasteMul,
      pasir: mix.pasir * volumeM3 * wasteMul,
      split: mix.split * volumeM3 * wasteMul,
    };
  }

  /** Campuran lantai kerja (rabat, mix tetap) untuk satu volume m3, sudah +waste. */
  function campuranLantaiKerja(volumeM3, wasteMul) {
    const mlk = D.MIX_LANTAI_KERJA;
    return {
      semen: mlk.semen * volumeM3 * wasteMul,
      pasir: mlk.pasir * volumeM3 * wasteMul,
      split: mlk.split * volumeM3 * wasteMul,
    };
  }

  /**
   * Hitung satu kelompok besi (diameter tunggal): panjang mentah -> +waste
   * -> jumlah batang 12m -> berat aktual (berdasar batang yg dibeli).
   */
  function hitungBesi(panjangRaw_m, diameter, wasteMul) {
    const panjangWaste = panjangRaw_m * wasteMul;
    const jumlahBatang = Math.ceil(panjangWaste / D.PANJANG_BATANG_STD);
    const beratPerM = D.BERAT_BESI[diameter] || 0;
    const berat = jumlahBatang * D.PANJANG_BATANG_STD * beratPerM;
    return { diameter, panjangRaw: panjangRaw_m, panjangWaste, jumlahBatang, beratPerM, berat };
  }

  /**
   * Gabungkan beberapa kelompok besi {diameter: panjangRaw_m} jadi besiDetail[]
   * + total panjang/batang/berat.
   */
  function gabungkanBesi(groups, wasteMul) {
    const detail = Object.keys(groups)
      .map(Number)
      .filter((d) => groups[d] > 0)
      .sort((a, b) => a - b)
      .map((d) => hitungBesi(groups[d], d, wasteMul));
    return {
      detail,
      panjangTotal: detail.reduce((a, b) => a + b.panjangWaste, 0),
      batangTotal: detail.reduce((a, b) => a + b.jumlahBatang, 0),
      beratTotal: detail.reduce((a, b) => a + b.berat, 0),
    };
  }

  /** Sengkang: jumlah sengkang sepanjang elemen + total panjang kawat sengkang. */
  function hitungSengkang(panjangElemen_m, jarak_mm, lebar_m, tinggi_m, selimut_m) {
    const jarak_m = jarak_mm / 1000;
    if (jarak_m <= 0) return { jumlah: 0, panjangPerBatang: 0, totalPanjang: 0 };
    const jumlah = Math.floor(panjangElemen_m / jarak_m) + 1;
    const kelilingBersih = 2 * Math.max(lebar_m - 2 * selimut_m, 0) + 2 * Math.max(tinggi_m - 2 * selimut_m, 0);
    const panjangPerBatang = kelilingBersih + D.HOOK_ALLOWANCE_M;
    return { jumlah, panjangPerBatang, totalPanjang: jumlah * panjangPerBatang };
  }

  /** Bendrat dari total berat besi (waste sudah terkandung di berat besi). */
  function hitungBendrat(beratBesiTotal_kg) {
    return beratBesiTotal_kg * D.RASIO_BENDRAT;
  }

  /** Bekisting: luas -> lembar triplek + kayu kaso + paku (sudah +waste). */
  function hitungBekisting(luasRaw_m2, wasteMul) {
    const luasWaste = luasRaw_m2 * wasteMul;
    const a = D.BEKISTING_ASUMSI;
    return {
      luasRaw: luasRaw_m2,
      luasWaste,
      triplekLembar: Math.ceil(luasWaste / a.luasPerTriplek),
      kasoMeter: luasWaste * a.kasoPerM2,
      pakuKg: luasWaste * a.pakuPerM2,
    };
  }

  /** Tulangan 2 arah (mesh) untuk area persegi — dipakai Pondasi Footplat & Plat Lantai konvensional. */
  function hitungJaringTulangan(jarak_mm, panjangArea, lebarArea, selimut_m) {
    const jarak_m = jarak_mm / 1000;
    if (jarak_m <= 0) return { jumlahX: 0, jumlahY: 0, panjangX: 0, panjangY: 0, totalPanjang: 0 };
    const jumlahX = Math.floor(lebarArea / jarak_m) + 1;
    const jumlahY = Math.floor(panjangArea / jarak_m) + 1;
    const panjangX = Math.max(panjangArea - 2 * selimut_m, 0);
    const panjangY = Math.max(lebarArea - 2 * selimut_m, 0);
    return { jumlahX, jumlahY, panjangX, panjangY, totalPanjang: jumlahX * panjangX + jumlahY * panjangY };
  }

  window.ICS.utils.beton = {
    campuranBeton, campuranLantaiKerja, hitungBesi, gabungkanBesi,
    hitungSengkang, hitungBendrat, hitungBekisting, hitungJaringTulangan,
  };
})();
