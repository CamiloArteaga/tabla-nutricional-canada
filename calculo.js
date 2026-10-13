// Tabla de información nutricional — Canadá.
// Base legal: Food and Drug Regulations (C.R.C., c. 870), Parte B, División 1:
// B.01.401 (Core Information), B.01.402 (Additional Information), B.01.403 y
// B.01.406, y B.01.350-352 (símbolo nutricional frontal). Table of Daily
// Values vigente al 20-oct-2022. Las tablas viven en datos.js.

const DT =
  typeof module !== "undefined" && module.exports
    ? require("./datos.js")
    : window.D;

// --- Utilidades numéricas ---

// Elimina el ruido de coma flotante (0.30000000000000004 -> 0.3).
function limpiar(x) {
  return Number(Number(x).toFixed(9));
}

// Múltiplo más cercano de `paso`; empate hacia arriba (la norma no fija el desempate).
function redondearPaso(valor, paso) {
  const n = Math.floor(valor / paso + 0.5 + 1e-9);
  return limpiar(n * paso);
}

// tramos: [[límite superior exclusivo, paso], ...]; paso 0 = se declara "0".
function aplicarTramos(valor, tramos, ceroPorClaim) {
  valor = limpiar(Math.max(valor, 0));
  for (let i = 0; i < tramos.length; i++) {
    const [limite, paso] = tramos[i];
    if (valor < limite) {
      if (paso === 0) return 0;
      if (i === 0 && ceroPorClaim) return 0;
      return redondearPaso(valor, paso);
    }
  }
  throw new Error("Tramos mal formados");
}

// B.01.401 ítem 1: porción métrica < 10 g/mL -> 0,1; >= 10 -> 1.
function redondearPorcion(valor) {
  return valor < 10 ? redondearPaso(valor, 0.1) : redondearPaso(valor, 1);
}

// B.01.402 ítem 1: porciones por envase (<2 -> 1; 2 a 5 -> 0,5; >5 -> 1);
// si se redondea, se antepone "about"/"environ".
function redondearPorEnvase(n) {
  const paso = n < 2 ? 1 : n <= 5 ? 0.5 : 1;
  const v = redondearPaso(n, paso);
  return { valor: v, aprox: Math.abs(v - n) > 1e-9 };
}

const num = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

// --- Declaraciones "free of" (Table of Permitted Nutrient Content Statements and Claims) ---
// Cada condición se evalúa por cantidad de referencia Y por porción declarada.

const CLAIMS = {
  energia: { ref: "ítem 1", es: "Libre de energía (< 5 Cal)" },
  grasa: { ref: "ítem 11", es: "Libre de grasa (< 0,5 g)" },
  sat: {
    ref: "ítem 18",
    es: "Libre de grasa saturada (< 0,2 g sat. y < 0,2 g trans)",
  },
  trans: {
    ref: "ítem 22",
    es: "Libre de grasa trans (< 0,2 g y cumple «bajo en saturadas»)",
  },
  chol: {
    ref: "ítem 27",
    es: "Libre de colesterol (< 2 mg y cumple «bajo en saturadas»)",
  },
  na: { ref: "ítem 31", es: "Libre de sodio o sal (< 5 mg)" },
};

// Valida cada declaración marcada contra los datos. Devuelve las vigentes y los
// motivos de las que no se cumplen (en ese caso se aplica el redondeo sin claim).
function validarClaims(comp, porcion, ra, marcadas) {
  const vigentes = {};
  const advertencias = [];
  const bases = [porcion];
  if (ra > 0) bases.push(ra);
  const cant = (k, g) => num(comp[k]) * (g / 100);
  const todas = (fn) => bases.every((g) => fn(g));
  const bajoSat = (g) => {
    const st = cant("sat", g) + cant("trans", g);
    const cal = cant("cal", g);
    return (
      st <= 2 + 1e-9 &&
      (cal === 0 ? st === 0 : ((st * 9) / cal) * 100 <= 15 + 1e-9)
    );
  };
  const reglas = {
    energia: (g) => cant("cal", g) < 5,
    grasa: (g) => cant("fat", g) < 0.5,
    sat: (g) => cant("sat", g) < 0.2 && cant("trans", g) < 0.2,
    trans: (g) => cant("trans", g) < 0.2 && bajoSat(g),
    chol: (g) => cant("chol", g) < 2 && bajoSat(g),
    na: (g) => cant("na", g) < 5,
  };
  for (const k of Object.keys(CLAIMS)) {
    if (!marcadas || !marcadas[k]) continue;
    if (todas(reglas[k])) vigentes[k] = true;
    else
      advertencias.push(
        `La declaración «${CLAIMS[k].es}» no se cumple con estos datos (por porción${ra > 0 ? " y por cantidad de referencia" : ""}); se redondea sin ella.`,
      );
  }
  if (marcadas && Object.keys(marcadas).some((k) => marcadas[k]) && !(ra > 0))
    advertencias.push(
      "Sin cantidad de referencia solo se validó la porción declarada; las declaraciones «free of» exigen cumplir también por cantidad de referencia.",
    );
  return { vigentes, advertencias };
}

// --- Redondeo de la Core Information ---

function redondearCore(k, crudo, claims) {
  const tramos = DT.TRAMOS_CORE[k];
  if (k === "chol") return claims.chol ? 0 : redondearPaso(crudo, 5);
  if (!tramos) throw new Error(`Nutriente sin regla de redondeo: ${k}`);
  const claimK = {
    cal: "energia",
    fat: "grasa",
    sat: "sat",
    trans: "trans",
    na: "na",
  }[k];
  return aplicarTramos(crudo, tramos, claimK ? !!claims[claimK] : false);
}

const MINERALES_PCT = new Set(["na", "pot", "ca", "fe"]); // B.01.401(1.2)
const GRASAS_ADICIONALES = ["poli", "omega6", "omega3", "mono"];

// Una columna de la tabla: cantidades redondeadas y %DV para una composición
// (por 100 g o 100 mL) y una porción métrica.
// o: { audiencia, claims (ya validadas), mostrarKJ }
function calcularColumna(comp, porcionValor, o = {}) {
  const audiencia = o.audiencia || "general";
  const claims = o.claims || {};
  const porcion = redondearPorcion(num(porcionValor));
  const f = porcion / 100;
  const crudo = {};
  const cant = {};
  const k100 = (k) => num(comp[k]);
  for (const it of DT.CORE_INFO) crudo[it.k] = limpiar(k100(it.k) * f);
  for (const def of DT.ADICIONALES) {
    if (def.k === "kJ")
      crudo.kJ = limpiar(
        comp.kJ != null && comp.kJ !== "" ? k100("kJ") * f : crudo.cal * 4.184,
      );
    else crudo[def.k] = limpiar(k100(def.k) * f);
  }
  // B.01.401 es la base; sat/trans antes que grasa porque la grasa "0" depende de ellas.
  for (const k of [
    "cal",
    "sat",
    "trans",
    "chol",
    "na",
    "cho",
    "fibre",
    "sugars",
    "prot",
    "pot",
    "ca",
    "fe",
  ])
    cant[k] = redondearCore(k, crudo[k], claims);
  for (const def of DT.ADICIONALES) {
    if (def.k === "kJ") cant.kJ = redondearPaso(crudo.kJ, 10);
    else cant[def.k] = aplicarTramos(crudo[def.k], def.tramos, false);
  }
  const otrasGrasas = GRASAS_ADICIONALES.some(
    (k) => (o.declaradas || []).includes(k) && cant[k] > 0,
  );
  const fatCero =
    claims.grasa && cant.sat === 0 && cant.trans === 0 && !otrasGrasas;
  cant.fat = aplicarTramos(crudo.fat, DT.TRAMOS_CORE.fat, fatCero);

  const sinPct = audiencia === "lactantes"; // B.01.403(2)
  const pct = {};
  const pctDe = (cantidadBase, vd, declarado) => {
    if (vd == null) return null;
    if (declarado === 0) return 0;
    return Math.round((cantidadBase / vd) * 100 + 1e-9);
  };
  const vd = (k) => DT.valorDiario(k, audiencia);
  pct.fat = sinPct ? null : pctDe(crudo.fat, vd("fat"), cant.fat);
  pct.satTrans = sinPct
    ? null
    : pctDe(
        crudo.sat + crudo.trans,
        vd("satTrans"),
        cant.sat === 0 && cant.trans === 0 ? 0 : 1,
      );
  pct.chol = sinPct ? null : pctDe(crudo.chol, vd("chol"), cant.chol);
  pct.fibre = sinPct ? null : pctDe(crudo.fibre, vd("fibre"), cant.fibre);
  pct.sugars = sinPct ? null : pctDe(crudo.sugars, vd("sugars"), cant.sugars);
  pct.na = sinPct ? null : pctDe(cant.na, vd("na"), cant.na);
  for (const k of ["pot", "ca", "fe"]) pct[k] = pctDe(cant[k], vd(k), cant[k]);
  for (const def of DT.ADICIONALES)
    if (def.dv) pct[def.k] = pctDe(cant[def.k], vd(def.dv), cant[def.k]);
  return { porcion, crudo, cant, pct };
}

// --- Tabla reducida (B.01.401(6), (6.1); B.01.403(5)) ---

const ITEMS_CERO = [
  "cal",
  "fat",
  "sat",
  "trans",
  "chol",
  "na",
  "cho",
  "fibre",
  "sugars",
  "prot",
  "pot",
  "ca",
  "fe",
];
const ITEMS_CERO_LACTANTES = [
  "cal",
  "fat",
  "na",
  "cho",
  "fibre",
  "sugars",
  "prot",
  "pot",
  "ca",
  "fe",
];
const OMISIBLES = [
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

function analizarReducida(res, o = {}) {
  const lactante = o.audiencia === "lactantes";
  const lista = lactante ? ITEMS_CERO_LACTANTES : ITEMS_CERO;
  const minimo = lactante ? 5 : 6;
  const ceros = lista.filter((k) => res.cant[k] === 0);
  const posible = ceros.length >= minimo;
  const forzadas = new Set(o.declaraciones || []); // nutrientes con declaración nutricional
  for (const k of o.anadidos || []) forzadas.add(k);
  const mostrar = new Set(["cal", "fat", "cho", "prot"]);
  for (const k of OMISIBLES)
    if (res.cant[k] > 0 || forzadas.has(k)) mostrar.add(k);
  if (mostrar.has("sat") || mostrar.has("trans") || (lactante && mostrar.has("chol"))) { // B.01.403(4)
    mostrar.add("sat");
    mostrar.add("trans");
  }
  const omitidos = OMISIBLES.filter((k) => !mostrar.has(k));
  return { posible, ceros, mostrar, omitidos, minimo };
}

// B.01.401(6.1): porción individual (no comida preempacada).
function analizarIndividual(res, o = {}) {
  const forzadas = new Set(o.declaraciones || []);
  for (const k of o.anadidos || []) forzadas.add(k);
  const mostrar = new Set(["cal", "fat", "cho", "prot"]);
  if (
    res.cant.sat > 0 ||
    res.cant.trans > 0 ||
    forzadas.has("sat") ||
    forzadas.has("trans")
  ) {
    mostrar.add("sat");
    mostrar.add("trans");
  }
  for (const k of ["na", "sugars"])
    if (res.cant[k] > 0 || forzadas.has(k)) mostrar.add(k);
  for (const k of ["chol", "fibre", "pot", "ca", "fe"])
    if (forzadas.has(k)) mostrar.add(k);
  return {
    posible: true,
    mostrar,
    omitidos: OMISIBLES.filter((k) => !mostrar.has(k)),
    individual: true,
  };
}

// --- Orquestación: una entrada completa -> columnas, avisos, reducida ---

// entrada:
//  audiencia: "general" | "ninos" | "lactantes"
//  porcion: { valor, unidad, hmEn, hmFr, individual, porEnvase }
//  composicion: nutrientes por 100 g/mL (núcleo y adicionales)
//  adicionales: claves de B.01.402 a declarar
//  claims: { energia, grasa, sat, trans, chol, na }
//  ra: cantidad de referencia (g/mL) | null
//  modo: "unica" | "preparado" | "alimentos" | "cantidades" | "cantidades-completas"
//  extras: según el modo (ver abajo)
function calcular(e) {
  const adv = [];
  const audiencia = e.audiencia || "general";
  const adicionales = (e.adicionales || []).filter((k) =>
    DT.ADICIONALES.some((a) => a.k === k),
  );
  const porcionValor = num(e.porcion && e.porcion.valor);
  if (!(porcionValor > 0))
    throw new Error("La porción debe ser mayor que cero");
  const { vigentes, advertencias } = validarClaims(
    e.composicion,
    porcionValor,
    num(e.ra),
    e.claims,
  );
  adv.push(...advertencias);
  const base = { audiencia, claims: vigentes, declaradas: adicionales };
  const principal = calcularColumna(e.composicion, porcionValor, base);
  const columnas = [
    {
      rotuloEn: (e.porcion && e.porcion.rotuloEn) || "",
      rotuloFr: (e.porcion && e.porcion.rotuloFr) || "",
      hmEn: (e.porcion && e.porcion.hmEn) || "",
      hmFr: (e.porcion && e.porcion.hmFr) || "",
      res: principal,
    },
  ];
  let modo = e.modo || "unica";
  if (audiencia === "lactantes" && modo === "preparado") {
    // B.01.406(6): la información «as prepared» no aplica a lactantes de 6 a < 12 meses.
    adv.push("B.01.406(6): la columna «preparado» no aplica a alimentos para lactantes de 6 a < 12 meses; se muestra una sola columna.");
    modo = "unica";
  }
  const extras = e.extras || [];
  for (const x of extras) {
    if (modo === "unica") break;
    const comp =
      modo === "preparado" || modo === "alimentos"
        ? x.composicion || e.composicion
        : e.composicion;
    const claimsX =
      modo === "preparado" || modo === "alimentos"
        ? validarClaims(comp, num(x.valor), num(e.ra), e.claims).vigentes
        : vigentes;
    columnas.push({
      rotuloEn: x.rotuloEn || "",
      rotuloFr: x.rotuloFr || "",
      hmEn: x.hmEn || "",
      hmFr: x.hmFr || "",
      res: calcularColumna(comp, num(x.valor), {
        audiencia,
        claims: claimsX,
        declaradas: adicionales,
      }),
    });
  }

  // B.01.402(3): omega-6, omega-3 y monoinsaturadas van juntas si se declara cualquiera de las cuatro.
  const grasasSel = GRASAS_ADICIONALES.filter((k) => adicionales.includes(k));
  if (
    grasasSel.length &&
    !["omega6", "omega3", "mono"].every((k) => adicionales.includes(k))
  )
    adv.push(
      "B.01.402(3): si se declara alguna grasa poliinsaturada, omega-6, omega-3 o monoinsaturada, deben declararse también omega-6, omega-3 y monoinsaturada.",
    );
  // B.01.402(6)(7): lo añadido debe declararse.
  for (const k of e.anadidos || [])
    if (DT.ADICIONALES.some((a) => a.k === k) && !adicionales.includes(k))
      adv.push(
        `B.01.402(6): «${DT.NOMBRE_ES[k]}» está marcado como añadido o ingrediente y debe declararse en la tabla.`,
      );

  let reducida = null;
  if (e.reducida === "simplificada") {
    reducida = analizarReducida(principal, {
      audiencia,
      declaraciones: e.declaraciones,
      anadidos: e.anadidos,
    });
    if (!reducida.posible) {
      adv.push(
        `La tabla simplificada exige que al menos ${reducida.minimo} de los nutrientes (${audiencia === "lactantes" ? "B.01.403(5)" : "B.01.401(6)"}) se declaren «0»; aquí solo ${reducida.ceros.length}. Se muestra la tabla completa.`,
      );
      reducida = null;
    }
  } else if (e.reducida === "individual") {
    reducida = analizarIndividual(principal, {
      declaraciones: e.declaraciones,
      anadidos: e.anadidos,
    });
    if (audiencia === "lactantes") {
      adv.push(
        "B.01.401(6.1) no aplica a alimentos para lactantes de 6 a < 12 meses; se muestra la tabla completa.",
      );
      reducida = null;
    }
  }
  const porEnvase =
    e.porcion && num(e.porcion.porEnvase) > 0
      ? redondearPorEnvase(num(e.porcion.porEnvase))
      : null;
  return {
    audiencia,
    modo,
    opciones: {
      mostrarKJ: !!e.mostrarKJ,
      mostrarPctChol: !!e.mostrarPctChol,
      omitirSatTransChol: !!e.omitirSatTransChol,
      otrosNutrientes: !!e.otrosNutrientes,
    },
    columnas,
    reducida,
    advertencias: adv,
    porEnvase,
    adicionales,
  };
}

// --- Símbolo nutricional frontal "High in" (B.01.350-352) ---

const NUTRIENTES_SIMBOLO = ["sat", "sugars", "na"];
const ETIQUETA_SIMBOLO = {
  sat: "Grasa saturada + trans",
  sugars: "Azúcares",
  na: "Sodio",
};

// Columna de umbral (porcentaje del VD) según B.01.350: RA > 30 -> 15; <= 30 -> 10;
// plato principal con RA >= 200 g (>= 170 g si es solo para niños de 1 a < 4 años) -> 30.
function umbralSimbolo(base, platoPrincipal, ninos) {
  if (platoPrincipal && base >= (ninos ? 170 : 200)) return 30;
  return base > 30 ? 15 : 10;
}

// Exención por ingredientes, por nutriente: B.01.350(6)-(12).
// ing: { fruta, coco, leche, huevo, frutosSecos, aceites, pescado, lacteos, cereales, legumbres, otros }
function exencionIngredientes(k, e, calcioOk, pctSatDeGrasa) {
  const ing = e.ingredientes || {};
  const anad = e.anadidos || {};
  const clave = { sat: "sat", sugars: "azucares", na: "na" }[k];
  const lacteo = e.tipoLacteo || "ninguno";
  const grasaOk = pctSatDeGrasa < 30;
  const fruta = ing.fruta && !ing.coco; // (10): el coco no es fruta
  const hay = Object.keys(ing).some((x) => ing[x] && x !== "coco");

  // (9), (11): queso, yogur (incluido bebible), kéfir o suero
  if (lacteo !== "ninguno") {
    if (k === "na") {
      if (lacteo === "queso" && calcioOk)
        return "B.01.350(11)+(12): queso con calcio suficiente";
    } else if (calcioOk) {
      if (
        k === "sat" &&
        !(ing.otros || ing.huevo || ing.coco || anad.sat) &&
        !((ing.frutosSecos || ing.aceites || ing.pescado) && !grasaOk)
      )
        return "B.01.350(9)+(12): queso o yogur con calcio suficiente y sin otros ingredientes con grasa saturada";
      if (
        k === "sugars" &&
        !(
          ing.otros ||
          ing.huevo ||
          ing.coco ||
          ing.aceites ||
          ing.pescado ||
          anad.azucares
        )
      )
        return "B.01.350(9)+(12): queso o yogur con calcio suficiente y sin otros ingredientes con azúcares";
    }
  }
  // Con queso o yogur rige (9)-(12); no se vuelve a la lista general (el yogur no está exento de sodio).
  if (lacteo !== "ninguno") return null;
  if (!hay || anad[clave] || ing.otros || ing.coco) return null; // (10): el coco no está en ninguna lista
  // (6)-(8): todos los ingredientes que aportan el nutriente deben estar en la lista
  const grasos = ing.frutosSecos || ing.aceites || ing.pescado;
  if (k === "sugars") {
    if (ing.huevo || ing.aceites || ing.pescado) return null;
    if (ing.frutosSecos && !grasaOk) return null;
    if (!(
      fruta ||
      ing.leche ||
      ing.frutosSecos ||
      ing.lacteos ||
      ing.cereales ||
      ing.legumbres
    ))
      return null;
    return "B.01.350(6)+(8): solo ingredientes de la lista (sin azúcares añadidos)";
  }
  if (ing.lacteos || ing.cereales || ing.legumbres) return null;
  if (grasos && !grasaOk) return null;
  if (!(fruta || ing.leche || ing.huevo || grasos)) return null;
  return `B.01.350(6)+(7): solo ingredientes de la lista (sin ${k === "sat" ? "grasa saturada" : "sodio"} añadido)`;
}

// e: { composicion, porcion, ra, audiencia, platoPrincipal, reconstituir, categoria,
//      superficieDisponible, superficiePrincipal, requiereNFT, tipoLacteo, ingredientes, anadidos }
function evaluarSimbolo(e) {
  const aud = e.audiencia || "general";
  const ninos = aud === "ninos";
  const cat =
    DT.CATEGORIAS_SIMBOLO.find((c) => c.id === (e.categoria || "ninguna")) ||
    DT.CATEGORIAS_SIMBOLO[0];
  const sd = num(e.superficieDisponible);
  const salida = {
    estado: "requerido",
    motivos: [],
    nutrientes: {},
    version: null,
    avisos: [],
  };

  // (15) prohibición: no es una exención, la etiqueta NO puede llevar el símbolo.
  if (aud === "lactantes") {
    salida.estado = "prohibido";
    salida.motivos.push(
      "B.01.350(15)(a): alimento solo para lactantes de 6 a < 12 meses",
    );
    return salida;
  }
  if (cat.tipo === "prohibido") {
    salida.estado = "prohibido";
    salida.motivos.push(`B.01.350${cat.ref}: ${cat.es}`);
    return salida;
  }
  // (5) exenciones totales
  if (cat.tipo === "exento") {
    salida.estado = "exento";
    salida.motivos.push(`B.01.350${cat.ref}: ${cat.es}`);
  }
  if (sd > 0 && sd < 15) {
    salida.estado = "exento";
    salida.motivos.push(
      "B.01.350(5)(b): superficie expuesta disponible < 15 cm²",
    );
  }
  // (13): exenciones condicionadas a que no se exija la tabla
  const exigeNFT = !!e.requiereNFT;
  if (salida.estado !== "exento") {
    const condAplica =
      cat.tipo === "cond" &&
      (cat.id !== "c_sticker" || (sd > 0 && sd < 200)) &&
      (cat.id !== "c_suplementado" || (sd > 0 && sd < 100));
    if (condAplica && cat.id === "c_suplementado") {
      salida.estado = "exento";
      salida.motivos.push(
        `B.01.350${cat.ref}: ${cat.es} (no se evaluó la excepción de B.29.018(2)(b))`,
      );
    } else if (condAplica && !exigeNFT) {
      salida.estado = "exento";
      salida.motivos.push(
        `B.01.350${cat.ref}: ${cat.es}, sin obligación de llevar la tabla`,
      );
    } else if (sd >= 15 && sd < 100 && !exigeNFT) {
      salida.estado = "exento";
      salida.motivos.push(
        "B.01.350(13)(h): superficie < 100 cm² y sin obligación de llevar la tabla",
      );
    } else if (cat.tipo === "cond" || (sd >= 15 && sd < 100)) {
      salida.avisos.push(
        "La exención de B.01.350(13) se pierde porque el producto debe llevar la tabla (B.01.401(3)); el símbolo es obligatorio si se alcanza el umbral.",
      );
    }
  }

  const comp = e.composicion || {};
  const porcion = num(e.porcion);
  const ra = num(e.ra) > 0 ? num(e.ra) : porcion;
  const g = (k, gramos) => num(comp[k]) * (gramos / 100);
  const cant = (k, gramos) =>
    k === "sat" ? g("sat", gramos) + g("trans", gramos) : g(k, gramos);
  const dvDe = (k) => DT.valorDiario(k === "sat" ? "satTrans" : k, aud);
  // (3)(4): reconstitución con RA solo del preparado -> porción declarada, ni "la mayor" ni RA.
  const gramosUsados = e.reconstituir ? [porcion] : [porcion, ra];
  const baseUmbral = e.reconstituir ? porcion : ra;
  const umbral = umbralSimbolo(baseUmbral, !!e.platoPrincipal, ninos);
  // (12): calcio por porción o por RA, la mayor; la clase se define por la RA.
  const calcioPct =
    (Math.max(g("ca", porcion), g("ca", ra)) / DT.valorDiario("ca", aud)) * 100;
  const calcioOk = calcioPct + 1e-9 >= (ra <= 30 ? 10 : 15);
  const grasaTotal = num(comp.fat);
  const pctSatDeGrasa =
    grasaTotal > 0 ? (num(comp.sat) / grasaTotal) * 100 : 100;

  const disparados = [];
  for (const k of NUTRIENTES_SIMBOLO) {
    const mayor = Math.max(...gramosUsados.map((x) => cant(k, x)));
    const pct = (mayor / dvDe(k)) * 100;
    const alcanza = pct + 1e-9 >= umbral;
    const exento = exencionIngredientes(k, e, calcioOk, pctSatDeGrasa);
    salida.nutrientes[k] = { pct: limpiar(pct), umbral, alcanza, exento };
    if (alcanza && !exento) disparados.push(k);
  }
  salida.calcio = { pct: limpiar(calcioPct), ok: calcioOk };
  if (salida.estado === "requerido") {
    if (disparados.length === 0) {
      salida.estado = "no-aplica";
      salida.motivos.push(
        "Ningún nutriente alcanza el umbral (o los que lo alcanzan están exentos)",
      );
    } else {
      salida.disparados = disparados;
      const pds = num(e.superficiePrincipal);
      const clave = disparados.join(",");
      salida.version =
        (pds > 0 && pds <= 30
          ? DT.VERSION_SIMBOLO.chica
          : DT.VERSION_SIMBOLO.grande)[clave] || null;
    }
  } else {
    salida.disparados = disparados; // lo que se habría exigido sin la exención
  }
  return salida;
}

// Tamaño del símbolo horizontal según el Directory of Nutrition Symbol Specifications.
function dimensionSimbolo(bilingue, pds, version) {
  if (!(pds > 0)) return null;
  const T = bilingue ? DT.DIM_SIMBOLO.bi : DT.DIM_SIMBOLO.uni;
  const peq = bilingue ? DT.DIM_SIMBOLO.biPeq : DT.DIM_SIMBOLO.uniPeq;
  let fila = null;
  if (pds > 30) {
    const r = T.find((x) => pds > x[0] && pds <= x[1]);
    if (r) fila = { ancho: r[2], alto: r[3], margen: r[4], lupa: r[5] };
  } else {
    const clave = version >= 11 ? 11 : version >= 8 ? 8 : 1;
    const r = peq[clave];
    fila = { ancho: r[0], alto: r[1], margen: r[2], lupa: r[3] };
  }
  return fila;
}

const api = {
  limpiar,
  redondearPaso,
  aplicarTramos,
  redondearPorcion,
  redondearPorEnvase,
  CLAIMS,
  validarClaims,
  redondearCore,
  calcularColumna,
  analizarReducida,
  analizarIndividual,
  calcular,
  umbralSimbolo,
  evaluarSimbolo,
  dimensionSimbolo,
  NUTRIENTES_SIMBOLO,
  ETIQUETA_SIMBOLO,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
if (typeof window !== "undefined") {
  window.C = api;
}
