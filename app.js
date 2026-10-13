// DOM: formulario en español, tabla y símbolo en EN/FR, persistencia.
// Los cálculos viven en calculo.js; el HTML de la tabla y del símbolo, en formatos.js.

const CLAVE_STORAGE = "tabla-nutricional-canada-v2";
const el = (id) => document.getElementById(id);

const NUCLEO = D.CORE_INFO;
const ADIC = D.ADICIONALES.filter((a) => a.k !== "kJ"); // el kJ se calcula
const OMISIBLES_UI = [
  "sat",
  "trans",
  "chol",
  "na",
  "fibre",
  "sugars",
  "pot",
  "ca",
  "fe",
];
const INGREDIENTES = [
  [
    "fruta",
    "Fruta u hortaliza entera o cortada (fresca, congelada, enlatada, seca)",
  ],
  ["coco", "…que es coco (no cuenta como fruta, B.01.350(10))"],
  ["leche", "Leche, líquida o en polvo"],
  ["huevo", "Huevo entero"],
  ["frutosSecos", "Frutos secos, semillas o sus mantequillas"],
  ["aceites", "Aceites vegetales o marinos"],
  ["pescado", "Productos acuáticos"],
  ["lacteos", "Otros lácteos (queso, yogur, crema…)"],
  ["cereales", "Cereales o granos"],
  ["legumbres", "Legumbres"],
  ["otros", "Cualquier otro ingrediente que aporte el nutriente"],
];
const ANADIDOS = [
  ["sat", "Grasa saturada"],
  ["na", "Sodio"],
  ["azucares", "Azúcares"],
];

function casilla(id, texto) {
  const l = document.createElement("label");
  l.className = "campo-casilla";
  l.innerHTML = `<input type="checkbox" id="${id}" /> ${texto}`;
  return l;
}

function campoNumero(id, texto) {
  const l = document.createElement("label");
  l.append(texto);
  const i = document.createElement("input");
  i.type = "number";
  i.step = "any";
  i.min = "0";
  i.id = id;
  l.appendChild(i);
  return l;
}

function construirComposicion(cont, prefijo, conAdicionales) {
  for (const it of NUCLEO)
    cont.appendChild(
      campoNumero(`${prefijo}n-${it.k}`, `${D.NOMBRE_ES[it.k]} (${it.unidad})`),
    );
  if (conAdicionales === "valores") {
    const det = document.createElement("details");
    det.innerHTML = "<summary>Información adicional</summary>";
    const g = document.createElement("div");
    g.className = "rejilla";
    for (const a of ADIC)
      g.appendChild(
        campoNumero(`${prefijo}a-${a.k}`, `${D.NOMBRE_ES[a.k]} (${a.unidad})`),
      );
    det.appendChild(g);
    cont.appendChild(det);
  }
}

function construirFormulario() {
  construirComposicion(el("campos-nutrientes"), "", false);
  const ca = el("campos-adicionales");
  for (const a of ADIC) {
    const fila = document.createElement("div");
    fila.className = "fila-adicional";
    fila.innerHTML = `<span>${D.NOMBRE_ES[a.k]} (${a.unidad})</span>
      <input type="number" step="any" min="0" id="a-${a.k}" />
      <label><input type="checkbox" id="ad-${a.k}" /> declarar</label>
      <label><input type="checkbox" id="an-${a.k}" /> añadido</label>`;
    ca.appendChild(fila);
  }
  const cc = el("campos-claims");
  for (const k of Object.keys(C.CLAIMS))
    cc.appendChild(casilla(`claim-${k}`, C.CLAIMS[k].es));
  const cd = el("campos-declaraciones");
  for (const k of OMISIBLES_UI)
    cd.appendChild(casilla(`decl-${k}`, D.NOMBRE_ES[k]));
  const ci = el("campos-ingredientes");
  for (const [k, t] of INGREDIENTES) ci.appendChild(casilla(`ing-${k}`, t));
  const cn = el("campos-anadidos");
  for (const [k, t] of ANADIDOS) cn.appendChild(casilla(`anad-${k}`, t));

  const sel = el("categoria");
  const grupos = {
    ninguna: null,
    prohibido: "Prohibido llevar el símbolo (15)",
    exento: "Exento (5)",
    cond: "Exento si no debe llevar la tabla (13)",
  };
  let og = null;
  for (const c of D.CATEGORIAS_SIMBOLO) {
    if (grupos[c.tipo] && (!og || og.label !== grupos[c.tipo])) {
      og = document.createElement("optgroup");
      og.label = grupos[c.tipo];
      sel.appendChild(og);
    }
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.ref ? `${c.ref} ${c.es}` : c.es;
    (c.tipo === "ninguna" ? sel : og).appendChild(o);
  }

  const ex = el("extras");
  for (let i = 1; i <= 3; i++) {
    const b = document.createElement("div");
    b.className = "bloque-extra";
    b.id = `bloque-x${i}`;
    b.hidden = true;
    b.innerHTML = `<h3 data-titulo></h3>
      <div class="fila-campos" data-rotulos>
        <label>Rótulo en inglés <input type="text" id="x${i}-rot-en" /></label>
        <label>Rótulo en francés <input type="text" id="x${i}-rot-fr" /></label>
      </div>
      <div class="fila-campos">
        <label>Cantidad en g o mL <input type="number" step="any" min="0" id="x${i}-valor" /></label>
        <label>Medida casera, inglés <input type="text" id="x${i}-hm-en" /></label>
        <label>Medida casera, francés <input type="text" id="x${i}-hm-fr" /></label>
      </div>
      <div data-comp><p class="ayuda">Composición por 100 g o 100 mL de este alimento:</p><div class="rejilla" id="x${i}-comp"></div></div>`;
    ex.appendChild(b);
    construirComposicion(el(`x${i}-comp`), `x${i}-`, "valores");
  }
}

function actualizarModo() {
  const modo = el("modo").value;
  const conComp = modo === "preparado" || modo === "alimentos";
  const cuantos = {
    unica: 0,
    preparado: 1,
    alimentos: 2,
    cantidades: 3,
    "cantidades-completas": 3,
  }[modo];
  const titulo = {
    preparado: () => "Alimento preparado",
    alimentos: (i) => `Alimento ${i + 1}`,
    cantidades: (i) => `Otra cantidad ${i}`,
    "cantidades-completas": (i) => `Otra cantidad ${i}`,
  }[modo];
  for (let i = 1; i <= 3; i++) {
    const b = el(`bloque-x${i}`);
    b.hidden = i > cuantos;
    if (i <= cuantos) {
      b.querySelector("[data-titulo]").textContent = titulo(
        modo === "alimentos" ? i : i,
      );
      b.querySelector("[data-rotulos]").hidden = modo !== "alimentos";
      b.querySelector("[data-comp]").hidden = !conComp;
    }
  }
  el("fila-omitir-lactantes").hidden = el("audiencia").value !== "lactantes";
}

// --- Lectura del formulario ---

const numero = (id) => {
  const v = parseFloat(el(id).value);
  return Number.isFinite(v) ? v : 0;
};
const marcado = (id) => el(id).checked;

function leerComposicion(prefijo, conAdicionales) {
  const c = {};
  for (const it of NUCLEO) c[it.k] = numero(`${prefijo}n-${it.k}`);
  if (conAdicionales)
    for (const a of ADIC) c[a.k] = numero(`${prefijo}a-${a.k}`);
  return c;
}

function leerEntrada() {
  const comp = leerComposicion("", false);
  const adicionales = [];
  const anadidos = [];
  for (const a of ADIC) {
    comp[a.k] = numero(`a-${a.k}`);
    if (marcado(`ad-${a.k}`)) adicionales.push(a.k);
    if (marcado(`an-${a.k}`)) anadidos.push(a.k);
  }
  const claims = {};
  for (const k of Object.keys(C.CLAIMS)) claims[k] = marcado(`claim-${k}`);
  const declaraciones = OMISIBLES_UI.filter((k) => marcado(`decl-${k}`));
  const modo = el("modo").value;
  const extras = [];
  const cuantos = {
    unica: 0,
    preparado: 1,
    alimentos: 2,
    cantidades: 3,
    "cantidades-completas": 3,
  }[modo];
  for (let i = 1; i <= cuantos; i++) {
    const x = {
      valor: numero(`x${i}-valor`),
      hmEn: el(`x${i}-hm-en`).value,
      hmFr: el(`x${i}-hm-fr`).value,
      rotuloEn: el(`x${i}-rot-en`).value,
      rotuloFr: el(`x${i}-rot-fr`).value,
    };
    if (modo === "preparado" || modo === "alimentos")
      x.composicion = leerComposicion(`x${i}-`, true);
    extras.push(x);
  }
  return {
    audiencia: el("audiencia").value,
    porcion: {
      valor: numero("porcion-valor"),
      unidad: el("porcion-unidad").value,
      hmEn: el("hm-en").value,
      hmFr: el("hm-fr").value,
      individual: marcado("porcion-individual"),
      porEnvase: numero("por-envase"),
    },
    composicion: comp,
    adicionales,
    anadidos,
    claims,
    declaraciones,
    ra: numero("cantidad-referencia"),
    mostrarKJ: marcado("mostrar-kj"),
    mostrarPctChol: marcado("mostrar-pct-chol"),
    omitirSatTransChol: marcado("omitir-sat-trans-chol"),
    otrosNutrientes: marcado("otros-nutrientes"),
    reducida: el("reducida").value,
    modo,
    extras,
  };
}

function leerEntradaSimbolo(e) {
  const ingredientes = {};
  for (const [k] of INGREDIENTES) ingredientes[k] = marcado(`ing-${k}`);
  const anadidos = {};
  for (const [k] of ANADIDOS) anadidos[k] = marcado(`anad-${k}`);
  return {
    composicion: e.composicion,
    porcion: e.porcion.valor,
    ra: e.ra,
    audiencia: e.audiencia,
    platoPrincipal: marcado("plato-principal"),
    reconstituir: marcado("reconstituir"),
    categoria: el("categoria").value,
    superficieDisponible: numero("superficie-disponible"),
    superficiePrincipal: numero("superficie-principal"),
    requiereNFT:
      marcado("requiere-nft") ||
      e.anadidos.length > 0 ||
      e.declaraciones.length > 0,
    tipoLacteo: el("tipo-lacteo").value,
    ingredientes,
    anadidos,
  };
}

// --- Salida ---

function bloque(id, titulo, html) {
  return `<section class="bloque-salida"><div class="bloque-cab"><h3>${titulo}</h3><button type="button" class="btn-png" data-captura="${id}">Descargar PNG</button></div><div class="captura" id="${id}">${html}</div></section>`;
}

function pintarAvisos(lista) {
  el("avisos").innerHTML = lista.length
    ? `<ul class="avisos">${lista.map((a) => `<li>${a}</li>`).join("")}</ul>`
    : "";
}

const NOMBRE_ESTADO = {
  requerido: "El símbolo es obligatorio",
  "no-aplica": "No se requiere el símbolo",
  exento: "Producto exento del símbolo",
  prohibido: "La etiqueta NO puede llevar el símbolo",
};

function pintarSimbolo(sim, e, idioma) {
  let h = `<h2>Símbolo «High in»</h2><p class="estado estado-${sim.estado}">${NOMBRE_ESTADO[sim.estado]}</p>`;
  if (sim.motivos.length)
    h += `<ul>${sim.motivos.map((m) => `<li>${m}</li>`).join("")}</ul>`;
  if (sim.avisos.length)
    h += `<ul class="avisos">${sim.avisos.map((m) => `<li>${m}</li>`).join("")}</ul>`;
  if (sim.estado !== "prohibido") {
    h += `<table class="tabla-simbolo"><tr><th>Nutriente</th><th>% VD (la mayor de porción y RA)</th><th>Umbral</th><th>Resultado</th></tr>`;
    for (const k of C.NUTRIENTES_SIMBOLO) {
      const n = sim.nutrientes[k];
      const r = n.alcanza
        ? n.exento
          ? `Alcanza, pero exento: ${n.exento}`
          : "Alcanza el umbral"
        : "No alcanza";
      h += `<tr><td>${C.ETIQUETA_SIMBOLO[k]}</td><td>${n.pct.toFixed(1)} %</td><td>≥ ${n.umbral} %</td><td>${r}</td></tr>`;
    }
    h += `</table>`;
  }
  if (sim.estado === "requerido") {
    const bilingue = idioma === "bilingue";
    h += `<p>Versión ${sim.version} del Schedule K.1 (B.01.352), formato horizontal.</p>`;
    const dim = C.dimensionSimbolo(
      bilingue,
      numero("superficie-principal"),
      sim.version,
    );
    if (dim)
      h += `<p>Tamaño mínimo según el Directory of Nutrition Symbol Specifications: ${dim.ancho} × ${dim.alto} cm, margen de resguardo de ${dim.margen} mm.</p>`;
    else
      h += `<p class="ayuda">Indique la superficie principal de exhibición para ver el tamaño y la versión exacta.</p>`;
    const piezas = F.renderizarSimbolo(sim, idioma);
    h += piezas
      .map((p) => bloque(`simbolo-${p.id}`, `Símbolo (${p.id})`, p.html))
      .join("");
    if (idioma === "en" || idioma === "fr")
      h += `<p class="ayuda">Un solo idioma solo es válido si B.01.012(3) o (7) lo permiten (B.01.351(4)); si no, use las dos versiones o la bilingüe.</p>`;
  }
  el("salida-simbolo").innerHTML = h;
}

function recalcular() {
  actualizarModo();
  const e = leerEntrada();
  const avisos = [];
  if (!(e.porcion.valor > 0)) {
    el("salida-tablas").innerHTML =
      `<p class="ayuda">Ingrese la porción en g o mL para generar la tabla.</p>`;
    el("salida-simbolo").innerHTML = "";
    pintarAvisos([]);
    guardar();
    return;
  }
  try {
    const R = C.calcular(e);
    avisos.push(...R.advertencias);
    const idioma = el("idioma").value;
    const piezas = F.renderizarTabla(R, {
      idioma,
      formato: el("presentacion").value,
      unidad: e.porcion.unidad,
    });
    const nombre = {
      en: "Nutrition Facts (inglés)",
      fr: "Valeur nutritive (francés)",
      bilingue: "Tabla bilingüe",
    };
    el("salida-tablas").innerHTML = piezas
      .map((p) => bloque(`tabla-${p.id}`, nombre[p.id], p.html))
      .join("");
    if (idioma === "en" || idioma === "fr")
      avisos.push(
        "Una tabla en un solo idioma solo es válida si B.01.012(3) o (7) lo permiten (B.01.451(2)).",
      );
    if (!(e.ra > 0))
      avisos.push(
        "Sin cantidad de referencia (RA) el símbolo se evalúa solo con la porción declarada.",
      );
    pintarSimbolo(C.evaluarSimbolo(leerEntradaSimbolo(e)), e, idioma);
  } catch (err) {
    el("salida-tablas").innerHTML = "";
    avisos.push(`No se pudo calcular: ${err.message}`);
  }
  pintarAvisos(avisos);
  guardar();
}

// --- Persistencia ---

function guardar() {
  const estado = {};
  for (const x of el("form-nutrientes").querySelectorAll(
    "input[id],select[id]",
  ))
    estado[x.id] = x.type === "checkbox" ? x.checked : x.value;
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  } catch (err) {
    // localStorage puede fallar (ventana privada, almacenamiento bloqueado); no es crítico.
  }
}

function aplicarEstado(estado) {
  for (const [id, v] of Object.entries(estado)) {
    const x = el(id);
    if (!x) continue;
    if (x.type === "checkbox") x.checked = !!v;
    else x.value = v;
  }
}

function restaurar() {
  try {
    const estado = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
    if (estado) aplicarEstado(estado);
  } catch (err) {
    // Estado ilegible: se ignora y se parte del formulario vacío.
  }
}

function vaciarFormulario() {
  for (const x of el("form-nutrientes").querySelectorAll(
    "input[id],select[id]",
  )) {
    if (x.type === "checkbox") x.checked = false;
    else if (x.tagName === "SELECT") x.selectedIndex = 0;
    else x.value = "";
  }
  recalcular();
}

const EJEMPLO = {
  producto: "Yogur con fruta",
  "porcion-valor": 175,
  "hm-en": "3/4 cup",
  "hm-fr": "3/4 tasse",
  "cantidad-referencia": 175,
  "por-envase": 1,
  "n-cal": 95,
  "n-fat": 2.5,
  "n-sat": 1.6,
  "n-trans": 0.1,
  "n-chol": 10,
  "n-na": 45,
  "n-cho": 14,
  "n-fibre": 0.3,
  "n-sugars": 12,
  "n-prot": 4,
  "n-pot": 180,
  "n-ca": 120,
  "n-fe": 0.1,
  "a-vitD": 0.1,
  "ad-vitD": true,
  "tipo-lacteo": "yogur",
  "ing-leche": true,
  "ing-fruta": true,
  "superficie-principal": 120,
  "superficie-disponible": 250,
};

document.addEventListener("DOMContentLoaded", () => {
  construirFormulario();
  restaurar();
  recalcular();
  const form = el("form-nutrientes");
  form.addEventListener("input", recalcular);
  form.addEventListener("change", recalcular);
  el("btn-ejemplo").addEventListener("click", () => {
    vaciarFormulario();
    aplicarEstado(EJEMPLO);
    recalcular();
  });
  el("btn-limpiar").addEventListener("click", vaciarFormulario);
  document.body.addEventListener("click", (ev) => {
    const b = ev.target.closest(".btn-png");
    if (!b) return;
    const nodo = el(b.dataset.captura);
    html2canvas(nodo, { backgroundColor: "#ffffff", scale: 2 }).then(
      (canvas) => {
        const a = document.createElement("a");
        a.download = `${b.dataset.captura}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      },
    );
  });
});
