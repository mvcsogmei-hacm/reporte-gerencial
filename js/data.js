/* =====================================================================
   Reporte resumido · Datos
   ---------------------------------------------------------------------
   HOY: cifras aleatorias (generadas con semilla por región para que no
   cambien entre recargas). MAÑANA: este archivo se reemplaza por la
   carga desde Excel; basta con devolver un objeto con la misma forma
   que produce buildRegion() más abajo.

   Forma esperada de cada región (una fila del Excel por región):
   {
     nombre, provincias, distritos, poblacion, crecimiento, pobreza,
     formalidad, pea, brechaGenero, pobrezaVar (pp 2019-2024),
     actividades: { Agropecuario: %, Comercio: %, ... },
     infra: { PTAR, POZOS, RESERVORIOS, PTAP, RED_AGUA, RED_ALC, LAGUNAS, EPS, JASS },
     brechas: { agua:{sin,urb,rur}, saneamiento:{...}, vivienda:{...}, formalizacion:{sinTitulo} },
     obras: { paralizadas:{...}, reactivadas:{...}, ejecucion:{...} },
     preset: { total, evaluacion, aptos, monto, poblacion },
     presupuesto: { nacional:{...}, regional:{...} },
     vivienda: { bonos, viviendaRural, titulos, predios },
     actores: { gobernador, alcaldes:[...], diputados:[...], senadores:[...] },
     compromisos: { cer, remurpe, riesgo:{activo, cantidad, tipo} },
     fen: { maquinarias, especializadas, vehiculos, equipos, ubos:[...], intervenciones, material, beneficiarios }
   }
   ===================================================================== */
(function () {
  'use strict';

  const REGIONES = [
    'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao',
    'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque',
    'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno',
    'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
  ];

  const AGRUPACIONES = ['Fuerza Popular', 'Alianza para el Progreso', 'Renovación Popular', 'Perú Libre', 'Somos Perú', 'Acción Popular', 'Avanza País', 'Juntos por el Perú'];
  const NOMBRES = ['Carlos', 'María', 'José', 'Ana', 'Luis', 'Rosa', 'Jorge', 'Carmen', 'Miguel', 'Elena', 'Pedro', 'Lucía', 'Raúl', 'Patricia', 'Víctor', 'Silvia'];
  const APELLIDOS = ['Quispe', 'Flores', 'García', 'Rodríguez', 'Mamani', 'Huamán', 'Torres', 'Vásquez', 'Chávez', 'Ramos', 'Díaz', 'Castillo', 'Sánchez', 'Rojas', 'Mendoza', 'Paredes'];
  const PROFESIONES = ['Abogado(a)', 'Ingeniero(a) civil', 'Economista', 'Médico(a)', 'Administrador(a)', 'Contador(a)', 'Docente', 'Arquitecto(a)'];
  const TIPOS_RIESGO = ['Socioambiental', 'Laboral', 'Demarcación territorial', 'Minería informal', 'Uso de agua'];
  const TIPOS_FEN = ['Inundación', 'Huaico', 'Desborde de río', 'Lluvias intensas', 'Deslizamiento'];

  /* ---------- PRNG con semilla (mulberry32) ---------- */
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function buildRegion(nombre, esNacional) {
    const r = seeded(nombre);
    const ri = (a, b) => Math.floor(a + r() * (b - a + 1));
    const rf = (a, b, d) => +(a + r() * (b - a)).toFixed(d === undefined ? 1 : d);
    const pick = arr => arr[ri(0, arr.length - 1)];
    const persona = () => pick(NOMBRES) + ' ' + pick(APELLIDOS) + ' ' + pick(APELLIDOS);
    const k = esNacional ? 25 : 1; // factor de escala nacional

    /* actividades socioeconómicas (%) — suman 100 */
    const pesos = [rf(8, 30), rf(15, 35), rf(6, 20), rf(2, 25), rf(4, 12), rf(0.5, 8), rf(3, 10)];
    const sum = pesos.reduce((a, b) => a + b, 0);
    const act = pesos.map(p => +(p / sum * 100).toFixed(1));

    const bloqueObra = () => {
      const total = ri(8, 60) * k;
      const directa = ri(Math.round(total * .2), Math.round(total * .7));
      const monto = +(rf(80, 900, 1) * k).toFixed(1);
      const montoDirecta = +(monto * (directa / total)).toFixed(1);
      const pob = ri(20000, 400000) * k;
      const pobDirecta = Math.round(pob * (directa / total));
      const san = ri(Math.round(total * .3), Math.round(total * .8));
      return {
        total, directa, transferencia: total - directa,
        monto, montoDirecta, montoTransferencia: +(monto - montoDirecta).toFixed(1),
        poblacion: pob, poblacionDirecta: pobDirecta, poblacionTransferencia: pob - pobDirecta,
        saneamiento: san, vivienda: total - san,
        cierreBrecha: rf(1, 12, 1)
      };
    };

    const bloquePresupuesto = (esc) => {
      const pim = +(rf(120, 900, 1) * esc).toFixed(1);
      const dev = rf(25, 70, 1);
      const cert = rf(dev + 5, 99, 1);
      return { pim, avance: rf(20, 65, 1), devengado: dev, certificado: cert,
               ro: rf(20, 75, 1), rooc: rf(20, 95, 1),
               roMonto: +(pim * .55).toFixed(1), roocMonto: +(pim * .45).toFixed(1) };
    };

    /* Divide un bloque de obras en sus dos sectores (saneamiento y vivienda).
       Las obras de cada sector son las del bloque; inversión y población se
       reparten alrededor de esa proporción y cada sector tiene su propio
       desglose directa / transferencia y su cierre de brecha. */
    const dividirPorSector = o => {
      const fS = o.total ? o.saneamiento / o.total : .5;
      const cuota = () => Math.min(.9, Math.max(.1, fS + rf(-.15, .15, 2)));
      const sector = (tot, monto, pob) => {
        const directa = tot ? ri(Math.round(tot * .2), Math.round(tot * .8)) : 0;
        const f = tot ? directa / tot : 0;
        const md = +(monto * f).toFixed(1), pd = Math.round(pob * f);
        return { total: tot, directa, transferencia: tot - directa,
                 monto: +monto.toFixed(1), montoDirecta: md, montoTransferencia: +(monto - md).toFixed(1),
                 poblacion: pob, poblacionDirecta: pd, poblacionTransferencia: pob - pd,
                 cierreBrecha: rf(1, 12, 1) };
      };
      const mS = +(o.monto * cuota()).toFixed(1), pS = Math.round(o.poblacion * cuota());
      return { saneamiento: sector(o.saneamiento, mS, pS), vivienda: sector(o.vivienda, o.monto - mS, o.poblacion - pS) };
    };

    const nProv = esNacional ? 196 : ri(3, 13);
    const alcaldes = [];
    if (!esNacional) {
      for (let i = 0; i < nProv; i++) alcaldes.push({ n: i + 1, provincia: 'Provincia ' + (i + 1), nombre: persona(), partido: pick(AGRUPACIONES), distritos: ri(3, 18) });
    }
    const listaAgrup = (n) => {
      const out = {}; for (let i = 0; i < n; i++) { const p = pick(AGRUPACIONES); out[p] = (out[p] || 0) + 1; }
      return Object.entries(out).map(([agrupacion, cantidad]) => ({ agrupacion, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
    };

    const ubos = [];
    const nUbo = esNacional ? 8 : ri(2, 5);
    for (let i = 0; i < nUbo; i++) {
      const dep = esNacional ? pick(REGIONES) : nombre;
      ubos.push({ ubo: dep.toUpperCase() + (esNacional ? '' : ' ' + (i + 1)), departamento: dep.toUpperCase(), puntos: ri(2, 22), volumen: ri(5000, 200000), km: rf(0.5, 30, 2) });
    }

    const brecha = (a, b, c, d) => { const urb = ri(a, b) * k, rur = ri(c, d) * k; return { sin: urb + rur, urb, rur }; };

    const res = {
      nombre,
      provincias: nProv,
      distritos: esNacional ? 1891 : ri(20, 130),
      poblacion: esNacional ? 34200000 : ri(150000, 4000000),
      crecimiento: rf(-0.5, 2.5, 1),
      pobreza: rf(8, 45, 1),
      formalidad: rf(15, 60, 1),
      pea: rf(30, 70, 1),
      brechaGenero: rf(15, 45, 1),
      pobrezaVar: rf(-7, 15, 1),
      actividades: {
        'Agropecuario y agroexportación': act[0],
        'Comercio y servicios': act[1],
        'Manufactura': act[2],
        'Minería e hidrocarburos': act[3],
        'Construcción': act[4],
        'Pesca y acuicultura': act[5],
        'Otros': act[6]
      },
      infra: { PTAR: ri(2, 40) * k, POZOS: ri(20, 400) * k, RESERVORIOS: ri(30, 500) * k, PTAP: ri(3, 60) * k, RED_AGUA: ri(200, 4000) * k, RED_ALC: ri(150, 3000) * k, LAGUNAS: ri(5, 80) * k, EPS: ri(1, 4) * k, JASS: ri(100, 1800) * k },
      brechas: {
        agua: brecha(20000, 500000, 30000, 400000),
        saneamiento: brecha(30000, 600000, 50000, 500000),
        vivienda: brecha(10000, 250000, 15000, 200000),
        formalizacion: { sinTitulo: ri(20000, 300000) * k }
      },
      obras: { paralizadas: bloqueObra(), reactivadas: bloqueObra(), ejecucion: bloqueObra() },
      preset: (() => { const t = ri(10, 80) * k; const ev = ri(Math.round(t * .3), Math.round(t * .8)); return { total: t, evaluacion: ev, aptos: t - ev, monto: +(rf(50, 700, 1) * k).toFixed(1), poblacion: ri(30000, 500000) * k }; })(),
      presupuesto: { nacional: bloquePresupuesto(25), regional: bloquePresupuesto(1) },
      vivienda: {
        bonos: { cantidad: ri(500, 12000) * k, monto: +(rf(15, 300, 1) * k).toFixed(1), poblacion: ri(2000, 50000) * k },
        viviendaRural: { cantidad: ri(100, 3000) * k, monto: +(rf(5, 120, 1) * k).toFixed(1), poblacion: ri(400, 12000) * k },
        titulos: { cantidad: ri(1000, 20000) * k, monto: +(rf(2, 60, 1) * k).toFixed(1), poblacion: ri(4000, 80000) * k },
        predios: { cantidad: ri(2000, 40000) * k }
      },
      actores: {
        gobernador: esNacional ? null : { nombre: persona(), agrupacion: pick(AGRUPACIONES), profesion: pick(PROFESIONES) },
        alcaldes,
        diputados: listaAgrup(esNacional ? 130 : ri(2, 9)),
        senadores: listaAgrup(esNacional ? 60 : ri(1, 4))
      },
      compromisos: {
        cer: ri(0, 12) * k,
        remurpe: ri(0, 8) * k,
        riesgo: (() => { const n = ri(0, 4) * k; return { activo: n > 0, cantidad: n, tipo: n > 0 ? pick(TIPOS_RIESGO) : '—' }; })()
      },
      fen: {
        maquinarias: ri(5, 40) * k, especializadas: ri(2, 15) * k, vehiculos: ri(10, 80) * k, equipos: ri(5, 50) * k,
        ubos,
        tipoPrincipal: pick(TIPOS_FEN),
        intervenciones: ri(50, 600) * k, material: +(rf(0.2, 4, 1) * k).toFixed(1), beneficiarios: ri(20000, 900000) * k
      }
    };
    /* al final, para no mover las demás cifras aleatorias de la región */
    res.obras.ejecucion.sectores = dividirPorSector(res.obras.ejecucion);
    res.obras.paralizadas.sectores = dividirPorSector(res.obras.paralizadas);
    res.obras.reactivadas.sectores = dividirPorSector(res.obras.reactivadas);
    /* Datos de ejemplo: cada región muestra 5 alcaldes y 5 congresistas (3 diputados y 2 senadores).
       Se ajusta al final para no mover las demás cifras aleatorias. Nacional no cambia. */
    if (!esNacional) {
      const al = res.actores.alcaldes;
      while (al.length < 5) al.push({ n: al.length + 1, provincia: 'Provincia ' + (al.length + 1), nombre: persona(), partido: pick(AGRUPACIONES), distritos: ri(3, 18) });
      res.actores.alcaldes = al.slice(0, 5);
      const recorta = (lista, n) => {
        const asientos = [];
        lista.forEach(x => { for (let i = 0; i < x.cantidad; i++) asientos.push(x.agrupacion); });
        while (asientos.length < n) asientos.push(pick(AGRUPACIONES));
        const out = {};
        asientos.slice(0, n).forEach(p => { out[p] = (out[p] || 0) + 1; });
        return Object.entries(out).map(([agrupacion, cantidad]) => ({ agrupacion, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
      };
      res.actores.diputados = recorta(res.actores.diputados, 3);
      res.actores.senadores = recorta(res.actores.senadores, 2);
    }
    return res;
  }

  const cache = {};
  window.DATA = {
    regiones: ['Nacional'].concat(REGIONES),
    corte: { datos: '10 sep 2026', fuente: 'INCORE 2025 · INEI 2025 · ENAHO' },
    get(region) {
      if (!cache[region]) cache[region] = buildRegion(region, region === 'Nacional');
      return cache[region];
    },
    /* Serie transversal para el gráfico de pobreza (todas las regiones) */
    pobrezaPorRegion() {
      return REGIONES.map(n => ({ region: n, valor: this.get(n).pobrezaVar })).sort((a, b) => b.valor - a.valor);
    }
  };
})();
