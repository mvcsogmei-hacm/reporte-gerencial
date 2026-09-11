/* =====================================================================
   Reporte resumido · App
   Router por hash, menú lateral, tema, filtro de región y páginas.
   Página 1 = lámina 1 del PPT (listas etiqueta: valor + mapa del Perú).
   ===================================================================== */
(function () {
  'use strict';

  const $ = (s, el) => (el || document).querySelector(s);
  const DATA = window.DATA;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Formato ---------- */
  const nf0 = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const F = {
    n: v => nf0.format(v),
    pct: v => nf1.format(v) + ' %',
    pp: v => (v > 0 ? '+' : '') + nf1.format(v) + ' pp',
    pers: v => v >= 1e6 ? nf1.format(v / 1e6) + ' millones' : v >= 1e4 ? nf0.format(Math.round(v / 1000)) + ' mil' : nf0.format(v)
  };

  const PAGES = {
    general: { title: 'Información general', q: 'Territorio, población, pobreza, actividades socioeconómicas, infraestructura y brechas' },
    gestion: { title: 'Gestión sectorial',   q: 'Obras, presupuesto, vivienda, actores, compromisos y FEN (lámina 2)' },
    reporte: { title: 'Reporte',             q: 'Descarga de los dashboards y del reporte en PDF' },
    configuracion: { title: 'Configuración', q: 'Preferencias del tablero' }
  };

  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
  };

  /* ---------- Estado ---------- */
  const qs = new URLSearchParams(location.search);
  let region = qs.get('region') || store.get('rr-region') || 'Nacional';
  if (!DATA.regiones.includes(region)) region = 'Nacional';

  /* ---------- Chrome: sidebar, tema, región ---------- */
  const app = $('#app');
  if (store.get('rr-sidebar') === 'collapsed') app.classList.add('collapsed');
  $('#collapse-btn').addEventListener('click', () => {
    app.classList.toggle('collapsed');
    store.set('rr-sidebar', app.classList.contains('collapsed') ? 'collapsed' : 'full');
  });
  $('#menu-btn').addEventListener('click', () => app.classList.add('mobile-open'));
  $('#overlay').addEventListener('click', () => app.classList.remove('mobile-open'));

  /* tema claro fijo (sin botón); ?theme=dark queda solo para pruebas */
  const savedTheme = qs.get('theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;

  const sel = $('#region-sel');
  sel.innerHTML = DATA.regiones.map(r => '<option value="' + esc(r) + '">' + esc(r) + '</option>').join('');
  sel.value = region;
  sel.addEventListener('change', () => setRegion(sel.value));
  /* al cambiar de región el contenido entra en la dirección del recorrido por la lista:
     hacia una región más abajo (p. ej. Piura → Tacna) entra de arriba hacia abajo; hacia una más arriba, de abajo hacia arriba */
  function setRegion(r) {
    const i0 = DATA.regiones.indexOf(region), i1 = DATA.regiones.indexOf(r);
    region = r; sel.value = r; store.set('rr-region', r);
    render(i1 === i0 ? '' : (i1 > i0 ? 'down' : 'up'));
  }

  $('#corte-datos').textContent = DATA.corte.datos;

  /* ---------- Tooltip ---------- */
  const tip = $('#tooltip');
  document.addEventListener('mouseover', e => {
    const t = e.target.closest && e.target.closest('[data-tip]');
    if (!t) { tip.hidden = true; return; }
    tip.textContent = t.getAttribute('data-tip'); tip.hidden = false;
  });
  document.addEventListener('mousemove', e => {
    if (tip.hidden) return;
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
    if (y + h > window.innerHeight - 8) y = e.clientY - h - pad;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  });

  /* ---------- Iconos (trazo 2px, 24x24) ---------- */
  const I = (d) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  const ICO = {
    people: I('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.5a5 5 0 0 1 6 5"/>'),
    map: I('<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>'),
    grid: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>'),
    trend: I('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    poverty: I('<path d="M12 21s-7-4.5-7-10a7 7 0 0 1 14 0c0 5.5-7 10-7 10z"/><path d="M9 11h6"/>'),
    formal: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/>'),
    pea: I('<circle cx="12" cy="7" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/><path d="M16 4l2-2M19 7l2-1"/>'),
    gender: I('<circle cx="9" cy="10" r="4"/><path d="M9 14v6M6 18h6"/><circle cx="17" cy="7" r="3"/><path d="M19.2 4.8L22 2M22 2h-3M22 2v3"/>'),
    mining: I('<path d="M3 21l8-8"/><path d="M11 13l4-4"/><path d="M13 5c2-2 6-2 8 0-2 0-4 1-6 3s-3 4-3 6c-2-2-2-6 1-9z"/>'),
    agro: I('<path d="M12 21V11"/><path d="M12 11c0-4 3-7 8-7 0 5-3 8-8 7z"/><path d="M12 14c0-3-2.5-5-6-5 0 4 2.5 6 6 5z"/>'),
    commerce: I('<path d="M3 4h2l2.5 11h11L21 7H7"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>'),
    factory: I('<path d="M3 21V10l5 3V10l5 3V10l5 3v8H3z"/><path d="M16 10V4h3v9"/>'),
    build: I('<path d="M3 21h18"/><path d="M6 21V8l6-4 6 4v13"/><path d="M10 21v-5h4v5"/><path d="M9 11h2M13 11h2"/>'),
    fish: I('<path d="M3 12c3-4 7-6 11-6l4 6-4 6c-4 0-8-2-11-6z"/><path d="M18 12l3-3v6z"/><circle cx="8" cy="11" r="1" fill="currentColor"/>'),
    dots: I('<circle cx="6" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18" cy="12" r="1.5" fill="currentColor"/>'),
    ptap: I('<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/><path d="M9 14h6"/>'),
    ptar: I('<path d="M4 15a4 4 0 0 1 4-4h9"/><path d="M14 8l3 3-3 3"/><path d="M20 9a4 4 0 0 1-4 4H7"/><path d="M10 16l-3-3 3-3"/>'),
    well: I('<path d="M5 21V9h14v12"/><path d="M3 9l9-6 9 6"/><path d="M9 21v-6h6v6"/><path d="M12 9v6"/>'),
    tank: I('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
    pipe: I('<path d="M3 8h8a3 3 0 0 1 3 3v5h7"/><path d="M3 5v6M21 13v6"/>'),
    sewer: I('<path d="M3 16h8a3 3 0 0 0 3-3V8h7"/><path d="M3 13v6M21 5v6"/>'),
    lagoon: I('<path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/><path d="M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>'),
    eps: I('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/>'),
    jass: I('<circle cx="12" cy="6" r="2.5"/><circle cx="5" cy="10" r="2.5"/><circle cx="19" cy="10" r="2.5"/><path d="M8.5 20a3.5 3.5 0 0 1 7 0"/><path d="M1.5 17a3.5 3.5 0 0 1 7 0M15.5 17a3.5 3.5 0 0 1 7 0"/>'),
    water: I('<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"/>'),
    sanit: I('<path d="M5 10h14v3a7 7 0 0 1-14 0z"/><path d="M8 3h5v7"/><path d="M9 20l-1 2M15 20l1 2"/>'),
    house: I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>'),
    title: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 13h6M9 17h6"/>'),
    urban: I('<path d="M3 21h18"/><path d="M5 21V8h6v13"/><path d="M13 21V4h6v17"/>'),
    rural: I('<path d="M3 21h18"/><path d="M4 21V11l6-5 6 5v10"/><path d="M8 21v-5h4v5"/><path d="M18 21v-8l2-2"/>'),
    noaccess: I('<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
    chart: I('<path d="M5 20V11M12 20V5M19 20v-7"/>'),
    gap: I('<path d="M4 7h16M4 12h10M4 17h6"/>'),
    /* página 2 */
    idcard: I('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0"/><path d="M14 10h4M14 13h4"/>'),
    handshake: I('<path d="M3 11l4-4 5 3 3-2 6 5"/><path d="M3 11l7 7a1.5 1.5 0 0 0 2.1 0l.4-.4"/><path d="M12.5 17.6l.9.9a1.5 1.5 0 0 0 2.1-2.1"/><path d="M15.5 16.4l.6.6a1.5 1.5 0 0 0 2.1-2.1L21 12"/>'),
    alert: I('<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4.5"/><path d="M12 17.5h.01"/>'),
    hammer: I('<path d="M13 7l4 4"/><path d="M10 10l7-7 4 4-7 7"/><path d="M12 12l-8.5 8.5a1.5 1.5 0 0 1-2-2L10 10"/>'),
    coins: I('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
    file: I('<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h6M9 17h4"/>'),
    hourglass: I('<path d="M6 3h12M6 21h12"/><path d="M7 3v3a5 5 0 0 0 10 0V3"/><path d="M7 21v-3a5 5 0 0 1 10 0v3"/>'),
    check: I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>'),
    gift: I('<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 13h18"/><path d="M12 8C10.5 4 6.5 4 6.5 6.5S12 8 12 8s5.5 1 5.5-1.5S13.5 4 12 8z"/>'),
    key: I('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9"/><path d="M16 7l3 3"/>'),
    parcel: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h9V3"/><path d="M12 12v9"/>'),
    excavator: I('<rect x="2.5" y="13" width="10" height="5" rx="1"/><path d="M5 13v-3h4l2 3"/><path d="M11 10l6-6 4 4-3 3"/><path d="M18 11l1 3h-3"/><circle cx="5" cy="20" r="1.3"/><circle cx="10" cy="20" r="1.3"/>'),
    gear: I('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
    truck: I('<path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>'),
    tool: I('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'),
    shovel: I('<path d="M3 21l7.5-7.5"/><path d="M13 4l7 7-4 4a3 3 0 0 1-4.2 0L9 12.2a3 3 0 0 1 0-4.2z"/>'),
    pulse: I('<path d="M3 12h4l3-8 4 16 3-8h4"/>'),
    target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>')
  };

  /* ---------- Maquetado ---------- */
  const card = (title, sub, body, cls, ico) =>
    '<section class="card ' + (cls || '') + '"><div class="card-head">' + (ico ? '<span class="card-ico">' + ico + '</span>' : '') +
    '<div class="card-head-text"><h2 class="card-title">' + title + '</h2>' +
    (sub ? '<p class="card-sub">' + sub + '</p>' : '') + '</div></div><div class="card-body">' + body + '</div></section>';

  /* Fila "Propuesta 1": icono cuadrado azul fuera, banda muy clara con la
     etiqueta, barra de progreso al centro y la cifra en negrita.
     pct: llenado de la barra 0-100 (null = sin barra) */
  const row = (ico, label, value, color, pct, cls) =>
    '<div class="hb-r ' + (cls || '') + '" data-tip="' + label + ': ' + value + '">' +
    '<span class="hb-ico">' + ico + '</span>' +
    '<div class="hb-band"><div class="hb-name">' + label + '</div>' +
    (pct === null || pct === undefined ? '' : '<div class="hb-bar"><i style="width:' + Math.max(0, Math.min(100, pct)).toFixed(1) + '%"></i></div>') +
    '<b class="hb-val">' + value + '</b></div></div>';

  /* lista a partir de [icono, etiqueta, valor, pct]; el color va por posición */
  const rows = items => items.map((it, i) => row(it[0], it[1], it[2], i, it[3], it[4]));
  const maxOf = arr => Math.max.apply(null, arr) || 1;

  const list = (rows, cls) => '<div class="hb ' + (cls || '') + '" style="--n:' + rows.length + '">' + rows.join('') + '</div>';

  /* Waffle 10×10 en SVG: cada celda es 1 %; las primeras "u" celdas son zona urbana.
     Al ser SVG se escala al espacio libre de la tarjeta sin deformarse. */
  function waffle(u, aria) {
    const size = 9, step = 10 + 1 / 9;   // 10 celdas de 9 + 9 huecos de 1.11 = 100
    let cells = '';
    for (let i = 0; i < 100; i++) {
      cells += '<rect x="' + ((i % 10) * step).toFixed(2) + '" y="' + (Math.floor(i / 10) * step).toFixed(2) +
        '" width="' + size + '" height="' + size + '" rx="1.4" class="' + (i < u ? 'u' : 'r') + '"/>';
    }
    return '<svg class="wf" viewBox="0 0 100 100" role="img" aria-label="' + aria + '">' + cells + '</svg>';
  }
  /* subsección dentro de una tarjeta: título pequeño + contenido */
  const sub = (title, body, cls, ico, n) => '<div class="sub ' + (cls || '') + '"' + (n ? ' style="--n:' + n + '"' : '') + '>' +
    (title ? '<div class="sub-title">' + (ico ? '<span class="sub-ico">' + ico + '</span>' : '') + title + '</div>' : '') + body + '</div>';
  const fuente = txt => '<p class="card-foot">Fuente: ' + txt + '</p>';

  /* Tarjeta de indicador (propuesta 1 de Indicadores): icono azul, cifra grande y etiqueta */
  const popBig = v => v >= 1e6 ? nf1.format(v / 1e6) + '<small>millones</small>' : v >= 1e4 ? nf0.format(Math.round(v / 1000)) + '<small>mil</small>' : nf0.format(v);
  const indCard = (ico, label, valueHtml, tipValue) => '<div class="ind-card" data-tip="' + label + ': ' + (tipValue || valueHtml) + '">' +
    '<span class="ind-ico">' + ico + '</span><b class="ind-v">' + valueHtml + '</b><span class="ind-k">' + label + '</span></div>';

  /* ---------- Mapa del Perú (SVG desde GeoJSON) ---------- */
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',') + ')'; };

  /* ---------- Mapa del Perú ----------
     Escala del celeste de Brechas (--pr, menor variación) al azul del tablero
     (--hb-ico, mayor), sin título ni leyenda. Al elegir una región el mapa se acerca
     a ella hasta llenar el recuadro y las demás pasan a gris (propuesta 4, sin mini mapa).
     La geometría se proyecta una sola vez. */
  let MAPGEO = null;
  function mapGeo() {
    if (MAPGEO || !window.PERU_GEO) return MAPGEO;
    const minLon = -81.33, maxLat = -0.03, k = Math.cos((-18.36 + -0.03) / 2 * Math.PI / 180), S = 22;
    const W = (-68.65 - minLon) * k * S, H = (maxLat + 18.36) * S;
    const P = c => [(c[0] - minLon) * k * S, (maxLat - c[1]) * S];
    const feats = window.PERU_GEO.features.map(f => {
      const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
      let d = '', x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      polys.forEach(poly => poly.forEach(r => {
        d += 'M' + r.map(c => {
          const q = P(c);
          if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1];
          return q[0].toFixed(2) + ',' + q[1].toFixed(2);   /* 2 decimales: nítido con zoom grande */
        }).join('L') + 'Z';
      }));
      return { key: norm(f.properties.NOMBDEP), name: f.properties.NOMBDEP, d, box: [x0, y0, x1, y1] };
    });
    return (MAPGEO = { W, H, feats });
  }

  function mapaPeru(selected) {
    const G = mapGeo();
    if (!G) return '<p class="empty">No se encontró el mapa (map/peru_departamental.js).</p>';

    const serie = {};
    DATA.regiones.filter(r => r !== 'Nacional').forEach(r => { serie[norm(r)] = { nombre: r, valor: DATA.get(r).pobrezaVar }; });
    const lista = Object.values(serie), vals = lista.map(x => x.valor);
    const mn = Math.min(...vals), mx = Math.max(...vals);
    const t = v => (Math.max(mn, Math.min(mx, v)) - mn) / ((mx - mn) || 1);
    const color = v => '--c:color-mix(in oklab, var(--hb-ico) ' + (t(v) * 100).toFixed(1) + '%, var(--pr));' +
      '--g:color-mix(in oklab, var(--map-g2) ' + (t(v) * 100).toFixed(1) + '%, var(--map-g1))';
    const ranking = lista.slice().sort((p, q) => q.valor - p.valor);
    const selN = norm(selected), cur = serie[selN];

    const paths = G.feats.map(f => {
      const d = serie[f.key];
      return '<path class="mp" data-key="' + f.key + '" d="' + f.d + '" style="' + (d ? color(d.valor) : '--c:var(--map-mid);--g:var(--map-mid)') + '"' +
        (d ? ' data-region="' + esc(d.nombre) + '" data-tip="' + esc(d.nombre + ': ' + F.pp(d.valor) + ' · ' + (ranking.indexOf(d) + 1) + '.º de ' + ranking.length) + '"' : '') + '/>';
    }).join('');



    return '<div class="map-wrap"><div class="map-cell"><svg class="map" viewBox="0 0 ' + G.W.toFixed(1) + ' ' + G.H.toFixed(1) + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Mapa del Perú: variación de la pobreza por región">' +
      '<g class="map-zg">' + paths + '</g></svg></div></div>';
  }

  /* Aplica la región elegida después de dibujar: las demás pasan a gris y el
     área visible (viewBox) se anima hasta encuadrar la región, que llena el
     recuadro. El viewBox final se escribe primero (el resultado siempre es
     correcto) y el recorrido se anima con <animate> de SVG, sin depender de
     requestAnimationFrame. Animar el viewBox mantiene el dibujo nítido. */
  function animarMapa() {
    const svg = $('#content .map'), G = mapGeo();
    if (!svg || !G) return;
    const key = region === 'Nacional' ? '' : norm(region);
    const p = key ? svg.querySelector('.mp[data-key="' + key + '"]') : null;
    if (p) p.parentNode.appendChild(p);          /* su borde queda encima */
    let to = [0, 0, G.W, G.H];
    const f = p && G.feats.find(x => x.key === key);
    if (f) {
      const bw = f.box[2] - f.box[0], bh = f.box[3] - f.box[1];
      const w = Math.max(bw / .9, G.W / 30), h = Math.max(bh / .9, G.H / 30);   /* 90 % del recuadro; tope para regiones muy pequeñas */
      to = [f.box[0] + bw / 2 - w / 2, f.box[1] + bh / 2 - h / 2, w, h];
    }
    const from = svg.getAttribute('viewBox'), toStr = to.map(v => v.toFixed(2)).join(' ');
    void svg.getBoundingClientRect();            /* fija el estado inicial para que el paso a gris se anime */
    svg.classList.toggle('has-sel', !!p);
    svg.querySelectorAll('.mp').forEach(el => el.classList.toggle('sel', el === p));
    svg.querySelectorAll('animate').forEach(el => el.remove());
    svg.setAttribute('viewBox', toStr);
    if (from === toStr) return;
    const an = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
    [['attributeName', 'viewBox'], ['from', from], ['to', toStr], ['dur', '0.85s'], ['begin', 'indefinite'], ['fill', 'freeze'],
     ['calcMode', 'spline'], ['keyTimes', '0;1'], ['keySplines', '0.2 0.7 0.2 1']].forEach(kv => an.setAttribute(kv[0], kv[1]));
    svg.appendChild(an);
    if (an.beginElement) an.beginElement();
  }

  /* =====================================================================
     PÁGINA 1 · Información general (lámina 1 del PPT)
     ===================================================================== */
  function renderGeneral(d) {
    const nombreAmbito = region === 'Nacional' ? 'Perú' : d.nombre;

    /* --- Columna 1: Información general (tres subsecciones) --- */
    const col1 = card('Información general', 'Ámbito: ' + esc(nombreAmbito),
      sub('Indicadores',
        '<div class="ind3">' + indCard(ICO.people, 'Población', popBig(d.poblacion), F.pers(d.poblacion)) +
        indCard(ICO.map, 'Provincias', F.n(d.provincias)) + indCard(ICO.grid, 'Distritos', F.n(d.distritos)) + '</div>') +
      sub('', mapaPeru(region), 'sub-map') +
      sub('Índices',
        list(rows([
          [ICO.trend, 'Crecimiento poblacional', F.pct(d.crecimiento), d.crecimiento * 20],
          [ICO.poverty, 'Índice de pobreza', F.pct(d.pobreza), d.pobreza],
          [ICO.formal, 'Índice de formalidad laboral', F.pct(d.formalidad), d.formalidad],
          [ICO.pea, 'PEA ocupada adecuadamente empleada', F.pct(d.pea), d.pea],
          [ICO.gender, 'Índice Regional de Brechas de Género', nf1.format(d.brechaGenero), d.brechaGenero]
        ]), 'idx-list')), 'c-4');

    /* --- Columna 2: Actividades socioeconómicas + Infraestructura sectorial --- */
    const a = d.actividades;
    const aMax = maxOf(Object.values(a));
    const act = card('Actividades socioeconómicas (%)', 'Participación en el valor agregado bruto',
      list(rows([
        [ICO.mining, 'Minería e Hidrocarburos', F.pct(a['Minería e hidrocarburos']), a['Minería e hidrocarburos'] / aMax * 100],
        [ICO.agro, 'Agropecuario y agroexportación', F.pct(a['Agropecuario y agroexportación']), a['Agropecuario y agroexportación'] / aMax * 100],
        [ICO.commerce, 'Comercio y Servicios', F.pct(a['Comercio y servicios']), a['Comercio y servicios'] / aMax * 100],
        [ICO.factory, 'Manufactura', F.pct(a['Manufactura']), a['Manufactura'] / aMax * 100],
        [ICO.build, 'Construcción', F.pct(a['Construcción']), a['Construcción'] / aMax * 100],
        [ICO.fish, 'Pesca y acuicultura', F.pct(a['Pesca y acuicultura']), a['Pesca y acuicultura'] / aMax * 100],
        [ICO.dots, 'Otros', F.pct(a['Otros']), a['Otros'] / aMax * 100]
      ]), 'act-list'), 'c-4');

    /* Infraestructura sectorial: columnas por grupo. Cada columna gris llega hasta
       el valor máximo de su grupo y se pinta según la proporción real de su cifra
       (como "Año de paralización" del tablero de referencia). Solo se comparan
       activos de la misma naturaleza y unidad. */
    const inf = d.infra;
    const IGRP = [
      ['Plantas y lagunas', 'un.', [['PTAP', 'Plantas de agua potable', inf.PTAP], ['PTAR', 'Plantas de aguas residuales', inf.PTAR], ['Lagunas', 'Lagunas de oxidación', inf.LAGUNAS]]],
      ['Captación y almacenamiento', 'un.', [['Pozos', 'Pozos de captación', inf.POZOS], ['Reservorios', 'Reservorios de agua', inf.RESERVORIOS]]],
      ['Redes', 'km', [['Agua', 'Red de agua', inf.RED_AGUA], ['Alcantarillado', 'Red de alcantarillado', inf.RED_ALC]]],
      ['Prestadores', 'un.', [['EPS', 'Entidades prestadoras', inf.EPS], ['JASS', 'Juntas administradoras', inf.JASS]]]
    ];
    const colGroup = g => {
      const mx = maxOf(g[2].map(x => x[2]));
      return '<div class="icol-card"><div class="icol-t">' + g[0] + ' <small>' + g[1] + '</small></div><div class="icol-plot">' +
        g[2].map(x => {
          const p = x[2] / mx * 100;
          return '<div class="icol" data-tip="' + x[1] + ': ' + F.n(x[2]) + ' ' + g[1] + ' · ' + Math.round(p) + ' % del mayor del grupo">' +
            '<b class="icol-v">' + F.n(x[2]) + '</b>' +
            '<span class="icol-track">' + (x[2] > 0 ? '<i style="height:' + p.toFixed(1) + '%"></i>' : '') + '</span>' +
            '<span class="icol-n">' + x[0] + '</span></div>';
        }).join('') + '</div></div>';
    };
    const infra = card('Infraestructura sectorial', 'Activos de agua y saneamiento',
      sub('', '<div class="icols">' + IGRP.map(colGroup).join('') + '</div>', 'sub-infra'), 'c-4');

    /* --- Columna 3: Brechas (grilla 2x2 con waffle 10×10: cada cuadrado = 1 %) --- */
    const b = d.brechas;
    /* celdas urbanas; el texto usa el mismo redondeo para que coincida con el dibujo */
    const celdasUrb = x => x.urb <= 0 ? 0 : x.rur <= 0 ? 100 : Math.min(99, Math.max(1, Math.round(x.urb / x.sin * 100)));
    const wcard = (ico, titulo, x) => {
      const u = celdasUrb(x), r = 100 - u;
      return '<div class="wcard" data-tip="' + titulo + ': ' + F.pers(x.sin) + ' sin acceso · urbana ' + F.pers(x.urb) + ' (' + u + ' %) · rural ' + F.pers(x.rur) + ' (' + r + ' %)">' +
        '<div class="wcard-head"><span class="wcard-ico">' + ico + '</span><span class="wcard-name">' + titulo + '</span></div>' +
        '<div class="wcard-total">' + F.pers(x.sin) + '</div><div class="wcard-sub">personas sin acceso</div>' +
        '<div class="wf-wrap">' + waffle(u, titulo + ': ' + u + ' % urbana, ' + r + ' % rural') + '</div>' +
        '<div class="wcard-leg">' +
        '<div class="wleg"><span class="wleg-k"><i class="u"></i>Urb. <b>' + u + ' %</b></span><span class="wleg-n">' + F.pers(x.urb) + '</span></div>' +
        '<div class="wleg r"><span class="wleg-k"><i class="r"></i>Rur. <b>' + r + ' %</b></span><span class="wleg-n">' + F.pers(x.rur) + '</span></div>' +
        '</div></div>';
    };
    const fTit = b.formalizacion.sinTitulo;
    const brechas = card('Brechas', 'Población sin acceso a servicios',
      '<div class="wlegend"><span><i style="background:var(--pu)"></i>Zona urbana</span><span><i style="background:var(--pr)"></i>Zona rural</span>' +
      '<span class="wlegend-note">1 cuadrado = 1 %</span></div>' +
      '<div class="wgrid">' +
      wcard(ICO.water, 'Agua', b.agua) +
      wcard(ICO.sanit, 'Saneamiento', b.saneamiento) +
      wcard(ICO.house, 'Vivienda', b.vivienda) +
      '<div class="wcard kpi" data-tip="Formalización: ' + F.pers(fTit) + ' viviendas sin título de propiedad">' +
      '<div class="wcard-head"><span class="wcard-ico">' + ICO.title + '</span><span class="wcard-name">Formalización</span></div>' +
      '<div class="wcard-total">' + F.pers(fTit) + '</div><div class="wcard-sub">viviendas sin título de propiedad</div>' +
      '</div>' +
      '</div>', 'c-4');

    return '<div class="grid page1">' + col1 + '<div class="col c-4">' + act + infra + '</div>' + brechas + '</div>';
  }

  /* =====================================================================
     PÁGINA 2 · Gestión sectorial (rediseño de la lámina 2)
     Cuatro columnas: autoridades y compromisos · obras en ejecución
     (mariposa por sector en la mitad superior) · obras paralizadas (mariposa
     en la mitad superior) y obras reactivadas (mariposa) debajo · inversiones en vivienda y PRESET.
     Mismo sistema visual de la página 1.
     ===================================================================== */
  const mill = v => 'S/ ' + nf1.format(v) + ' mill.';

  /* Fila con total y desglose en dos partes: icono fuera, banda clara,
     barra dividida y debajo cada parte con su cifra y su %. */
  const splitRow = (ico, label, total, a, b, fmt, la, lb) => {
    const t = (a + b) || 1, pa = Math.round(a / t * 100), pb = 100 - pa;
    return '<div class="sr" data-tip="' + label + ': ' + fmt(total) + ' · ' + la + ' ' + fmt(a) + ' (' + pa + ' %) · ' + lb + ' ' + fmt(b) + ' (' + pb + ' %)">' +
      '<span class="hb-ico">' + ico + '</span><div class="sr-b"><div class="sr-top"><span>' + label + '</span><b>' + fmt(total) + '</b></div>' +
      '<div class="sr-bar"><i class="a" style="flex:' + Math.max(0, a) + ' 1 0"></i><i class="b" style="flex:' + Math.max(0, b) + ' 1 0"></i></div>' +
      '<div class="sr-leg"><span><i class="a"></i>' + la + ' <b>' + fmt(a) + '</b> ' + pa + ' %</span><span>' + lb + ' <b>' + fmt(b) + '</b> ' + pb + ' %<i class="b"></i></span></div></div></div>';
  };
  /* Medidor: etiqueta, % y barra; opcionalmente un monto debajo */
  const meter = (label, v, extra) => '<div class="mt" data-tip="' + label + ': ' + F.pct(v) + (extra ? ' · ' + extra : '') + '"><div class="mt-top"><span>' + label + '</span><b>' + F.pct(v) + '</b></div>' +
    '<span class="mt-bar"><i style="width:' + Math.max(0, Math.min(100, v)).toFixed(1) + '%"></i></span>' + (extra ? '<small class="mt-s">' + extra + '</small>' : '') + '</div>';
  const stat = (ico, label, value) => '<div class="st" data-tip="' + label + ': ' + value + '"><span class="hb-ico sm">' + ico + '</span><div class="st-t"><small>' + label + '</small><b>' + value + '</b></div></div>';

  function renderGestion(d) {
    const nac = region === 'Nacional';
    const REGS = DATA.regiones.filter(r => r !== 'Nacional');
    const A = d.actores, O = d.obras;
    /* datos reales de data/Datos para PPT.xlsx (vía data/data.js); si faltan, se usan los de ejemplo */
    const DREAL = window.DATA_REAL || {};

    /* --- Columna 1: autoridades · compromisos y riesgos --- */
    const g = A.gobernador;
    const gob = sub('Gobernador regional', g
      ? '<div class="gov"><span class="gov-ico">' + ICO.idcard + '</span><div class="gov-t"><b>' + esc(g.nombre) + '</b>' +
        '<span><em>Agrupación</em>' + esc(g.agrupacion) + '</span><span><em>Profesión</em>' + esc(g.profesion) + '</span></div></div>'
      : '<p class="note2">En el ámbito nacional hay 25 gobernadores regionales. Elige una región para ver sus datos.</p>');

    const al = A.alcaldes;
    const alcaldes = sub('Alcaldes provinciales', al.length
      ? '<table class="tbl mini"><colgroup><col style="width:9%"><col style="width:22%"><col style="width:31%"><col style="width:26%"><col style="width:12%"></colgroup>' +
        '<thead><tr><th class="num">N°</th><th>Provincia</th><th>Nombres</th><th>Partido</th><th class="num">Dist.</th></tr></thead><tbody>' +
        al.map(x => '<tr data-tip="' + esc(x.provincia + ' · ' + x.nombre + ' · ' + x.partido + ' · ' + x.distritos + ' distritos') + '"><td class="num">' + x.n + '</td><td>' + esc(x.provincia) + '</td>' +
          '<td>' + esc(x.nombre) + '</td><td>' + esc(x.partido) + '</td><td class="num">' + F.n(x.distritos) + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td colspan="4">Total</td><td class="num">' + F.n(al.reduce((s, x) => s + x.distritos, 0)) + '</td></tr></tfoot></table>'
      : '<p class="note2">' + F.n(d.provincias) + ' alcaldes provinciales en el país. Elige una región para ver la lista.</p>');

    const agrupaciones = (titulo, list) => {
      const tot = list.reduce((s, x) => s + x.cantidad, 0);
      return '<div class="agr-g"><small>' + titulo + ' <b>' + F.n(tot) + '</b></small><div class="chips">' +
        list.map(x => '<span class="agr" data-tip="' + esc(titulo + ' · ' + x.agrupacion + ': ' + x.cantidad) + '">' + esc(x.agrupacion) + ' <b>' + F.n(x.cantidad) + '</b></span>').join('') + '</div></div>';
    };
    const congresistas = sub('Congresistas', agrupaciones('Diputados', A.diputados) + agrupaciones('Senadores', A.senadores), 'sub-grow');
    /* Sin filtro de región (Nacional): propuesta 1 · indicador de gobernadores regionales y las dos cámaras,
       una debajo de la otra, repartiendo el alto de toda la columna */
    const camaraNac = (t, list) => {
      const mx = Math.max.apply(null, list.map(x => x.cantidad)) || 1;
      return '<div class="aun-cam"><div class="aun-cam-h"><span>' + t + '</span><b>' + F.n(list.reduce((s, x) => s + x.cantidad, 0)) + '</b></div><div class="aun-prs">' +
        list.map(x => '<div class="aun-pr" data-tip="' + esc(t + ' · ' + x.agrupacion + ': ' + x.cantidad) + '"><span class="aun-pn">' + esc(x.agrupacion) + '</span>' +
          '<span class="aun-pb"><i style="width:' + (x.cantidad / mx * 100).toFixed(1) + '%"></i></span><b>' + F.n(x.cantidad) + '</b></div>').join('') + '</div></div>';
    };
    const autoridadesNac = '<div class="aun-hero"><span class="aun-av">' + ICO.idcard + '</span><div class="aun-hero-t"><small>Gobernadores regionales</small>' +
      '<b>' + F.n(REGS.length) + ' en el país</b><span>Elige una región para ver su gobernador</span></div></div>' +
      camaraNac('Diputados', A.diputados) + camaraNac('Senadores', A.senadores);
    /* Con filtro de región: arriba la propuesta 2 (perfil del gobernador con foto sobre la banda del color de su partido
       y 3 cifras); abajo la propuesta 3 (tabla de alcaldes con foto y tabla de congresistas por agrupación).
       La foto aún no existe: .aur-ph es el espacio reservado que se reemplazará por <img>. */
    const PARTIDOS = ['Fuerza Popular', 'Alianza para el Progreso', 'Renovación Popular', 'Perú Libre', 'Somos Perú', 'Acción Popular', 'Avanza País', 'Juntos por el Perú'];
    const PCOL = ['#1F4E8C', '#2F86C6', '#8BC7EF', '#1E7A8F', '#62B39F', '#8C6BB1', '#B9784C', '#9AA4B2'];
    const pcol = p => PCOL[PARTIDOS.indexOf(p)] || '#9AA4B2';
    const pdot = p => '<i class="aur-dot" style="background:' + pcol(p) + '"></i>';
    const foto = cls => '<div class="aur-ph ' + cls + '" role="img" aria-label="Espacio reservado para la foto">' + I('<circle cx="12" cy="8.5" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>') + '</div>';
    const autoridadesReg = () => {
      const tipAl = x => esc(x.provincia + ' · ' + x.nombre + ' · ' + x.partido + ' · ' + x.distritos + ' distritos');
      const nDip = A.diputados.reduce((s, x) => s + x.cantidad, 0), nSen = A.senadores.reduce((s, x) => s + x.cantidad, 0);
      const perfil = '<div class="aur-prof" style="--pc:' + pcol(g.agrupacion) + '"><div class="aur-ban"></div>' + foto('round') +
        '<b class="aur-pn">' + esc(g.nombre) + '</b><span class="aur-pc">Gobernador(a) regional de ' + esc(d.nombre) + '</span>' +
        '<div class="aur-chips c"><span class="aur-chip">' + pdot(g.agrupacion) + esc(g.agrupacion) + '</span><span class="aur-chip">' + esc(g.profesion) + '</span></div></div>';
      const stats = '<div class="aur-stats"><div><b>' + F.n(al.length) + '</b><small>Alcaldes provinciales</small></div>' +
        '<div><b>' + F.n(al.reduce((s, x) => s + x.distritos, 0)) + '</b><small>Distritos</small></div><div><b>' + F.n(nDip + nSen) + '</b><small>Congresistas</small></div></div>';
      /* parte de abajo = propuesta 3: tabla de alcaldes con columna de foto y tabla de congresistas por agrupación */
      const tabla = '<table class="tbl mini aur-tb"><colgroup><col style="width:9%"><col style="width:19%"><col style="width:38%"><col style="width:34%"></colgroup>' +
        '<thead><tr><th>Foto</th><th>Provincia</th><th>Alcalde(sa)</th><th>Partido</th></tr></thead><tbody>' +
        al.map(x => '<tr data-tip="' + tipAl(x) + '"><td>' + foto('xs') + '</td><td>' + esc(x.provincia) + '</td><td>' + esc(x.nombre) + '</td><td>' + pdot(x.partido) + esc(x.partido) + '</td></tr>').join('') + '</tbody></table>';
      const bancada = {};
      A.diputados.forEach(x => { bancada[x.agrupacion] = [x.cantidad, 0]; });
      A.senadores.forEach(x => { bancada[x.agrupacion] = bancada[x.agrupacion] || [0, 0]; bancada[x.agrupacion][1] = x.cantidad; });
      const cong = '<table class="tbl mini"><colgroup><col style="width:56%"><col style="width:22%"><col style="width:22%"></colgroup>' +
        '<thead><tr><th>Agrupación</th><th class="num">Diputados</th><th class="num">Senadores</th></tr></thead><tbody>' +
        Object.keys(bancada).map(p => '<tr data-tip="' + esc(p + ': ' + bancada[p][0] + ' diputados y ' + bancada[p][1] + ' senadores') + '"><td>' + pdot(p) + esc(p) + '</td>' +
          '<td class="num">' + (bancada[p][0] || '–') + '</td><td class="num">' + (bancada[p][1] || '–') + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td>Total</td><td class="num">' + F.n(nDip) + '</td><td class="num">' + F.n(nSen) + '</td></tr></tfoot></table>';
      /* la tabla de alcaldes ocupa el alto disponible y se desplaza por dentro si no caben: así esta columna
         no agranda la página ni reduce la escala de todo el tablero */
      return perfil + stats + sub('Alcaldes provinciales · ' + F.n(al.length), '<div class="aur-scroll">' + tabla + '</div>', 'aur-grow') + sub('Congresistas', cong);
    };
    const autoridades = nac
      ? card('Autoridades', 'Ámbito: Perú', autoridadesNac, 'aun')
      : card('Autoridades', 'Ámbito: ' + esc(d.nombre), autoridadesReg(), 'aur');

    const C = d.compromisos, rg = C.riesgo;
    /* Propuesta 5 · Dos bloques: compromisos CER y REMURPE a la izquierda; riesgos o conflictos a la derecha con número grande.
       El estado va con icono y texto: ámbar con alerta si hay conflictos, verde con visto si no. */
    const estR = rg.activo ? 'warn' : 'ok';
    const tipR = 'Riesgos o conflictos activos: ' + (rg.activo ? 'Sí, ' + rg.cantidad + ' · ' + rg.tipo : 'No');
    const icoVisto = I('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>');
    const compromisos = card('Compromisos y riesgos', 'Acuerdos y conflictos activos',
      '<div class="cr-duo"><div class="cr-blk"><small>Compromisos</small>' +
      '<div class="cr-kv" data-tip="Compromisos CER: ' + F.n(C.cer) + '"><span>' + ICO.handshake + 'CER</span><b>' + F.n(C.cer) + '</b></div>' +
      '<div class="cr-kv" data-tip="Compromisos REMURPE: ' + F.n(C.remurpe) + '"><span>' + ICO.people + 'REMURPE</span><b>' + F.n(C.remurpe) + '</b></div></div>' +
      '<div class="cr-blk r ' + estR + '" data-tip="' + esc(tipR) + '"><small>Riesgos o conflictos</small><b class="cr-big">' + F.n(rg.activo ? rg.cantidad : 0) + '</b>' +
      '<span class="cr-pill">' + (rg.activo ? ICO.alert : icoVisto) + (rg.activo ? 'Activos' : 'Sin conflictos') + '</span>' + (rg.activo ? '<em>' + esc(rg.tipo) + '</em>' : '') + '</div></div>',
      'card-fit crd');

    /* --- Obras en ejecución, paralizadas y reactivadas: mariposa compacta (variante 1, etiqueta arriba).
           Saneamiento a la izquierda y vivienda a la derecha; cada fila lleva su nombre arriba,
           la cifra y el % de reparto en los extremos, y las barras se comparan con el mayor
           de los dos sectores. Ocupa media columna. --- */
    const corto = x => x >= 1e6 ? nf1.format(x / 1e6) + ' M' : x >= 1e4 ? nf0.format(Math.round(x / 1000)) + ' mil' : nf0.format(x);
    const mariposa = (titulo, S, notaBrecha) => {
      const s = S.saneamiento, v = S.vivienda;
      /* cierre de brecha = conexiones nuevas (datos reales); con datos de ejemplo se muestra el % de cierre */
      const brecha = s.conexiones !== undefined
        ? ['Cierre de brecha (conexiones)', s.conexiones, v.conexiones, F.n, null, notaBrecha]
        : ['Cierre de brecha', s.cierreBrecha, v.cierreBrecha, F.pct];
      const filas = [
        ['Obras', s.total, v.total, F.n],
        ['Directas', s.directa, v.directa, F.n, S.directaTotal],
        ['Por transferencia', s.transferencia, v.transferencia, F.n, S.transferenciaTotal],
        ['Inversión S/ mill.', s.monto, v.monto, x => nf1.format(x)],
        ['Población', s.poblacion, v.poblacion, corto],
        brecha
      ];
      /* etiquetas solo con la cantidad (sin %); el reparto en % queda en el tooltip.
         Si el Excel no desglosa la fila por sector (directa/transferencia en paralizadas y reactivadas) se muestra el total. */
      const fila = f => {
        const label = f[0], sv = f[1], vv = f[2], fmt = f[3], total = f[4], nota = f[5];
        if (sv == null || vv == null) {
          const conTotal = total != null;
          return '<div class="bf1-r" data-tip="' + esc(label + (conTotal ? ': ' + fmt(total) + ' en total; el Excel no lo desglosa por sector' : ': sin dato en el Excel')) + '">' +
            '<div class="bf1-n">' + label + (conTotal ? ' · ' + fmt(total) + ' en total' : '') + '</div><div class="bf1-b">' +
            '<span class="bf1-v l"><b>—</b></span><span class="bf1-t l"></span><span class="bf1-t r"></span><span class="bf1-v r"><b>—</b></span></div></div>';
        }
        const m = Math.max(sv, vv) || 1, ps = Math.round(sv / ((sv + vv) || 1) * 100), pv = 100 - ps;
        return '<div class="bf1-r" data-tip="' + esc(label + ': saneamiento ' + fmt(sv) + ' (' + ps + ' %) · vivienda ' + fmt(vv) + ' (' + pv + ' %)' + (nota ? ' · ' + nota : '')) + '">' +
          '<div class="bf1-n">' + label + '</div><div class="bf1-b">' +
          '<span class="bf1-v l"><b>' + fmt(sv) + '</b></span>' +
          '<span class="bf1-t l">' + (sv > 0 ? '<i style="width:' + (sv / m * 100).toFixed(1) + '%"></i>' : '') + '</span>' +
          '<span class="bf1-t r">' + (vv > 0 ? '<i style="width:' + (vv / m * 100).toFixed(1) + '%"></i>' : '') + '</span>' +
          '<span class="bf1-v r"><b>' + fmt(vv) + '</b></span></div></div>';
      };
      return card(titulo, 'Por sector: saneamiento y vivienda',
        '<div class="bf1"><div class="bf1-hd"><span class="bf1-tag san">' + ICO.sanit + 'Saneamiento</span><span class="bf1-tag viv">' + ICO.house + 'Vivienda</span></div>' +
        filas.map(fila).join('') + '</div>', 'card-half');
    };

    /* --- PRESET --- */
    const pr = (DREAL.preset && DREAL.preset[region]) || d.preset;
    /* Propuesta 4 · Etapas: total → en evaluación → aptos, con su parte del total */
    const pe = Math.round(pr.evaluacion / (pr.total || 1) * 100), pap = Math.round(pr.aptos / (pr.total || 1) * 100);
    const step = (cls, ico, label, v, x) => '<div class="stp ' + cls + '" data-tip="' + label + ': ' + F.n(v) + ' (' + x + ')"><span class="stp-c">' + ico + '</span><b>' + F.n(v) + '</b><span class="stp-n">' + label + '</span><small>' + x + '</small></div>';
    const preset = card('Expedientes técnicos en PRESET', 'Total, en evaluación y aptos',
      '<div class="stps">' + step('s0', ICO.file, 'Total', pr.total, '100 %') + '<span class="stp-l"></span>' + step('s1', ICO.hourglass, 'En evaluación', pr.evaluacion, pe + ' %') +
      '<span class="stp-l"></span>' + step('s2', ICO.check, 'Aptos', pr.aptos, pap + ' %') + '</div>' +
      '<div class="st2">' + stat(ICO.coins, 'Monto de inversión', mill(pr.monto)) + stat(ICO.people, 'Población beneficiaria', F.pers(pr.poblacion)) + '</div>', 'card-fit');

    /* --- Inversiones en vivienda --- */
    const V = (DREAL.vivienda && DREAL.vivienda[region]) || d.vivienda;
    const vrow = (ico, label, o) => '<div class="vr" data-tip="' + label + ': ' + F.n(o.cantidad) + ' · ' + mill(o.monto) + ' · ' + F.pers(o.poblacion) + ' personas">' +
      '<span class="hb-ico">' + ico + '</span><div class="vr-b"><div class="vr-top"><span>' + label + '</span><b>' + F.n(o.cantidad) + '</b></div>' +
      '<div class="vr-s"><span>Monto <b>' + mill(o.monto) + '</b></span><span>Población <b>' + F.pers(o.poblacion) + '</b></span></div></div></div>';
    const vSinDato = (ico, label) => '<div class="vr" data-tip="' + label + ': sin dato en el Excel"><span class="hb-ico">' + ico + '</span><div class="vr-b">' +
      '<div class="vr-top"><span>' + label + '</span><b>—</b></div><div class="vr-s"><span>Sin dato en el Excel</span></div></div></div>';
    const vivienda = card('Inversiones en vivienda', 'Bonos, vivienda rural y titulación',
      '<div class="vr-list">' + vrow(ICO.gift, 'Bonos desembolsados', V.bonos) + vrow(ICO.house, 'Viviendas rurales construidas', V.viviendaRural) + (V.titulos ? vrow(ICO.key, 'Títulos registrados', V.titulos) : vSinDato(ICO.key, 'Títulos registrados')) +
      '<div class="vr" data-tip="Predios registrados: ' + F.n(V.predios.cantidad) + '"><span class="hb-ico">' + ICO.parcel + '</span><div class="vr-b"><div class="vr-top"><span>Predios registrados</span><b>' + F.n(V.predios.cantidad) + '</b></div></div></div>' +
      '</div>', 'card-fit viv-fit');

    /* --- FEN 2026-2027 resumido: sus 3 indicadores y un botón que abre el modal con el detalle (fenDetalle). --- */
    const Fn = d.fen;
    const fenMini = card('FEN 2026-2027', 'Intervenciones, material removido y beneficiarios',
      '<div class="fen-st">' +
      '<div class="fs" data-tip="Intervenciones: ' + F.n(Fn.intervenciones) + '"><i class="fs-img fi-int" aria-hidden="true"></i><b>' + F.n(Fn.intervenciones) + '</b><small>Intervenciones</small></div>' +
      '<div class="fs" data-tip="Material removido: ' + nf1.format(Fn.material) + ' mill. m³"><i class="fs-img fi-mat" aria-hidden="true"></i><b>' + nf1.format(Fn.material) + ' mill. m³</b><small>Material removido</small></div>' +
      '<div class="fs" data-tip="Beneficiarios: ' + F.pers(Fn.beneficiarios) + ' personas"><i class="fs-img fi-pob" aria-hidden="true"></i><b>' + F.pers(Fn.beneficiarios) + '</b><small>Beneficiarios</small></div>' +
      '</div>' +
      '<button type="button" class="fen-btn" data-modal="fen" aria-haspopup="dialog">Ver información complementaria' + I('<path d="M9 6l6 6-6 6"/>') + '</button>', 'fen-mini');

    /* --- Presupuesto de inversiones 2026 y FEN 2026-2027 ---
       Presupuesto no aparece en el rediseño de la lámina 2. De FEN se dibuja el resumen (fenMini)
       y el detalle va en el modal de información complementaria (fenDetalle). */
    const puesto = lvl => REGS.map(r => ({ r, v: DATA.get(r).presupuesto[lvl].devengado })).sort((a, b) => b.v - a.v).findIndex(x => x.r === d.nombre) + 1;
    const bloquePres = (titulo, p, lvl) => sub('',
      '<div class="bud-h"><span class="bud-t">' + titulo + '</span>' +
      (nac ? '' : '<span class="rank" data-tip="Puesto por devengado 2026 entre las 25 regiones">Ranking <b>' + puesto(lvl) + '.º</b> de 25</span>') + '</div>' +
      '<div class="bud-pim"><div><small>Inversión total del proyecto</small><b>S/ ' + nf1.format(p.pim) + '<small> mill.</small></b></div>' + meter('Avance financiero', p.avance) + '</div>' +
      '<div class="bud-g"><small>Ejecución del presupuesto 2026</small><div class="bud-2">' + meter('Devengado', p.devengado) + meter('Certificado', p.certificado) + '</div></div>' +
      '<div class="bud-g"><small>Por fuente de financiamiento</small><div class="bud-2">' + meter('RO', p.ro, mill(p.roMonto)) + meter('ROOC', p.rooc, mill(p.roocMonto)) + '</div></div>', 'sub-bud');
    // eslint-disable-next-line no-unused-vars
    const presupuestoCard = () => card('Presupuesto de inversiones 2026', 'Gobierno nacional y regional',
      bloquePres('Nacional', d.presupuesto.nacional, 'nacional') + bloquePres('Regional', d.presupuesto.regional, 'regional'));
    /* Detalle de FEN para el modal (propuesta 6 · tabla visual): resultados, equipos en chips
       y puntos críticos por UBO como barras alineadas (cada columna con su propia escala) */
    const fenDetalle = () => {
      const Fe = d.fen, eq = Fe.maquinarias + Fe.especializadas + Fe.vehiculos + Fe.equipos;
      const U = Fe.ubos, sum = k => U.reduce((s, u) => s + u[k], 0), top = k => Math.max.apply(null, U.map(u => u[k])) || 1;
      const mx = { puntos: top('puntos'), volumen: top('volumen'), km: top('km') };
      const tipU = u => esc(u.ubo + ' · ' + u.puntos + ' puntos críticos · ' + F.n(u.volumen) + ' m³ · ' + nf1.format(u.km) + ' km');
      const res = (ico, v, l) => '<div class="mf-k" data-tip="' + l + ': ' + v + '"><span class="hb-ico">' + ico + '</span><div><b>' + v + '</b><small>' + l + '</small></div></div>';
      const chip = (ico, l, v) => '<span class="chip2" data-tip="' + l + ': ' + F.n(v) + ' (' + Math.round(v / (eq || 1) * 100) + ' % del total)">' + ico + l + ' <b>' + F.n(v) + '</b></span>';
      const bar = (u, k, fmt) => '<div class="mf-sb" data-tip="' + tipU(u) + '"><span><i style="width:' + (u[k] / mx[k] * 100).toFixed(1) + '%"></i></span><b>' + fmt(u[k]) + '</b></div>';
      return {
        title: 'FEN 2026-2027 · información complementaria',
        sub: '',
        body: '<div class="mf-kpis">' + res(ICO.pulse, F.n(Fe.intervenciones), 'Intervenciones') + res(ICO.shovel, nf1.format(Fe.material) + ' mill. m³', 'Material removido') + res(ICO.people, F.pers(Fe.beneficiarios), 'Beneficiarios') + '</div>' +
          '<h3 class="modal-h">Maquinarias, vehículos y equipos · ' + F.n(eq) + '</h3>' +
          '<div class="mf-chips">' + chip(ICO.excavator, 'Maquinarias', Fe.maquinarias) + chip(ICO.gear, 'Especializadas', Fe.especializadas) + chip(ICO.truck, 'Vehículos', Fe.vehiculos) + chip(ICO.tool, 'Equipos', Fe.equipos) + '</div>' +
          '<h3 class="modal-h">Puntos críticos por UBO</h3>' +
          '<div class="mf-sm"><span class="hd">UBO</span><span class="hd">Puntos</span><span class="hd">Volumen m³</span><span class="hd">Km</span>' +
          U.map(u => '<span class="nm" data-tip="' + tipU(u) + '">' + esc(u.ubo) + '</span>' + bar(u, 'puntos', F.n) + bar(u, 'volumen', F.n) + bar(u, 'km', v => nf1.format(v))).join('') +
          '<span class="nm tt">Total general</span><span class="tt n">' + F.n(sum('puntos')) + '</span><span class="tt n">' + F.n(sum('volumen')) + '</span><span class="tt n">' + nf1.format(sum('km')) + '</span></div>'
      };
    };
    MODALES.fen = fenDetalle();

    /* --- Sector: podio del ranking total del Gobierno Nacional.
       Datos reales de data/data.xlsx, convertidos a data/data.js con data/actualizar_data.py.
       Nacional usa el total; cada región usa su propio ranking (departamento donde se ubica la meta del gasto).
       Debajo del podio siempre van 4 filas: puestos 4.º a 6.º y, en la 4.ª fila, el 7.º o Vivienda (37) si está del 8.º para abajo.
       La fila de Vivienda va pintada. --- */
    const sectorCard = () => {
      const DR = window.DATA_REAL || {};
      const R = (nac ? DR.ranking : (DR.porRegion || {})[d.nombre]) || [];
      const subt = nac ? 'Ranking total Gobierno Nacional' : 'Gobierno Nacional en ' + esc(d.nombre);
      const tabs = '<div class="pd-tabs" role="tablist">' + [['avance', 'Por ejecución presupuestal'], ['pim', 'Por PIM']].map(t =>
        '<button type="button" role="tab" data-rank="' + t[0] + '" aria-selected="' + (t[0] === rankModo) + '" class="' + (t[0] === rankModo ? 'on' : '') + '">' + t[1] + '</button>').join('') + '</div>';
      if (R.length < 3) return card('Sector', subt, tabs + '<p class="pd-empty">' + (R.length ? 'En esta región hay menos de 3 sectores del Gobierno Nacional con presupuesto.' : 'Sin datos. Corre <b>python data/scrapear_mef.py</b> y luego <b>python data/actualizar_data.py</b>.') + '</p>', 'card-half');
      const orden = R.slice().sort((a, b) => (b[rankModo] || 0) - (a[rankModo] || 0));
      const millS = v => F.n(Math.round(v / 1e6));
      /* las dos vistas llevan la línea de unidad (vacía en ejecución) para que el podio no cambie de alto */
      const valor = x => rankModo === 'pim' ? '<b>' + millS(x.pim) + '</b><small>S/ mill.</small>' : '<b>' + F.pct(x.avance) + '</b><small aria-hidden="true">&nbsp;</small>';
      const valorTxt = x => rankModo === 'pim' ? 'S/ ' + millS(x.pim) + ' mill.' : F.pct(x.avance);
      const tipS = (x, i) => esc((i + 1) + '.º · ' + x.codigo + ': ' + x.sector + ' · PIM S/ ' + millS(x.pim) + ' mill. · devengado S/ ' + millS(x.devengado) + ' mill. · avance ' + F.pct(x.avance));
      const nombre = x => esc((x.codigo ? x.codigo + ': ' : '') + x.sector);
      const podio = i => '<div class="pd-c p' + (i + 1) + '" data-tip="' + tipS(orden[i], i) + '"><span class="pd-m">' + (i + 1) + '</span><span class="pd-n">' + nombre(orden[i]) + '</span><span class="pd-v">' + valor(orden[i]) + '</span></div>';
      const fila = (i, cls) => '<div class="pd-r' + (cls ? ' ' + cls : '') + '" data-tip="' + tipS(orden[i], i) + '"><span class="pd-rn">' + (i + 1) + ' · ' + nombre(orden[i]) + '</span><b>' + valorTxt(orden[i]) + '</b></div>';
      const iv = orden.findIndex(x => x.codigo === '37');
      const cuarta = iv > 6 ? iv : 6;
      const lista = [3, 4, 5, cuarta].filter(i => i < orden.length).map(i => fila(i, i === iv ? 'me' : '')).join('');
      return card('Sector', subt, tabs +
        '<div class="pd">' + podio(1) + podio(0) + podio(2) + '</div>' +
        '<div class="pd-list">' + lista + '</div>', 'card-half sector-card');
    };

    const EJ = (DREAL.obrasEjecucion && DREAL.obrasEjecucion[region]) || O.ejecucion.sectores, PA = (DREAL.obrasParalizadas && DREAL.obrasParalizadas[region]) || O.paralizadas.sectores,
      RE = (DREAL.obrasReactivadas && DREAL.obrasReactivadas[region]) || O.reactivadas.sectores;
    return '<div class="grid page1 page2">' +
      '<div class="col c-3">' + autoridades + compromisos + '</div>' +
      '<div class="col c-3">' + sectorCard() + mariposa('Obras en ejecución', EJ, 'conexiones nuevas de agua y alcantarillado') + '</div>' +
      '<div class="col c-3">' + mariposa('Obras paralizadas', PA, 'conexiones nuevas de agua') + mariposa('Obras reactivadas en la gestión actual', RE, 'conexiones nuevas de agua') + '</div>' +
      '<div class="col c-3">' + vivienda + preset + fenMini + '</div>' +
      '</div>';
  }

  /* =====================================================================
     REPORTE · gestor de exportación
     Dashboards: una hoja 1920×1080 por página y ámbito, siempre con el menú contraído. Cada hoja se dibuja
     detrás de un aviso, se convierte en imagen (html-to-image) y se agrega al PDF (jsPDF), que se descarga directamente.
     Reporte: 2 hojas A4 por ámbito con las 8 secciones de Reporte/Modelo reporte.docx (reporteHTML).
     ===================================================================== */
  const ICO_EXPORT = I('<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>');
  const ICO_CHEV = I('<path d="M6 9l6 6 6-6"/>');
  const TODAS = '__todas';
  const ANCHO_MIN_EXPORT = 1180;  /* por debajo, el tablero cambia a diseño apilado y las hojas saldrían mal */
  function renderReporte() {
    const tema = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const opt = (tipo, name, value, label, checked, extra) => '<label class="rep-opt"><input type="' + tipo + '" name="' + name + '" value="' + value + '"' + (checked ? ' checked' : '') + '>' +
      '<span>' + label + (extra ? ' <b>' + extra + '</b>' : '') + '</span></label>';
    /* segmentador de departamento, con el mismo estilo que el del encabezado */
    const regSel = name => '<label class="region-pick rep-pick"><span class="region-k">Departamento</span>' +
      '<select name="' + name + '" aria-label="Departamento">' + DATA.regiones.map(x => '<option value="' + esc(x) + '"' + (x === region ? ' selected' : '') + '>' + esc(x) + '</option>').join('') +
      '<option value="' + TODAS + '">Nacional y las 25 regiones</option></select><span class="region-chev">' + ICO_CHEV + '</span></label>';
    return '<div class="rep">' +
      '<section class="card rep-card"><div class="card-head"><div class="card-head-text"><h2 class="card-title">Exportar dashboards</h2>' +
      '<p class="card-sub">PDF con una hoja por página del tablero · menú siempre contraído</p></div></div><div class="card-body">' +
      '<fieldset class="rep-fs"><legend>Páginas</legend>' + opt('checkbox', 'rep-pag', 'general', 'Información general', true) + opt('checkbox', 'rep-pag', 'gestion', 'Gestión sectorial', true) + '</fieldset>' +
      '<fieldset class="rep-fs"><legend>Ámbito</legend>' + regSel('rep-amb') + '</fieldset>' +
      '<fieldset class="rep-fs"><legend>Tema</legend>' + opt('radio', 'rep-tema', 'light', 'Claro', tema === 'light') + opt('radio', 'rep-tema', 'dark', 'Oscuro', tema === 'dark') + '</fieldset>' +
      '<div class="rep-foot"><p class="rep-resumen" id="rep-resumen"></p><button type="button" class="rep-btn" data-exportar="dashboards">' + ICO_EXPORT + 'Exportar PDF</button></div>' +
      '<p class="rep-nota">El PDF se descarga directamente, con una hoja 16:9 por página.</p>' +
      '</div></section>' +
      '<section class="card rep-card"><div class="card-head"><div class="card-head-text"><h2 class="card-title">Exportar reporte</h2>' +
      '<p class="card-sub">Reporte ejecutivo sectorial · 2 hojas A4 por departamento con el formato del modelo</p></div></div><div class="card-body">' +
      '<fieldset class="rep-fs"><legend>Ámbito</legend>' + regSel('rep-ramb') + '</fieldset>' +
      '<p class="rep-nota">Incluye infraestructura y brechas, obras de saneamiento y de vivienda, PRESET, ejecución presupuestal, vivienda y titulación, compromisos y alertas, y FEN.</p>' +
      '<div class="rep-foot"><p class="rep-resumen" id="rep-resumen-r"></p><button type="button" class="rep-btn" data-exportar="reporte">' + ICO_EXPORT + 'Exportar reporte</button></div>' +
      '<p class="rep-nota">El PDF se descarga directamente, en hojas A4.</p></div></section>' +
      '</div>';
  }
  function renderConfiguracion() {
    return '<div class="rep"><section class="card rep-card"><div class="card-head"><div class="card-head-text"><h2 class="card-title">Configuración</h2>' +
      '<p class="card-sub">Preferencias del tablero</p></div></div><div class="card-body">' +
      '<div class="rep-pend">' + ICO.gear + '<div><b>Próximamente</b><span>Aquí se reunirán las preferencias del tablero.</span></div></div></div></section></div>';
  }
  function opcionesExport() {
    const pag = [].slice.call(document.querySelectorAll('input[name="rep-pag"]:checked')).map(i => i.value);
    const amb = (document.querySelector('select[name="rep-amb"]') || {}).value || region;
    const tema = (document.querySelector('input[name="rep-tema"]:checked') || {}).value || 'light';
    return { paginas: pag, regiones: amb === TODAS ? DATA.regiones.slice() : [amb], tema };
  }
  function opcionesReporte() {
    const amb = (document.querySelector('select[name="rep-ramb"]') || {}).value || region;
    return { regiones: amb === TODAS ? DATA.regiones.slice() : [amb] };
  }
  function resumenExport() {
    const rr = $('#rep-resumen-r');
    if (rr) { const k = opcionesReporte().regiones.length; rr.textContent = (k === 1 ? 'Se generará 1 reporte' : 'Se generarán ' + k + ' reportes') + ' · ' + k * 2 + ' hojas A4.'; }
    const r = $('#rep-resumen'), b = document.querySelector('[data-exportar="dashboards"]');
    if (!r || !b) return;
    const o = opcionesExport(), n = o.paginas.length * o.regiones.length;
    const angosta = window.innerWidth < ANCHO_MIN_EXPORT;
    r.textContent = angosta ? 'Para exportar usa una ventana de al menos ' + ANCHO_MIN_EXPORT + ' px de ancho.' :
      n ? 'Se generarán ' + n + (n === 1 ? ' hoja.' : ' hojas.') : 'Elige al menos una página.';
    b.disabled = angosta || !n;
  }
  const esperar = ms => new Promise(res => setTimeout(res, ms));
  /* Descarga directa, sin ventana de impresión: cada hoja se convierte en imagen con html-to-image (la pinta el propio
     navegador, así respeta zoom y color-mix) y se arma el PDF con jsPDF. Las dos librerías están en js/vendor
     y se cargan la primera vez que se exporta. */
  const cargarScript = src => new Promise((ok, mal) => {
    if (document.querySelector('script[src="' + src + '"]')) return ok();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => ok();
    s.onerror = () => { s.remove(); mal(new Error('No se pudo cargar ' + src)); };
    document.head.appendChild(s);
  });
  const librerias = () => Promise.all([cargarScript('js/vendor/html-to-image.js'), cargarScript('js/vendor/jspdf.umd.min.js'), cargarScript('js/vendor/fuente-embed.js')]);
  function avisoExport(total) {
    const aviso = document.createElement('div');
    aviso.className = 'export-aviso';
    aviso.innerHTML = '<div class="export-box"><span class="export-spin"></span><b>Preparando PDF</b><span class="export-prog">0 de ' + total + ' hojas</span></div>';
    document.body.appendChild(aviso);
    return {
      paso: n => { aviso.querySelector('.export-prog').textContent = n + ' de ' + total + ' hojas'; },
      fin: () => aviso.remove(),
      error: e => {
        console.error(e);
        aviso.querySelector('.export-spin').remove();
        aviso.querySelector('b').textContent = 'No se pudo generar el PDF';
        aviso.querySelector('.export-prog').textContent = String((e && e.message) || e);
        setTimeout(() => aviso.remove(), 4000);
      }
    };
  }
  const nombreArchivo = (base, regiones) => base + ' - ' + (regiones.length > 1 ? 'Nacional y regiones' : regiones[0]) + '.pdf';
  /* html-to-image no copia los estilos de clase de los elementos internos de un SVG: sin esto el mapa y los cuadrados salen negros */
  const PROPS_SVG = ['fill', 'stroke', 'stroke-width', 'vector-effect', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linejoin', 'stroke-linecap', 'stroke-dasharray'];
  let exportando = false;
  async function exportarDashboards(o, sinDescarga) {
    if (exportando || !o || !o.paginas || !o.paginas.length || !o.regiones || !o.regiones.length) return null;
    exportando = true;
    const antes = { page, region, tema: document.documentElement.dataset.theme || '', colapsado: app.classList.contains('collapsed') };
    const total = o.paginas.length * o.regiones.length;
    const av = avisoExport(total);
    tip.hidden = true;
    document.body.classList.add('exportando');
    app.classList.add('collapsed');
    document.documentElement.dataset.theme = o.tema || 'light';
    let pdf = null;
    try {
      await librerias();
      await esperar(80);
      const fondo = getComputedStyle(document.documentElement).getPropertyValue('--box-bg').trim() || '#ECEFF3';
      const op = { width: 1920, height: 1080, pixelRatio: total > 6 ? 1.25 : 1.75, quality: 0.92, backgroundColor: fondo };
      /* fuente incrustada (js/vendor/fuente-embed.js, sirve también con el archivo local) y sin <animate>: el mapa ya está en su viewBox final */
      op.fontEmbedCSS = window.FUENTE_EMBED_CSS || '';
      op.filter = n => !(n.tagName && n.tagName.toLowerCase() === 'animate');
      pdf = new jspdf.jsPDF({ orientation: 'landscape', unit: 'pt', format: [1440, 810], compress: true });
      let n = 0;
      for (const r of o.regiones) {
        for (const p of o.paginas) {
          region = r; page = RENDER[p] ? p : 'general'; sel.value = r;
          document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.page === page));
          render();
          await esperar(250);
          fit();
          /* los colores de los SVG (mapa, cuadrados) salen de clases con variables: se fijan en línea para que la imagen los conserve */
          app.querySelectorAll('svg *').forEach(el => { const cs = getComputedStyle(el); PROPS_SVG.forEach(k => el.style.setProperty(k, cs.getPropertyValue(k))); });
          const img = await htmlToImage.toJpeg(app, op);
          if (n) pdf.addPage([1440, 810], 'landscape');
          pdf.addImage(img, 'JPEG', 0, 0, 1440, 810);
          av.paso(++n);
        }
      }
    } catch (e) {
      av.error(e);
      pdf = null;
    } finally {
      region = antes.region; page = antes.page; sel.value = region;
      app.classList.toggle('collapsed', antes.colapsado);
      document.body.classList.remove('exportando');
      if (antes.tema) document.documentElement.dataset.theme = antes.tema; else delete document.documentElement.dataset.theme;
      document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.page === page));
      render();
      exportando = false;
    }
    if (!pdf) return null;
    av.fin();
    if (!sinDescarga) pdf.save(nombreArchivo('Dashboards', o.regiones));
    return pdf;
  }
  /* ---------- Reporte ejecutivo sectorial (modelo: Reporte/Modelo reporte.docx) ----------
     Dos hojas A4 por ámbito con las 8 secciones del modelo. Usa los mismos datos que el tablero:
     DATA_REAL (Excel y MEF) donde existen y los de ejemplo en lo demás; lo que no viene en ninguna fuente dice "sin dato".
     El modelo repite "Estado situacional de obras": la sección 2 es Saneamiento y la 3, Vivienda. */
  const REP_ORG = 'MINISTERIO DE VIVIENDA, CONSTRUCCIÓN Y SANEAMIENTO - CARPETA SM';
  function reporteHTML(r) {
    const d = DATA.get(r), nac = r === 'Nacional', DR = window.DATA_REAL || {};
    const real = (k, def) => (DR[k] && DR[k][r]) || def;
    const O = d.obras, B = d.brechas, IN = d.infra, Fe = d.fen, C = d.compromisos;
    const EJ = real('obrasEjecucion', O.ejecucion.sectores), PA = real('obrasParalizadas', O.paralizadas.sectores), RE = real('obrasReactivadas', O.reactivadas.sectores);
    const pr = real('preset', d.preset), V = real('vivienda', d.vivienda);
    const sd = '<i class="rpt-sd">sin dato</i>';
    const num = v => v == null ? sd : F.n(v);
    const mS = v => v == null ? sd : 'S/ ' + nf1.format(v) + ' mill.';
    const kv = (k, v) => '<li><b>' + k + ':</b> ' + v + '</li>';
    const tarjeta = (t, body, cls) => '<div class="rpt-card' + (cls ? ' ' + cls : '') + '"><h4>' + t + '</h4>' + body + '</div>';
    const seccion = (n, t, body) => '<section class="rpt-sec"><h3>' + n + '. ' + t + '</h3>' + body + '</section>';

    /* 1. Infraestructura y brecha sectorial */
    const inf = [['PTAP', IN.PTAP, 'un.'], ['PTAR', IN.PTAR, 'un.'], ['Pozos', IN.POZOS, 'un.'], ['Reservorios', IN.RESERVORIOS, 'un.'], null,
      ['Red de agua', IN.RED_AGUA, 'km'], ['Red de alcantarillado', IN.RED_ALC, 'km'], ['Lagunas', IN.LAGUNAS, 'un.'], ['EPS', IN.EPS, 'un.'], ['JASS', IN.JASS, 'un.']];
    const infra = '<ul class="rpt-inf">' + inf.map(x => x ? '<li><span>' + x[0] + '</span><b>' + num(x[1]) + ' <small>' + x[2] + '</small></b></li>' : '<li class="sep"></li>').join('') + '</ul>';
    const brecha = (t, o) => '<div class="rpt-bl"><p class="rpt-bt">' + t + '</p><ul>' + kv('Personas sin acceso (total)', num(o.sin)) + kv('En zona urbana', num(o.urb)) + kv('En zona rural', num(o.rur)) + '</ul></div>';
    const s1 = seccion(1, 'Infraestructura y brecha sectorial', '<div class="rpt-g3">' +
      tarjeta('Infraestructura / administración', infra) +
      tarjeta('Brecha saneamiento', brecha('Agua', B.agua) + brecha('Alcantarillado', B.saneamiento)) +
      tarjeta('Brecha vivienda', brecha('Vivienda', B.vivienda) + '<div class="rpt-bl"><p class="rpt-bt">Formalización</p><ul>' + kv('Viviendas sin título', num(B.formalizacion.sinTitulo)) + '</ul></div>') + '</div>');

    /* 2 y 3. Estado situacional de obras por sector */
    const dt = (s, S) => s.directa != null ? 'Directa: <b>' + F.n(s.directa) + '</b> | Transf.: <b>' + F.n(s.transferencia) + '</b>' :
      S.directaTotal != null ? 'Directa / Transf.: sin desglose por sector <span class="rpt-mut">(total de ambos: ' + F.n(S.directaTotal) + ' | ' + F.n(S.transferenciaTotal) + ')</span>' : 'Directa / Transf.: ' + sd;
    const cierre = s => s.conexiones != null ? F.n(s.conexiones) + ' conexiones' : s.cierreBrecha != null ? F.pct(s.cierreBrecha) : sd;
    const obra = (t, S, sec, l1, l2, l3) => {
      const s = S[sec] || {};
      return tarjeta(t, '<p class="rpt-big">' + num(s.total) + ' <small>obras</small></p><p class="rpt-dt">' + dt(s, S) + '</p><ul>' + kv(l1, mS(s.monto)) + kv(l2, num(s.poblacion)) + kv(l3, cierre(s)) + '</ul>');
    };
    const obras = sec => '<div class="rpt-g3">' + obra('Obras paralizadas', PA, sec, 'Inversión total', 'Población afectada', 'Cierre de brecha') +
      obra('Obras reactivadas', RE, sec, 'Inversión movilizada', 'Beneficiarios', 'Cierre de brecha') +
      obra('Obras en ejecución', EJ, sec, 'Monto en ejecución', 'Beneficiarios', 'Impacto en brecha') + '</div>';
    const s2 = seccion(2, 'Estado situacional de obras de inversión pública · Saneamiento', obras('saneamiento'));
    const s3 = seccion(3, 'Estado situacional de obras de inversión pública · Vivienda', obras('vivienda'));

    /* 4. PRESET: el Excel trae monto y población solo del total */
    const parte = (a, b) => a != null && b ? ' <span class="rpt-mut">(' + Math.round(a / b * 100) + ' %)</span>' : '';
    const soloTotal = '<i class="rpt-sd">solo en el total</i>';
    const s4 = seccion(4, 'Evaluación de expedientes técnicos en PRESET', '<table class="rpt-tb"><thead><tr><th>Estado del expediente</th><th>Cantidad</th><th>Monto de inversión proyectado</th><th>Población beneficiaria proyectada</th></tr></thead><tbody>' +
      '<tr><td>En proceso de evaluación</td><td>' + num(pr.evaluacion) + parte(pr.evaluacion, pr.total) + '</td><td>' + soloTotal + '</td><td>' + soloTotal + '</td></tr>' +
      '<tr><td>Expedientes aptos (aprobados)</td><td>' + num(pr.aptos) + parte(pr.aptos, pr.total) + '</td><td>' + soloTotal + '</td><td>' + soloTotal + '</td></tr>' +
      '<tr class="rpt-tt"><td>Total de expedientes en PRESET</td><td>' + num(pr.total) + '</td><td>' + mS(pr.monto) + '</td><td>' + num(pr.poblacion) + '</td></tr></tbody></table>');

    /* 5. Ejecución presupuestal: sector Vivienda (37) del ranking MEF de la región */
    const R = (nac ? DR.ranking : (DR.porRegion || {})[d.nombre]) || [];
    const v37 = R.find(x => x.codigo === '37');
    const M = v => 'S/ ' + nf1.format(v / 1e6) + ' mill.';
    const tot = k => EJ[k] ? EJ[k].total : null;
    const s5 = seccion(5, 'Ejecución presupuestal de inversiones ' + (DR.anio || 2026), '<div class="rpt-g2">' +
      tarjeta('Total de proyectos en ejecución', '<p class="rpt-big">' + num((tot('saneamiento') || 0) + (tot('vivienda') || 0)) + ' <small>inversiones</small></p><ul>' + kv('Saneamiento', num(tot('saneamiento'))) + kv('Vivienda', num(tot('vivienda'))) + '</ul>') +
      tarjeta('Ejecución presupuesto ' + (DR.anio || 2026) + (v37 ? ' (PIM ' + M(v37.pim) + ')' : ''), v37 ?
        '<p class="rpt-big">' + F.pct(v37.avance) + ' <small>devengado</small></p><ul>' + kv('Devengado', M(v37.devengado)) + kv('Saldo por devengar', M(v37.pim - v37.devengado)) + kv('Certificado', sd) + '</ul>' :
        '<p class="rpt-dt">Sector Vivienda (37): ' + sd + '</p>') + '</div>' +
      '<table class="rpt-tb rpt-emb"><thead><tr><th>Proyectos emblemáticos</th><th>Monto presupuestal</th><th>Avance físico</th><th>Avance presupuestal</th></tr></thead>' +
      '<tbody><tr><td colspan="4" class="rpt-sd">Sin proyectos emblemáticos registrados</td></tr></tbody></table>');

    /* 6. Vivienda y titulación */
    const T = V.titulos || {};
    const s6 = seccion(6, 'Inversiones y programas de vivienda y titulación', '<div class="rpt-g3">' +
      tarjeta('Bonos habitacionales', '<ul>' + kv('Desembolsados', num(V.bonos.cantidad)) + kv('Monto total', mS(V.bonos.monto)) + kv('Beneficiarios', num(V.bonos.poblacion)) + '</ul>') +
      tarjeta('Vivienda rural', '<ul>' + kv('Construidas', num(V.viviendaRural.cantidad)) + kv('Monto total', mS(V.viviendaRural.monto)) + kv('Beneficiarios', num(V.viviendaRural.poblacion)) + '</ul>') +
      tarjeta('Formalización / COFOPRI', '<ul>' + kv('Títulos registrados', num(T.cantidad)) + kv('Monto invertido', mS(T.monto)) + kv('Predios registrados', num(V.predios && V.predios.cantidad)) + '</ul>') + '</div>');

    /* 7. Gobernanza */
    const rg = C.riesgo || {};
    const s7 = seccion(7, 'Gobernanza, compromisos y conflictividad activa', '<div class="rpt-g2">' +
      tarjeta('Compromisos', '<ul>' + kv('Compromisos CER', num(C.cer)) + kv('Compromisos REMURPE', num(C.remurpe)) + '</ul>') +
      tarjeta('Alertas', '<ul>' + kv('Riesgos / conflictos activos', rg.activo ? F.n(rg.cantidad) + ' · ' + esc(rg.tipo) + ' · activo' : 'sin riesgos activos') + '</ul>') + '</div>');

    /* 8. FEN */
    const eq = Fe.maquinarias + Fe.especializadas + Fe.vehiculos + Fe.equipos;
    const U = Fe.ubos || [], sum = k => U.reduce((s, u) => s + u[k], 0);
    const und = (t, v, s, c) => '<div class="rpt-u ' + c + '"><h4>' + t + '</h4><b>' + F.n(v) + '</b><small>' + s + '</small></div>';
    const k3 = (v, t, s) => '<div class="rpt-k"><b>' + v + '</b><span>' + t + '</span><small>' + s + '</small></div>';
    const s8 = seccion(8, 'Plan operativo FEN 2026-2027 (atención de emergencias)',
      '<p class="rpt-intro">Despliegue estratégico de maquinaria y capacidad operativa ante el Fenómeno El Niño:</p>' +
      '<div class="rpt-g4">' + und('Maquinarias', Fe.maquinarias, 'Unidades pesadas', 'c1') + und('Especializadas', Fe.especializadas, 'Máquinas especiales', 'c2') +
      und('Vehículos', Fe.vehiculos, 'Unidades de apoyo', 'c3') + und('Equipos', Fe.equipos, 'Equipos de campo', 'c4') + '</div>' +
      '<div class="rpt-band">Parque total desplegado: ' + F.n(eq) + ' unidades (maquinarias, vehículos y equipos)</div>' +
      '<div class="rpt-g3">' + k3(F.n(Fe.intervenciones), 'Intervenciones', 'Ejecutadas / programadas') + k3(nf1.format(Fe.material) + ' millones m³', 'Material removido', 'Descolmatación y cauces') +
      k3(F.pers(Fe.beneficiarios), 'Beneficiarios', 'Población protegida') + '</div>' +
      '<h5 class="rpt-h5">Resumen de puntos críticos FEN atendidos por UBO</h5>' +
      '<table class="rpt-tb rpt-fen"><thead><tr><th rowspan="2">UBO</th><th colspan="2">Puntos críticos</th><th colspan="2">Volumen de remoción (m³)</th><th colspan="2">Longitud intervenida (km)</th></tr>' +
      '<tr><th>Programados</th><th>Ejecutados</th><th>Programado</th><th>Ejecutado</th><th>Programado</th><th>Ejecutado</th></tr></thead><tbody>' +
      U.map(u => '<tr><td>' + esc(u.ubo) + '</td><td class="n">' + F.n(u.puntos) + '</td><td class="n rpt-sd">—</td><td class="n">' + F.n(u.volumen) + '</td><td class="n rpt-sd">—</td><td class="n">' + nf1.format(u.km) + '</td><td class="n rpt-sd">—</td></tr>').join('') +
      '<tr class="rpt-tt"><td>Total general</td><td class="n">' + F.n(sum('puntos')) + '</td><td class="n">—</td><td class="n">' + F.n(sum('volumen')) + '</td><td class="n">—</td><td class="n">' + nf1.format(sum('km')) + '</td><td class="n">—</td></tr></tbody></table>');

    const pie = n => '<footer class="rpt-pie"><span>' + REP_ORG + '</span><span>' + esc(nac ? 'Nacional' : r) + ' · Página ' + n + ' de 2</span></footer>';
    return '<section class="rpt-hoja"><header class="rpt-top"><h1>Reporte ejecutivo sectorial</h1><span>' + esc(nac ? 'Nacional' : r) + '</span></header>' +
      '<div class="rpt-meta"><span><b>FECHA DE CORTE:</b> ' + esc($('#corte-datos').textContent) + '</span><span><b>FUENTE:</b> OGMEI / Torre de Control</span></div>' +
      s1 + s2 + s3 + s4 + s5 + pie(1) + '</section>' +
      '<section class="rpt-hoja p2">' + s6 + s7 + s8 + pie(2) + '</section>';
  }
  /* Dibuja las hojas A4 detrás del aviso, las convierte en imagen y descarga el PDF */
  async function exportarReporte(o, sinDescarga) {
    if (exportando || !o || !o.regiones || !o.regiones.length) return null;
    exportando = true;
    const total = o.regiones.length * 2;
    const av = avisoExport(total);
    tip.hidden = true;
    const lienzo = document.createElement('div');
    lienzo.className = 'rpt rpt-lienzo';
    lienzo.innerHTML = o.regiones.map(reporteHTML).join('');
    document.body.appendChild(lienzo);
    let pdf = null;
    try {
      await librerias();
      await esperar(50);
      pdf = new jspdf.jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4', compress: true });
      const W = pdf.internal.pageSize.getWidth(), H = pdf.internal.pageSize.getHeight();
      const hojas = lienzo.querySelectorAll('.rpt-hoja');
      for (let i = 0; i < hojas.length; i++) {
        const hj = hojas[i];
        const img = await htmlToImage.toJpeg(hj, { width: hj.offsetWidth, height: hj.offsetHeight, pixelRatio: total > 8 ? 2 : 2.5, quality: 0.92, backgroundColor: '#ffffff', skipFonts: true });
        if (i) pdf.addPage('a4', 'portrait');
        pdf.addImage(img, 'JPEG', 0, 0, W, H);
        av.paso(i + 1);
      }
    } catch (e) {
      av.error(e);
      pdf = null;
    } finally {
      lienzo.remove();
      exportando = false;
    }
    if (!pdf) return null;
    av.fin();
    if (!sinDescarga) pdf.save(nombreArchivo('Reporte ejecutivo sectorial', o.regiones));
    return pdf;
  }
  /* acceso para automatizar pruebas o exportaciones desde la consola */
  window.ReporteResumido = { exportarDashboards, exportarReporte };

  const RENDER = { general: renderGeneral, gestion: renderGestion, reporte: renderReporte, configuracion: renderConfiguracion };
  /* Contenido de los modales de la página actual (se rehace en cada render, así sigue a la región) */
  const MODALES = {};
  /* Podio de Sector: orden por avance de ejecución presupuestal ('avance') o por PIM ('pim') */
  let rankModo = 'avance';

  /* ---------- Router ---------- */
  let page = 'general';
  function route() {
    const h = (location.hash || '#/general').replace(/^#\//, '');
    page = PAGES[h] ? h : 'general';
    document.querySelectorAll('.nav-item').forEach(a => a.classList.toggle('active', a.dataset.page === page));
    app.classList.remove('mobile-open');
    render();
  }

  function render(dir) {
    const d = DATA.get(region);
    $('#page-title').textContent = PAGES[page].title;
    $('#page-q').textContent = region + ' · ' + PAGES[page].q;
    const c = $('#content');
    c.innerHTML = RENDER[page](d);
    c.scrollTop = 0;
    document.title = PAGES[page].title + ' · ' + region + ' · Reporte gerencial';
    fit();
    animarMapa();
    if (dir) { const g = c.querySelector('.grid'); if (g) g.classList.add('slide-' + dir); }
    if (page === 'reporte') resumenExport();
  }

  /* ---------- Ajuste a pantalla (sin scroll) ----------
     Se mide la altura natural del tablero y, si no cabe en el alto disponible,
     se escala todo el contenido (zoom) para que entre. Si sobra espacio, las
     filas se reparten la altura. Se recalcula al cambiar el tamaño de la ventana. */
  function fit() {
    const c = $('#content'), g = c.querySelector('.grid');
    if (!g) return;
    g.style.zoom = 1;
    /* el ajuste automático es cosa de escritorio: por debajo de 900px el
       layout ya se apila a una columna y es mejor dejar el scroll normal
       que forzar un zoom que encoja el texto hasta hacerlo illegible */
    if (window.innerWidth < 900 && !document.body.classList.contains('exportando')) return;
    g.classList.add('measuring');
    const natural = g.offsetHeight;
    g.classList.remove('measuring');
    const cs = getComputedStyle(c);
    const avail = c.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (natural > avail && natural > 0) {
      /* con zoom menor el lienzo se ensancha y el texto envuelve menos, así que
         la altura baja: se itera hasta que el zoom se estabiliza (antes solo se
         corregía hacia abajo y quedaba más pequeño de lo necesario) */
      const medir = z => { g.style.zoom = z; g.classList.add('measuring'); const h = g.offsetHeight; g.classList.remove('measuring'); return h; };
      let z = avail / natural;
      for (let i = 0; i < 4; i++) {
        const next = Math.min(1, avail / medir(z));
        if (Math.abs(next - z) < 0.004) { z = Math.min(z, next); break; }
        z = next;
      }
      const final = medir(z);
      if (final * z > avail) z = avail / final;   /* comprobación: con este zoom debe caber */
      g.style.zoom = Math.max(0.5, z * 0.995);
    }
  }
  let fitT;
  window.addEventListener('resize', () => { clearTimeout(fitT); fitT = setTimeout(() => { fit(); animarMapa(); }, 80); });

  /* ---------- Modal de información complementaria ----------
     <dialog> nativo: Esc cierra, el foco queda dentro y vuelve al botón al cerrar.
     El tooltip se mueve dentro del modal mientras está abierto para quedar por encima. */
  const modal = $('#modal'), tipEl = $('#tooltip');
  let modalOrigen = null;
  function abrirModal(k, origen) {
    const m = MODALES[k];
    if (!m || !modal) return;
    $('#modal-title').textContent = m.title;
    $('#modal-sub').innerHTML = m.sub || '';
    $('#modal-sub').hidden = !m.sub;
    $('#modal-body').innerHTML = m.body;
    modalOrigen = origen;
    tipEl.hidden = true;
    modal.appendChild(tipEl);
    if (modal.showModal) modal.showModal(); else modal.setAttribute('open', '');
  }
  function cerrarModal() { if (modal.close) modal.close(); else { modal.removeAttribute('open'); modal.dispatchEvent(new Event('close')); } }
  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal || (e.target.closest && e.target.closest('[data-close]'))) cerrarModal();
    });
    modal.addEventListener('close', () => {
      tipEl.hidden = true;
      document.body.appendChild(tipEl);
      if (modalOrigen && document.contains(modalOrigen)) modalOrigen.focus();
    });
  }

  /* clic en un departamento del mapa = cambiar el filtro (clic de nuevo = Nacional); clic en un botón con data-modal = abrir su modal */
  $('#content').addEventListener('change', e => { if (e.target.closest && e.target.closest('.rep')) resumenExport(); });
  window.addEventListener('resize', () => { if (page === 'reporte') resumenExport(); });
  $('#content').addEventListener('click', e => {
    const ex = e.target.closest && e.target.closest('[data-exportar]');
    if (ex) { if (!ex.disabled) { if (ex.dataset.exportar === 'reporte') exportarReporte(opcionesReporte()); else exportarDashboards(opcionesExport()); } return; }
    const rk = e.target.closest && e.target.closest('[data-rank]');
    if (rk) { if (rk.dataset.rank !== rankModo) { rankModo = rk.dataset.rank; render(); } return; }
    const b = e.target.closest && e.target.closest('[data-modal]');
    if (b) { abrirModal(b.dataset.modal, b); return; }
    const p = e.target.closest && e.target.closest('.mp[data-region]');
    if (p) setRegion(p.dataset.region === region ? 'Nacional' : p.dataset.region);
  });

  window.addEventListener('hashchange', route);
  route();
})();
