// Tabla de información nutricional — Canadá (Standard Format, solo inglés)
// Base legal: Food and Drug Regulations (C.R.C., c. 870), Parte B, División 1,
// B.01.401 (Core Information) y B.01.350 (símbolo nutricional frontal).
// Table of Daily Values: documento incorporado por referencia, versión vigente
// 20 de octubre de 2022, obligatoria desde el 1 de enero de 2026.

// Valores diarios de referencia (adultos y niños >= 4 años), Parte 1.
const VALORES_DIARIOS = {
  fat: { valor: 75, unidad: "g", dvObligatorio: true },
  satTrans: { valor: 20, unidad: "g", dvObligatorio: true }, // suma sat+trans
  chol: { valor: 300, unidad: "mg", dvObligatorio: false }, // %DV voluntario
  na: { valor: 2300, unidad: "mg", dvObligatorio: true },
  fibre: { valor: 28, unidad: "g", dvObligatorio: true },
  sugars: { valor: 100, unidad: "g", dvObligatorio: true },
  pot: { valor: 3400, unidad: "mg", dvObligatorio: true },
  ca: { valor: 1300, unidad: "mg", dvObligatorio: true },
  fe: { valor: 18, unidad: "mg", dvObligatorio: true },
};

// Umbrales del símbolo para niños de 1 a 4 años (columna 2, más bajos que los
// de adultos en la Table of Daily Values de esa franja etaria); solo se
// necesitan aquí los tres nutrientes que evalúa el símbolo.
const VALORES_DIARIOS_NINOS = {
  satTrans: 20, // mismo valor, la reforma no lo cambia para este cálculo
  na: 1500,
  sugars: 60,
};

// B.01.401 "Core Information": 12 filas con nutriente propio en la NFT.
// unidad: la que se declara en la tabla. tieneDV: si lleva columna %DV.
const CORE_INFO = [
  { k: "cal", nombre: "Calories", unidad: "Cal", tieneDV: false },
  { k: "fat", nombre: "Fat", unidad: "g", tieneDV: true },
  { k: "sat", nombre: "Saturated Fat", unidad: "g", tieneDV: false },
  { k: "trans", nombre: "Trans Fat", unidad: "g", tieneDV: false },
  {
    k: "satTransDV",
    nombre: "Saturated + Trans Fat",
    unidad: "",
    tieneDV: true,
  }, // fila combinada, solo %DV
  { k: "chol", nombre: "Cholesterol", unidad: "mg", tieneDV: "opcional" },
  { k: "na", nombre: "Sodium", unidad: "mg", tieneDV: true },
  { k: "cho", nombre: "Carbohydrate", unidad: "g", tieneDV: false },
  { k: "fibre", nombre: "Fibre", unidad: "g", tieneDV: true },
  { k: "sugars", nombre: "Sugars", unidad: "g", tieneDV: true },
  { k: "prot", nombre: "Protein", unidad: "g", tieneDV: false },
  { k: "pot", nombre: "Potassium", unidad: "mg", tieneDV: true },
  { k: "ca", nombre: "Calcium", unidad: "mg", tieneDV: true },
  { k: "fe", nombre: "Iron", unidad: "mg", tieneDV: true },
];

// Redondeo a la unidad más cercana.
function redondearA(valor, unidad) {
  return Math.round(valor / unidad) * unidad;
}

// B.01.401: reglas de redondeo verbatim, una función por nutriente.
function redondear(k, valor) {
  if (valor < 0) valor = 0;
  switch (k) {
    case "cal":
      if (valor < 5) return redondearA(valor, 1);
      if (valor <= 50) return redondearA(valor, 5);
      return redondearA(valor, 10);
    case "fat":
    case "sat":
    case "trans":
      if (valor < 0.5) return 0;
      if (valor <= 5) return redondearA(valor, 0.5);
      return redondearA(valor, 1);
    case "chol":
      if (valor < 5) return 0;
      return redondearA(valor, 5);
    case "na":
      if (valor < 5) return redondearA(valor, 1);
      if (valor <= 140) return redondearA(valor, 5);
      return redondearA(valor, 10);
    case "cho":
    case "fibre":
    case "sugars":
      if (valor < 0.5) return 0;
      return redondearA(valor, 1);
    case "prot":
      if (valor < 0.5) return redondearA(valor, 0.1);
      return redondearA(valor, 1);
    case "pot":
    case "ca":
      if (valor < 5) return 0;
      if (valor <= 50) return redondearA(valor, 10);
      if (valor <= 250) return redondearA(valor, 25);
      return redondearA(valor, 50);
    case "fe":
      if (valor < 0.05) return 0;
      if (valor <= 0.5) return redondearA(valor, 0.1);
      if (valor <= 2.5) return redondearA(valor, 0.25);
      return redondearA(valor, 0.5);
    default:
      throw new Error(`Nutriente sin regla de redondeo: ${k}`);
  }
}

// %DV redondeado: 0 declarado -> 0%; si no, al 1% más cercano.
function redondearPorcentajeDV(cantidad, valorDiario) {
  if (cantidad <= 0) return 0;
  return Math.round((cantidad / valorDiario) * 100);
}

function calcularPorcentajeDV(k, cantidadPorPorcion) {
  const dv = VALORES_DIARIOS[k];
  if (!dv) throw new Error(`Sin valor diario para: ${k}`);
  return redondearPorcentajeDV(cantidadPorPorcion, dv.valor);
}

// valores100: { cal, fat, sat, trans, chol, na, cho, fibre, sugars, prot, pot, ca, fe }
// por 100 g o 100 mL. porcionG: tamaño de la porción declarada.
function calcular(valores100, porcionG) {
  const factor = porcionG / 100;
  const porPorcion = {};
  for (const k of Object.keys(valores100)) {
    porPorcion[k] = (valores100[k] || 0) * factor;
  }

  const declarado = {};
  for (const item of CORE_INFO) {
    if (item.k === "satTransDV") continue; // se calcula aparte, sin gramos propios
    declarado[item.k] = redondear(item.k, porPorcion[item.k] || 0);
  }

  const porcentajes = {
    fat: calcularPorcentajeDV("fat", porPorcion.fat || 0),
    na: calcularPorcentajeDV("na", porPorcion.na || 0),
    fibre: calcularPorcentajeDV("fibre", porPorcion.fibre || 0),
    sugars: calcularPorcentajeDV("sugars", porPorcion.sugars || 0),
    pot: calcularPorcentajeDV("pot", porPorcion.pot || 0),
    ca: calcularPorcentajeDV("ca", porPorcion.ca || 0),
    fe: calcularPorcentajeDV("fe", porPorcion.fe || 0),
    satTransDV: redondearPorcentajeDV(
      (porPorcion.sat || 0) + (porPorcion.trans || 0),
      VALORES_DIARIOS.satTrans.valor,
    ),
    chol: calcularPorcentajeDV("chol", porPorcion.chol || 0), // opcional, la UI decide si se muestra
  };

  return { declarado, porcentajes };
}

// --- Símbolo nutricional frontal "High in" (B.01.350) ---

// Umbral aplicable según la tabla de 6 casos de la guía (verbatim de B.01.350).
function umbralSimbolo(cantidadReferenciaG, esPlatoPrincipal, esNinos1a4) {
  if (esNinos1a4) {
    if (esPlatoPrincipal && cantidadReferenciaG >= 170) return 30;
    return cantidadReferenciaG > 30 ? 15 : 10;
  }
  if (esPlatoPrincipal && cantidadReferenciaG >= 200) return 30;
  return cantidadReferenciaG > 30 ? 15 : 10;
}

// Evalúa si un nutriente dispara el símbolo: %DV sobre la porción declarada
// O sobre la cantidad de referencia, el que sea mayor (B.01.350(2)).
function porcentajeParaSimbolo(
  k,
  valores100,
  porcionG,
  cantidadReferenciaG,
  esNinos1a4,
) {
  const dv =
    esNinos1a4 && k in VALORES_DIARIOS_NINOS
      ? VALORES_DIARIOS_NINOS[k]
      : k === "satTrans"
        ? VALORES_DIARIOS.satTrans.valor
        : VALORES_DIARIOS[k].valor;

  const porPorcion =
    k === "satTrans"
      ? ((valores100.sat || 0) + (valores100.trans || 0)) * (porcionG / 100)
      : (valores100[k] || 0) * (porcionG / 100);
  const porRA =
    k === "satTrans"
      ? ((valores100.sat || 0) + (valores100.trans || 0)) *
        (cantidadReferenciaG / 100)
      : (valores100[k] || 0) * (cantidadReferenciaG / 100);

  const mayor = Math.max(porPorcion, porRA);
  return (mayor / dv) * 100;
}

// opciones: { platoPrincipal, ninos1a4, envaseChico (superficie < 100 cm²),
//   frutaHortalizaSinAdicion, quesoOYogurConCalcioSuficiente, exentoPorCategoria }
function calcularSimbolo(
  valores100,
  porcionG,
  cantidadReferenciaG,
  opciones = {},
) {
  if (opciones.envaseChico || opciones.exentoPorCategoria) return new Set();
  if (opciones.frutaHortalizaSinAdicion) return new Set(); // B.01.350(10): coco no cuenta como fruta (a decidir en el checkbox del formulario)

  const umbral = umbralSimbolo(
    cantidadReferenciaG,
    !!opciones.platoPrincipal,
    !!opciones.ninos1a4,
  );

  const disparados = new Set();

  const excluirSatTrans = !!opciones.quesoOYogurConCalcioSuficiente; // exento de grasa sat.+azúcares (y sodio, checkbox aparte)
  const excluirSugars = !!opciones.quesoOYogurConCalcioSuficiente;
  const excluirSodium = !!opciones.quesoEsExentoDeSodio; // solo queso, no yogur

  if (!excluirSatTrans) {
    const pct = porcentajeParaSimbolo(
      "satTrans",
      valores100,
      porcionG,
      cantidadReferenciaG,
      opciones.ninos1a4,
    );
    if (pct >= umbral) disparados.add("satTrans");
  }
  if (!excluirSugars) {
    const pct = porcentajeParaSimbolo(
      "sugars",
      valores100,
      porcionG,
      cantidadReferenciaG,
      opciones.ninos1a4,
    );
    if (pct >= umbral) disparados.add("sugars");
  }
  if (!excluirSodium) {
    const pct = porcentajeParaSimbolo(
      "na",
      valores100,
      porcionG,
      cantidadReferenciaG,
      opciones.ninos1a4,
    );
    if (pct >= umbral) disparados.add("na");
  }

  return disparados;
}

const api = {
  VALORES_DIARIOS,
  VALORES_DIARIOS_NINOS,
  CORE_INFO,
  redondear,
  redondearPorcentajeDV,
  calcularPorcentajeDV,
  calcular,
  umbralSimbolo,
  calcularSimbolo,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = api;
}
if (typeof window !== "undefined") {
  window.C = api;
}
