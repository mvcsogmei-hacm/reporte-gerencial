/* =====================================================================
   Ficha de proyecto · reporte PDF (Reporte → Ficha de proyecto → Descargar PDF)
   Reporte propio de dos hojas A4 hecho con la información de «PARA FICHA DE PROYECTO puno.pptx»
   (raíz del proyecto), con el mismo sistema visual del Reporte ejecutivo sectorial (.rpt-* en styles.css)
   y piezas propias (.fp-*). app.js pone las hojas en un lienzo, las convierte en imagen y arma el PDF.
   Para otra ficha basta con cambiar el objeto DATOS (montos en millones de soles).
   ===================================================================== */
(function () {
  'use strict';

  const DATOS = {
    region: 'Puno',
    proyecto: 'PIAA Juliaca (C. Juliaca - PNSU)',
    programa: 'Programa Nacional de Saneamiento Urbano (PNSU)',
    cui: '2331661',
    anio: 2026,
    montoTotal: 1660,            /* expediente técnico + obra */
    poblacion: 480129,
    /* avance financiero acumulado (tal como viene en la ficha) */
    financiero: { devengado: 291, saldo: 1469, avance: 17.5, pendiente: 83.4 },
    pim: { total: 353, certificado: 343, certificadoPct: 97, devengado: 218.2, devengadoPct: 61.8, saldo: 135, pendiente: 38.2 },
    fuentes: [
      { sigla: 'RO', nombre: 'Recursos ordinarios', pim: 41.4, devengado: 3.5, avance: 8.5, pendiente: 91.5 },
      { sigla: 'ROOC', nombre: 'Recursos por operaciones oficiales de crédito', financiador: 'Banco Interamericano de Desarrollo (BID)', pim: 311.5, devengado: 215, avance: 68.9, pendiente: 31.1 }
    ],
    hitos: [
      { fecha: '26/07/2017', hito: 'Viabilidad / aprobación', cumplido: true },
      { fecha: '26/07/2017', hito: 'Inicio de elaboración del ET / DE', cumplido: true },
      { fecha: '16/08/2024', hito: 'Inicio de ejecución física', cumplido: true },
      { fecha: '01/112/2029', hito: 'Fin de ejecución física', cumplido: false }   /* fecha tal como viene en la ficha */
    ],
    /* situación: concluida, ejecucion o por iniciar */
    etapas: [
      { n: 1, componente: 'Sectores AD-02, AD04 y AD-07', monto: 5.7, pctInversion: 0.3, fisico: 100, beneficiarios: '3 mil',
        inicio: null, fin: '31/12/2025', situacion: 'concluida',
        estado: 'Obra al 100 %. Pendiente de recepción: en proceso de elaboración del ET de subsanación de defectos por observaciones de la EPS SEDA Juliaca.',
        riesgo: 'Retraso en la transferencia a la EPS por la subsanación de defectos e intervención correctiva.' },
      { n: 2, componente: 'Mejoramiento de los sistemas de agua potable y alcantarillado', monto: 125.4, pctInversion: 7.5, fisico: 5.89, beneficiarios: '146 mil',
        inicio: '31/01/2026', fin: '24/07/2027', situacion: 'ejecucion',
        estado: 'En ejecución de obra.',
        riesgo: 'Superposición del área de intervención del proyecto con la ampliación del aeropuerto.' },
      { n: 3, componente: 'Construcción de captación, PTAP y línea de conducción Juliaca – San Miguel', monto: 513.8, pctInversion: 31, fisico: 0.47, beneficiarios: '370 mil',
        inicio: '25/02/2026', fin: '17/04/2029', situacion: 'ejecucion',
        estado: 'En ejecución de obra.',
        riesgo: 'Afectación ambiental por inviabilidad del depósito de material excedente Yocará Cambraca.' },
      { n: 4, componente: 'Ampliación de sistemas de agua potable y alcantarillado (LPI N° PE-L1285-P00036)', monto: 800, pctInversion: 48, fisico: 0, beneficiarios: '221 mil',
        inicio: '07/01/2027', fin: '22/12/2029', situacion: 'por iniciar',
        estado: 'Revisión del BID y emisión de no objeción.',
        riesgo: 'Posible retraso en la adjudicación.' }
    ]
  };

  const ORG = 'MINISTERIO DE VIVIENDA, CONSTRUCCIÓN Y SANEAMIENTO - CARPETA SM';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nf0 = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nfp = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 2 });
  const mill = v => 'S/ ' + nf1.format(v) + ' mill.';
  const pct = v => nfp.format(v) + ' %';
  const barra = (v, cls) => '<div class="fp-bar' + (cls ? ' ' + cls : '') + '"><i style="width:' + Math.max(0, Math.min(100, v)).toFixed(2) + '%"></i></div>';
  const conPct = (v, cls) => '<div class="fp-pc">' + barra(v, cls) + '<b>' + pct(v) + '</b></div>';
  const seccion = (n, t, body) => '<section class="rpt-sec"><h3>' + n + '. ' + t + '</h3>' + body + '</section>';
  const SIT = { concluida: ['ok', 'Concluida'], ejecucion: ['ej', 'En ejecución'], 'por iniciar': ['pi', 'Por iniciar'] };
  const COLORES = ['#a9cbe9', '#5b9bd5', '#2b6cb0', '#0b4a82'];

  /* Las dos hojas A4 del reporte. corte = fecha de corte de los datos del tablero */
  function hojas(corte) {
    const D = DATOS, F = D.financiero, P = D.pim;
    const cuenta = s => D.etapas.filter(e => e.situacion === s).length;
    const pie = n => '<footer class="rpt-pie"><span>' + ORG + '</span><span>' + esc(D.region) + ' · CUI ' + D.cui + ' · Página ' + n + ' de 2</span></footer>';

    /* ---------- hoja 1 ---------- */
    const cabecera = '<header class="rpt-top"><h1>Ficha de proyecto</h1><span>' + esc(D.region) + '</span></header>' +
      '<div class="rpt-meta"><span><b>CUI:</b> ' + D.cui + '</span><span><b>FECHA DE CORTE:</b> ' + esc(corte || '') + '</span><span><b>FUENTE:</b> OGMEI / Torre de Control</span></div>' +
      '<div class="fp-tit"><h2>' + esc(D.proyecto) + '</h2><p>' + esc(D.programa) + ' · Región ' + esc(D.region) + ' · Financiamiento: RO y ROOC (' + esc(D.fuentes[1].financiador) + ')</p></div>';

    const kpi = (etiqueta, valor, extra) => '<div class="fp-kpi"><span>' + etiqueta + '</span><b>' + valor + '</b>' + (extra || '') + '</div>';
    const n1 = cuenta('concluida'), n2 = cuenta('ejecucion'), n3 = cuenta('por iniciar');
    const s1 = seccion(1, 'Resumen del proyecto',
      '<div class="rpt-g4">' +
      kpi('Monto total de inversión', 'S/ ' + nf0.format(D.montoTotal) + ' <small>mill.</small>', '<em>Expediente técnico + obra</em>') +
      kpi('Población beneficiaria', nf0.format(D.poblacion) + ' <small>hab.</small>', '<em>Habitantes de la ciudad de Juliaca</em>') +
      kpi('Avance financiero acumulado', pct(F.avance), barra(F.avance) + '<em>Devengado ' + mill(F.devengado) + '</em>') +
      kpi('Etapas del proyecto', D.etapas.length, '<em>' + n1 + ' concluida · ' + n2 + ' en ejecución · ' + n3 + ' por iniciar</em>') +
      '</div>' +
      '<p class="fp-lect">El proyecto tiene un costo total de <b>' + mill(D.montoTotal) + '</b> y beneficia a <b>' + nf0.format(D.poblacion) + ' habitantes</b>. ' +
      'Su avance financiero acumulado es de <b>' + pct(F.avance) + '</b> (' + mill(F.devengado) + ' devengados). ' +
      'En ' + D.anio + ' se certificó el <b>' + pct(P.certificadoPct) + '</b> del PIM y se devengó el <b>' + pct(P.devengadoPct) + '</b> (' + mill(P.devengado) + ' de ' + mill(P.total) + '). ' +
      'De sus ' + D.etapas.length + ' etapas, ' + n1 + (n1 === 1 ? ' está concluida, ' : ' están concluidas, ') + n2 + (n2 === 1 ? ' está en ejecución' : ' están en ejecución') + ' y ' + n3 + ' por iniciar.</p>');

    const filaP = (etiqueta, monto, v, cls) => '<tr><td>' + etiqueta + '</td><td class="n">' + mill(monto) + '</td><td>' + conPct(v, cls) + '</td></tr>';
    const presupuesto = '<table class="rpt-tb fp-tb"><thead><tr><th>Concepto</th><th class="n">Monto</th><th style="width:46%">Respecto del PIM</th></tr></thead><tbody>' +
      filaP('PIM ' + D.anio, P.total, 100) + filaP('Certificado', P.certificado, P.certificadoPct, 'g') +
      filaP('Devengado', P.devengado, P.devengadoPct) + filaP('Saldo por devengar', P.saldo, P.pendiente, 'o') + '</tbody></table>';
    const fuentes = '<table class="rpt-tb fp-tb"><thead><tr><th>Fuente</th><th class="n">PIM</th><th class="n">Devengado</th><th style="width:38%">Avance</th></tr></thead><tbody>' +
      D.fuentes.map(f => '<tr><td><b>' + f.sigla + '</b><br><span class="fp-sub">' + esc(f.nombre) + (f.financiador ? ' · ' + esc(f.financiador) : '') + '</span></td>' +
        '<td class="n">' + mill(f.pim) + '</td><td class="n">' + mill(f.devengado) + '</td><td>' + conPct(f.avance, f.avance >= 50 ? 'g' : 'o') + '</td></tr>').join('') + '</tbody></table>';
    const s2 = seccion(2, 'Ejecución presupuestal ' + D.anio,
      '<div class="rpt-g2"><div><p class="fp-h">Presupuesto del año</p>' + presupuesto + '</div><div><p class="fp-h">Por fuente de financiamiento</p>' + fuentes + '</div></div>');

    const hechos = D.hitos.filter(h => h.cumplido).length;
    const s3 = seccion(3, 'Línea de tiempo del proyecto',
      '<div class="fp-lt" style="--av:' + (Math.max(0, hechos - 1) / (D.hitos.length - 1) * 100).toFixed(1) + '%">' +
      D.hitos.map(h => '<div class="fp-hito' + (h.cumplido ? '' : ' prog') + '"><i></i><b>' + esc(h.fecha) + '</b><span>' + esc(h.hito) + '</span><em>' + (h.cumplido ? 'Cumplido' : 'Programado') + '</em></div>').join('') +
      '</div>');

    const asignadoPct = D.etapas.reduce((t, e) => t + e.pctInversion, 0), asignado = D.etapas.reduce((t, e) => t + e.monto, 0);
    const partes = D.etapas.map((e, i) => ({ t: 'Etapa ' + e.n, m: e.monto, p: e.pctInversion, c: COLORES[i] }))
      .concat(asignadoPct < 100 ? [{ t: 'No desagregado', m: D.montoTotal - asignado, p: 100 - asignadoPct, c: '#c5ced8' }] : []);
    const s4 = seccion(4, 'Distribución de la inversión por etapa',
      '<div class="fp-dist">' + partes.map(p => '<i style="width:' + p.p.toFixed(2) + '%;background:' + p.c + '"></i>').join('') + '</div>' +
      '<div class="fp-leg">' + partes.map(p => '<div style="border-color:' + p.c + '"><b>' + p.t + '</b>' + mill(p.m) + '<br>' + pct(Math.round(p.p * 10) / 10) + ' del total</div>').join('') + '</div>' +
      '<p class="fp-nota">Porcentajes sobre el monto total de inversión (' + mill(D.montoTotal) + '). Las etapas suman ' + mill(asignado) + '; el resto no está desagregado por etapa en la ficha.</p>');

    /* ---------- hoja 2 ---------- */
    const plazo = e => e.inicio ? esc(e.inicio) + ' – ' + esc(e.fin) : 'Concluida el ' + esc(e.fin);
    const s5 = seccion(5, 'Avance de la fase de ejecución por etapa',
      '<table class="rpt-tb fp-tb fp-et"><thead><tr><th>Etapa</th><th>Componente</th><th class="n">Monto (S/ mill.)</th><th class="n">% de la inversión</th><th style="width:17%">Avance físico</th><th class="n">Beneficiarios</th><th>Plazo</th><th>Situación</th></tr></thead><tbody>' +
      D.etapas.map(e => '<tr><td class="fp-n">' + e.n + '</td><td>' + esc(e.componente) + '</td><td class="n">' + nf1.format(e.monto) + '</td><td class="n">' + pct(e.pctInversion) + '</td>' +
        '<td>' + conPct(e.fisico, e.fisico >= 100 ? 'g' : '') + '</td><td class="n">' + esc(e.beneficiarios) + '</td><td>' + plazo(e) + '</td>' +
        '<td><span class="fp-st ' + SIT[e.situacion][0] + '">' + SIT[e.situacion][1] + '</span></td></tr>').join('') +
      '<tr class="rpt-tt"><td></td><td>Total de las etapas</td><td class="n">' + nf1.format(asignado) + '</td><td class="n">' + pct(Math.round(asignadoPct * 10) / 10) + '</td><td colspan="4"></td></tr>' +
      '</tbody></table>');

    const s6 = seccion(6, 'Situación actual y riesgos por etapa',
      '<table class="rpt-tb fp-tb fp-rgs"><thead><tr><th>Etapa</th><th style="width:48%">Situación actual</th><th>Riesgo identificado</th></tr></thead><tbody>' +
      D.etapas.map(e => '<tr><td class="fp-n">' + e.n + '</td><td><span class="fp-st ' + SIT[e.situacion][0] + '">' + SIT[e.situacion][1] + '</span> ' + esc(e.estado) + '</td>' +
        '<td><div class="fp-rg"><i></i><span>' + esc(e.riesgo) + '</span></div></td></tr>').join('') +
      '</tbody></table>');

    /* puntos de atención derivados de los datos */
    const puntos = [];
    D.etapas.filter(e => e.situacion === 'por iniciar').forEach(e => puntos.push('<b>Etapa ' + e.n + '</b> (' + pct(e.pctInversion) + ' de la inversión, ' + mill(e.monto) + ') aún no inicia: ' + esc(e.estado.charAt(0).toLowerCase() + e.estado.slice(1)) + ' Inicio previsto el ' + esc(e.inicio) + '.'));
    D.etapas.filter(e => e.situacion === 'ejecucion' && e.fisico < 10).forEach(e => puntos.push('<b>Etapa ' + e.n + '</b>: avance físico de ' + pct(e.fisico) + ', con fin previsto el ' + esc(e.fin) + '.'));
    D.etapas.filter(e => e.situacion === 'concluida').forEach(e => puntos.push('<b>Etapa ' + e.n + '</b>: obra concluida y pendiente de recepción.'));
    D.fuentes.filter(f => f.avance < 50).forEach(f => puntos.push('<b>' + f.sigla + '</b> (' + esc(f.nombre.toLowerCase()) + '): solo ' + pct(f.avance) + ' devengado (' + mill(f.devengado) + ' de ' + mill(f.pim) + ').'));
    puntos.push('<b>Avance financiero acumulado</b> de ' + pct(F.avance) + ' frente a un fin de ejecución física programado para ' + esc(D.hitos[D.hitos.length - 1].fecha) + '.');
    const s7 = seccion(7, 'Puntos de atención', '<ul class="fp-aten">' + puntos.map(p => '<li>' + p + '</li>').join('') + '</ul>');

    return '<section class="rpt-hoja">' + cabecera + s1 + s2 + s3 + s4 + pie(1) + '</section>' +
      '<section class="rpt-hoja p2">' + s5 + s6 + s7 + pie(2) + '</section>';
  }

  window.FichaProyecto = {
    datos: DATOS, hojas,
    archivo: 'Ficha de proyecto - ' + DATOS.region + ' - CUI ' + DATOS.cui + '.pdf'
  };
})();
