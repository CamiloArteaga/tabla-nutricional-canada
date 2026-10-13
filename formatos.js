// Renderizado de la Nutrition Facts table y del símbolo "High in" en HTML.
// Idiomas: "en", "fr", "ambas" (dos tablas, EN y FR) y "bilingue" (una tabla
// combinada «EN / FR»). Orden de filas según las figuras del Directory of NFT
// Formats (B.01.450(1)), no según el orden numérico de B.01.401.

const DTF =
  typeof module !== "undefined" && module.exports
    ? require("./datos.js")
    : window.D;
const CF =
  typeof module !== "undefined" && module.exports
    ? require("./calculo.js")
    : window.C;

const NBSP = " ";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Número en el idioma de la tabla: punto en EN y en la tabla bilingüe, coma en FR.
function fmtNum(n, lang) {
  const s = String(CF.limpiar(n));
  return lang === "fr" ? s.replace(".", ",") : s;
}
function txtCant(valor, unidad, lang) {
  return `${fmtNum(valor, lang)}${NBSP}${unidad}`;
}
function txtPct(p, lang) {
  void lang;
  return `${p}${NBSP}%`;
}

const T = DTF.TEXTO;

// Texto de un par EN/FR según el modo de salida.
function par(en, fr, modo) {
  if (modo === "bilingue") return en === fr ? esc(en) : `${esc(en)} / ${esc(fr)}`;
  return esc(modo === "fr" ? fr : en);
}

// "Per 1 cup (250 mL)" / "pour 1 tasse (250 mL)"
function textoPorcion(col, modo, unidad) {
  const lang = (l) => {
    const hm = l === "fr" ? col.hmFr || col.hmEn : col.hmEn;
    const metrica = `${fmtNum(col.res.porcion, l)}${NBSP}${unidad || "g"}`;
    return hm ? `${hm} (${metrica})` : metrica;
  };
  const en = `${T.en.por} ${lang("en")}`;
  const fr = `${T.fr.por} ${lang("fr")}`;
  return par(en, fr, modo);
}

// --- Especificación de filas ---

// Devuelve las filas visibles en el orden de las figuras.
// orden: "tabla" (Fig. 1.1/18.1) o "lineal" (Fig. 16.1: colesterol antes de carbohidrato).
function especFilas(R, orden) {
  const o = R.opciones || {};
  const ad = new Set(R.adicionales);
  const mostrar = R.reducida ? R.reducida.mostrar : null;
  const ocultoInfante = R.audiencia === "lactantes" && o.omitirSatTransChol;
  const vis = (k) => {
    if (mostrar && !mostrar.has(k)) return false;
    if (ocultoInfante && (k === "sat" || k === "trans" || k === "chol"))
      return false;
    return true;
  };
  const core = Object.fromEntries(DTF.CORE_INFO.map((i) => [i.k, i]));
  const adic = Object.fromEntries(DTF.ADICIONALES.map((i) => [i.k, i]));
  const filas = [];
  const add = (k, nivel, extra = {}) => {
    const d = core[k] || adic[k];
    filas.push({
      k,
      nivel,
      en: d.en,
      fr: d.fr,
      unidad: d.unidad,
      unidadFr: d.unidadFr || d.unidad,
      pct:
        extra.pct !== undefined
          ? extra.pct
          : d.dv || (core[k] && d.pct ? k : null),
      ...extra,
    });
  };
  const adicional = (k, nivel, extra) => {
    if (ad.has(k)) add(k, nivel, extra);
  };

  filas.push({ k: "cal", tipo: "cal" });
  if (vis("fat")) add("fat", 0);
  if (vis("sat")) add("sat", 1, { pct: "satTrans" });
  if (vis("trans")) add("trans", 1, { pct: null, prefijo: "+ " });
  const conPoli = ad.has("poli");
  if (conPoli) {
    adicional("poli", 1);
    adicional("omega6", 2);
    adicional("omega3", 2);
  } else {
    if (ad.has("omega6"))
      add("omega6", 1, {
        en: "Omega-6 Polyunsaturated",
        fr: "Acides gras polyinsaturés oméga-6",
      });
    if (ad.has("omega3"))
      add("omega3", 1, {
        en: "Omega-3 Polyunsaturated",
        fr: "Acides gras polyinsaturés oméga-3",
      });
  }
  adicional("mono", 1);

  const filaChol = () => {
    if (vis("chol")) add("chol", 0, { pct: o.mostrarPctChol ? "chol" : null });
  };
  if (orden === "lineal") {
    // Fig. 16.1: Calories, Fat, Sat+Trans, Cholesterol, Carbohydrate, ...
    filaChol();
  }
  if (vis("cho")) add("cho", 0);
  if (vis("fibre")) add("fibre", 1);
  adicional("fibreSol", 2);
  adicional("fibreInsol", 2);
  if (vis("sugars")) add("sugars", 1);
  adicional("polialcoholes", 1);
  adicional("almidon", 1);
  if (vis("prot")) add("prot", 0);
  if (orden !== "lineal") filaChol();
  if (vis("na")) add("na", 0);
  for (const k of ["pot", "ca", "fe"]) if (vis(k)) add(k, 0);
  for (const def of DTF.ADICIONALES) if (def.dv) adicional(def.k, 0);
  return filas;
}

function nombreFila(f, modo) {
  const pref = f.prefijo || "";
  if (modo === "bilingue") return f.en === f.fr ? esc(pref + f.en) : `${esc(pref + f.en)} / ${esc(f.fr)}`;
  return esc(pref + (modo === "fr" ? f.fr : f.en));
}

function celdaCant(res, f, lang, modo) {
  const v = res.cant[f.k];
  let unidad = lang === "fr" ? f.unidadFr : f.unidad;
  if (modo === "bilingue" && f.unidad !== f.unidadFr) unidad = `${f.unidad} / ${f.unidadFr}`;
  return txtCant(v, unidad, lang);
}

// Fila de Calories: "Calories 150" (+ kJ).
function textoCal(R, col, lang) {
  const o = R.opciones || {};
  const cal = fmtNum(col.res.cant.cal, lang);
  if (o.mostrarKJ) return `${cal} (${fmtNum(col.res.cant.kJ, lang)}${NBSP}kJ)`;
  return cal;
}

// "Not a significant source of x, y, or z." (B.01.401(6)(j))
function textoNoSignificativa(R, modo) {
  const r = R.reducida;
  if (!r || r.individual) return "";
  const o = R.opciones || {};
  const lista = (l) => {
    if (o.otrosNutrientes) return T[l].otros;
    const orden = [
      "sat",
      "trans",
      "fibre",
      "sugars",
      "chol",
      "na",
      "pot",
      "ca",
      "fe",
    ];
    const n = orden
      .filter((k) => r.omitidos.includes(k))
      .map((k) => DTF.NOMBRE_OMITIDO[l][k]);
    if (n.length === 0) return "";
    if (n.length === 1) return n[0];
    const conj = T[l].o;
    return l === "en"
      ? `${n.slice(0, -1).join(", ")}, ${conj} ${n[n.length - 1]}`
      : `${n.slice(0, -1).join(", ")} ${conj} ${n[n.length - 1]}`;
  };
  const en = lista("en");
  const fr = lista("fr");
  if (!en) return "";
  const frase = (l, x) => `${T[l].noSignificativa} ${x}.`;
  return par(frase("en", en), frase("fr", fr), modo);
}

function leyenda(modo) {
  const en = T.en.leyenda;
  const fr = T.fr.leyenda;
  const resaltar = (s, a, b) =>
    esc(s).replace(a, `<b>${a}</b>`).replace(b, `<b>${b}</b>`);
  const hEn = resaltar(en, "a little", "a lot");
  const hFr = resaltar(fr, "peu", "beaucoup");
  if (modo === "bilingue") return `${hEn}<br>${hFr}`;
  return modo === "fr" ? hFr : hEn;
}

function encabezadoPct(modo) {
  if (modo === "bilingue") return `${esc(T.en.pctVd)}* ${esc(T.fr.pctVd)}*`;
  return `${esc(modo === "fr" ? T.fr.pctVd : T.en.pctVd)}*`;
}

function lineaPorEnvase(R, modo) {
  const pe = R.porEnvase;
  if (!pe) return "";
  const l = (lang) =>
    `${T[lang].porEnvase} ${pe.aprox ? T[lang].aprox + " " : ""}${fmtNum(pe.valor, lang)}`;
  return `<div class="nft-envase">${par(l("en"), l("fr"), modo)}</div>`;
}

// --- Tabla vertical (estándar, simplificada y multicolumna) ---

function filaHTML(cls, label, celdas) {
  return `<tr class="${cls}"><td class="et">${label}</td>${celdas.map((c) => `<td class="n">${c}</td>`).join("")}</tr>`;
}

function tablaVertical(R, modo, unidad) {
  const lang = modo === "fr" ? "fr" : "en";
  const filas = especFilas(R, "tabla");
  const cols = R.columnas;
  const mm = R.modo;
  const bold = (s) => `<b>${s}</b>`;
  let html = `<div class="nft nft-${modo}">`;
  html += `<div class="nft-titulo">${par(T.en.titulo, T.fr.titulo, modo === "bilingue" ? "bilingue" : modo)}</div>`;
  if (mm === "unica" || mm === "preparado") {
    html += `<div class="nft-porcion">${textoPorcion(cols[0], modo, unidad)}`;
    if (mm === "preparado" && cols[1]) {
      const hm = (l) =>
        l === "fr" ? cols[1].hmFr || cols[1].hmEn : cols[1].hmEn;
      const txt = (l) =>
        `(${T[l].aprox} ${hm(l) || fmtNum(cols[1].res.porcion, l) + NBSP + (unidad || "g")} ${l === "fr" ? "préparé" : "prepared"})`;
      html += `<br>${par(txt("en"), txt("fr"), modo)}`;
    }
    html += `</div>`;
  }
  html += lineaPorEnvase(R, modo);
  html += `<table>`;

  // Encabezados de columnas
  if (mm === "preparado") {
    html += `<tr class="cab"><td></td><td>${par(T.en.asSold, T.fr.asSold, modo)}</td><td colspan="2">${par(T.en.preparado, T.fr.preparado, modo)}</td></tr>`;
  } else if (mm === "alimentos") {
    html += `<tr class="cab"><td></td>${cols
      .map(
        (c, i) =>
          `<td colspan="2">${par(c.rotuloEn || `${T.en.alimento} ${i + 1}`, c.rotuloFr || `${T.fr.alimento} ${i + 1}`, modo)}<br><small>${textoPorcion(c, modo, unidad)}</small></td>`,
      )
      .join("")}</tr>`;
  } else if (mm === "cantidades") {
    html += `<tr class="cab"><td></td><td colspan="2">${textoPorcion(cols[0], modo, unidad)}</td>${cols
      .slice(1)
      .map((c) => `<td>${textoPorcion(c, modo, unidad)}</td>`)
      .join("")}</tr>`;
  } else if (mm === "cantidades-completas") {
    html += `<tr class="cab"><td></td>${cols.map((c) => `<td colspan="2">${textoPorcion(c, modo, unidad)}</td>`).join("")}</tr>`;
  }

  // Fila de Calories
  const calLabel = par("Calories", "Calories", modo);
  if (mm === "unica") {
    html += `<tr class="cal"><td class="et">${bold(calLabel)}</td><td class="n" colspan="1">${bold(textoCal(R, cols[0], lang))}</td><td></td></tr>`;
  } else if (mm === "preparado") {
    html += `<tr class="cal"><td class="et">${bold(calLabel)}</td><td class="n">${bold(textoCal(R, cols[0], lang))}</td><td></td><td class="n">${bold(textoCal(R, cols[1], lang))}</td></tr>`;
  } else if (mm === "alimentos" || mm === "cantidades-completas") {
    html += `<tr class="cal"><td class="et">${bold(calLabel)}</td>${cols.map((c) => `<td class="n" colspan="2">${bold(textoCal(R, c, lang))}</td>`).join("")}</tr>`;
  } else if (mm === "cantidades") {
    html += `<tr class="cal"><td class="et">${bold(calLabel)}</td><td class="n" colspan="2">${bold(textoCal(R, cols[0], lang))}</td>${cols
      .slice(1)
      .map((c) => `<td class="n">${bold(textoCal(R, c, lang))}</td>`)
      .join("")}</tr>`;
  }

  // Subencabezado %DV
  const dag = mm === "cantidades" ? "†" : "";
  const subPct = `${encabezadoPct(modo)}${dag}`;
  if (mm === "unica")
    html += `<tr class="sub"><td></td><td></td><td class="n">${subPct}</td></tr>`;
  else if (mm === "preparado")
    html += `<tr class="sub"><td></td><td></td><td class="n">${subPct}</td><td class="n">${subPct}</td></tr>`;
  else if (mm === "cantidades")
    html += `<tr class="sub"><td></td><td></td><td class="n">${subPct}</td>${cols
      .slice(1)
      .map(() => "<td></td>")
      .join("")}</tr>`;
  else
    html += `<tr class="sub"><td></td>${cols.map(() => `<td></td><td class="n">${subPct}</td>`).join("")}</tr>`;

  // Filas de nutrientes
  const PREP = new Set([
    "fat",
    "satTrans",
    "chol",
    "na",
    "sugars",
    "pot",
    "ca",
    "fe",
  ]);
  for (const f of filas) {
    if (f.tipo === "cal") continue;
    const nombre = nombreFila(f, modo);
    const etiqueta = f.nivel === 0 ? bold(nombre) : nombre;
    const cls = `n${f.nivel}`;
    const cel = (c, soloPct) => {
      const p = f.pct ? c.res.pct[f.pct] : null;
      const cant = soloPct ? "" : celdaCant(c.res, f, lang, modo);
      return { cant, pct: p == null ? "" : txtPct(p, lang) };
    };
    if (mm === "unica") {
      const x = cel(cols[0]);
      html += filaHTML(
        cls,
        `${etiqueta}${x.cant ? ` <span class="cant">${x.cant}</span>` : ""}`,
        [x.pct ? x.pct : ""],
      ).replace('<td class="n">', '<td class="n pct">');
    } else if (mm === "preparado") {
      const s = cel(cols[0]);
      const p = cel(cols[1], true);
      const pctPrep =
        f.pct && PREP.has(f.pct)
          ? p.pct
          : f.pct &&
              f.pct !== "fibre" &&
              DTF.ADICIONALES.some((a) => a.dv && a.k === f.pct)
            ? p.pct
            : "";
      html += `<tr class="${cls}"><td class="et">${etiqueta} <span class="cant">${s.cant}</span></td><td class="n"></td><td class="n pct">${s.pct}</td><td class="n pct">${pctPrep}</td></tr>`;
    } else if (mm === "cantidades") {
      const s = cel(cols[0]);
      html += `<tr class="${cls}"><td class="et">${etiqueta} <span class="cant">${s.cant}</span></td><td class="n"></td><td class="n pct">${s.pct}</td>${cols
        .slice(1)
        .map(() => "<td></td>")
        .join("")}</tr>`;
    } else {
      // alimentos y cantidades-completas: cantidad y %VD por columna
      const celdas = cols
        .map((c) => {
          const x = cel(c);
          return `<td class="n">${x.cant}</td><td class="n pct">${x.pct}</td>`;
        })
        .join("");
      html += `<tr class="${cls}"><td class="et">${etiqueta}</td>${celdas}</tr>`;
    }
  }
  html += `</table>`;
  const ns = textoNoSignificativa(R, modo);
  if (ns) html += `<div class="nft-ns">${ns}</div>`;
  if (mm === "cantidades") {
    const hm = (l) =>
      (l === "fr" ? cols[0].hmFr || cols[0].hmEn : cols[0].hmEn) ||
      fmtNum(cols[0].res.porcion, l) + NBSP + (unidad || "g");
    html += `<div class="nft-nota">† ${par(`Amount in ${hm("en")}.`, `Teneur pour ${hm("fr")}.`, modo)}</div>`;
  }
  html += `<div class="nft-leyenda">${leyenda(modo)}</div>`;
  html += `</div>`;
  return html;
}

// --- Formato lineal (Fig. 16.1/17.1; en lineal no se aplican sangrías) ---

function lineaHM(col, l, unidad) {
  const hm = l === "fr" ? col.hmFr || col.hmEn : col.hmEn;
  const metrica = `${fmtNum(col.res.porcion, l)}${NBSP}${unidad || "g"}`;
  return hm ? `${hm} (${metrica})` : metrica;
}

function construirLinealIdioma(R, lang, unidad) {
  const col = R.columnas[0];
  const filas = especFilas(R, "lineal");
  const partes = [];
  for (const f of filas) {
    if (f.tipo === "cal") {
      partes.push(`<b>Calories</b> ${textoCal(R, col, lang)}`);
      continue;
    }
    if (f.k === "trans") continue;
    const pct = f.pct ? col.res.pct[f.pct] : null;
    const p = pct == null ? "" : ` (${txtPct(pct, lang)})`;
    if (f.k === "sat") {
      const verTrans = filas.some((x) => x.k === "trans");
      const ns = lang === "fr" ? "Lipides saturés" : "Saturated Fat";
      const nt = lang === "fr" ? "trans" : "Trans Fat";
      partes.push(
        `<b>${ns}</b> ${celdaCant(col.res, f, lang)}${verTrans ? ` + <b>${nt}</b> ${txtCant(col.res.cant.trans, "g", lang)}` : ""}${p}`,
      );
      continue;
    }
    partes.push(
      `<b>${esc(lang === "fr" ? f.fr : f.en)}</b> ${celdaCant(col.res, f, lang)}${p}`,
    );
  }
  const ns = textoNoSignificativa(R, lang);
  const nota =
    lang === "fr" ? "% = % valeur quotidienne*" : "% = % Daily Value*";
  return `<p><b>${T[lang].titulo}</b> ${lang === "fr" ? "pour" : "per"} ${esc(lineaHM(col, lang, unidad))}${lang === "fr" ? " :" : ":"} ${partes.join(", ")}. ${nota}${ns ? " " + ns : ""} ${leyenda(lang)}</p>`;
}

// --- Punto de entrada ---

// config: { idioma: "en"|"fr"|"ambas"|"bilingue", formato: "tabla"|"lineal", unidad: "g"|"mL" }
function renderizarTabla(R, config) {
  const unidad = config.unidad || "g";
  const lineal = config.formato === "lineal";
  const unaTabla = (modo) =>
    lineal
      ? construirLinealWrap(R, modo, unidad)
      : tablaVertical(R, modo, unidad);
  if (config.idioma === "ambas")
    return [
      { id: "en", html: unaTabla("en") },
      { id: "fr", html: unaTabla("fr") },
    ];
  if (config.idioma === "bilingue") {
    if (lineal)
      return [
        { id: "en", html: unaTabla("en") },
        { id: "fr", html: unaTabla("fr") },
      ];
    return [{ id: "bilingue", html: unaTabla("bilingue") }];
  }
  return [{ id: config.idioma, html: unaTabla(config.idioma) }];
}

function construirLinealWrap(R, modo, unidad) {
  const lang = modo === "fr" ? "fr" : "en";
  return `<div class="nft nft-lineal nft-${modo}">${construirLinealIdioma(R, lang, unidad)}</div>`;
}

// --- Símbolo "High in" (Schedule K.1) ---

const LUPA_SVG =
  '<svg class="lupa" viewBox="0 0 40 40" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="#fff" stroke="#000" stroke-width="4"/><line x1="24" y1="24" x2="37" y2="37" stroke="#000" stroke-width="6" stroke-linecap="round"/></svg>';

// version 1-7 (superficie > 30 cm²): las tres barras, las que no alcanzan el umbral en blanco.
// version 8-13 (<= 30 cm²): solo las barras que alcanzan el umbral.
function renderizarSimbolo(sim, idioma) {
  if (!sim.version || !sim.disparados || !sim.disparados.length) return [];
  const vacias = sim.version <= 7;
  const modos = idioma === "ambas" ? ["en", "fr"] : [idioma];
  const TS = DTF.TEXTO_SIMBOLO;
  const nom = { sat: ["satFat"], sugars: ["sugars"], na: ["sodium"] };
  return modos.map((modo) => {
    const t = (k) => {
      const e = TS.en[nom[k][0]];
      const f = TS.fr[nom[k][0]];
      if (modo === "bilingue") return e === f ? e : `${e} / ${f}`;
      return modo === "fr" ? f : e;
    };
    const cab =
      modo === "bilingue"
        ? `${TS.en.cabecera} / ${TS.fr.cabecera}`
        : TS[modo].cabecera;
    const pie =
      modo === "bilingue" ? `${TS.en.pie} / ${TS.fr.pie}` : TS[modo].pie;
    const barras = ["sat", "sugars", "na"]
      .map((k) => {
        const on = sim.disparados.includes(k);
        if (!on && !vacias) return "";
        return `<div class="barra ${on ? "on" : "off"}">${on ? esc(t(k)) : "&nbsp;"}</div>`;
      })
      .join("");
    return {
      id: modo,
      html: `<div class="simbolo simbolo-${modo}">${LUPA_SVG}<div class="cuerpo"><div class="cab">${esc(cab)}</div>${barras}<div class="pie">${esc(pie)}</div></div></div>`,
    };
  });
}

const fmt = {
  renderizarTabla,
  renderizarSimbolo,
  especFilas,
  fmtNum,
  txtCant,
  txtPct,
  textoNoSignificativa,
  NBSP,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = fmt;
}
if (typeof window !== "undefined") {
  window.F = fmt;
}
