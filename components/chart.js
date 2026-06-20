/* ============================================================ PIE CHART (SVG murni, tanpa library) ============================================================ */
window.ICS = window.ICS || {};
window.ICS.components = window.ICS.components || {};

(function () {
  const U = window.ICS.utils;

  function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? "0" : "1";
    return `M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 0 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
  }

  /** data: [{label, value, color}] */
  function renderPieChart(container, data) {
    const total = data.reduce((a, b) => a + b.value, 0);
    container.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "pie-wrap";

    if (total <= 0) {
      wrap.innerHTML = `<p class="muted-note">Belum ada biaya untuk ditampilkan.</p>`;
      container.appendChild(wrap);
      return;
    }

    const cx = 90, cy = 90, r = 80;
    let angle = 0;
    let svg = `<svg viewBox="0 0 180 180" width="180" height="180">`;
    data.forEach((d) => {
      if (d.value <= 0) return;
      const sweep = (d.value / total) * 360;
      svg += `<path d="${arcPath(cx, cy, r, angle, angle + sweep)}" fill="${d.color}"></path>`;
      angle += sweep;
    });
    svg += `<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" fill="var(--bg-card)"></circle></svg>`;

    const legend = document.createElement("div");
    legend.className = "pie-legend";
    data.forEach((d) => {
      const pct = total > 0 ? (d.value / total) * 100 : 0;
      const row = document.createElement("div");
      row.className = "pie-legend-row";
      row.innerHTML = `<span class="dot" style="background:${d.color}"></span>
        <span class="lbl">${d.label}</span>
        <span class="pct">${pct.toFixed(1)}%</span>
        <span class="amt">${U.fmtRp(d.value)}</span>`;
      legend.appendChild(row);
    });

    const svgHolder = document.createElement("div");
    svgHolder.innerHTML = svg;
    wrap.appendChild(svgHolder);
    wrap.appendChild(legend);
    container.appendChild(wrap);
  }

  window.ICS.components.chart = { renderPieChart };
})();
