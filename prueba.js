// Pruebas de datos.js, calculo.js y formatos.js — sin framework, node prueba.js
// Los valores esperados se derivaron a mano del texto de B.01.401, B.01.402,
// B.01.350 y de la Table of Daily Values, no de la salida del código.
const C = require("./calculo.js");
const D = require("./datos.js");
const F = require("./formatos.js");

let fallos = 0;
function verificar(descripcion, obtenido, esperado) {
  const ok = JSON.stringify(obtenido) === JSON.stringify(esperado);
  if (!ok) {
    fallos++;
    console.log(`FALLO: ${descripcion}`);
    console.log(
      `  esperado ${JSON.stringify(esperado)}, obtenido ${JSON.stringify(obtenido)}`,
    );
  } else {
    console.log(`ok: ${descripcion}`);
  }
}
const cierto = (d, v) => verificar(d, !!v, true);

const rc = (k, v, claims = {}) => C.redondearCore(k, v, claims);
const col = (comp, porcion, o = {}) => C.calcularColumna(comp, porcion, o);

// --- B.01.401: redondeo de cantidades ---
verificar("calorías < 5 -> múltiplo de 1", rc("cal", 4.4), 4);
verificar(
  "calorías < 5 con «free of energy» -> 0",
  rc("cal", 3, { energia: true }),
  0,
);
verificar("calorías 5 a 50 -> múltiplo de 5", rc("cal", 23), 25);
verificar("calorías 50 incluido en el tramo de 5", rc("cal", 50), 50);
verificar("calorías > 50 -> múltiplo de 10", rc("cal", 96), 100);
verificar("calorías empate hacia arriba (55 -> 60)", rc("cal", 55), 60);

verificar(
  "grasa 0,4 g sin claim -> 0,4 (D1: no se redondea a 0)",
  rc("fat", 0.4),
  0.4,
);
verificar("grasa 0,04 g -> 0 por redondeo a 0,1", rc("fat", 0.04), 0);
verificar("grasa 2,2 g -> 2", rc("fat", 2.2), 2);
verificar("grasa 2,3 g -> 2,5", rc("fat", 2.3), 2.5);
verificar("grasa > 5 g -> múltiplo de 1", rc("fat", 5.6), 6);
verificar("saturadas 0,3 g sin claim -> 0,3", rc("sat", 0.3), 0.3);
verificar(
  "trans 0,15 g con «free of trans» -> 0",
  rc("trans", 0.15, { trans: true }),
  0,
);

verificar("colesterol 2,4 mg -> 0 (múltiplo de 5)", rc("chol", 2.4), 0);
verificar("colesterol 3 mg -> 5 (D2: no existe «< 5 -> 0»)", rc("chol", 3), 5);
verificar("colesterol 4 mg -> 5", rc("chol", 4), 5);
verificar("colesterol 23 mg -> 25", rc("chol", 23), 25);
verificar(
  "colesterol 3 mg con «free of cholesterol» -> 0",
  rc("chol", 3, { chol: true }),
  0,
);

verificar("sodio 3,4 mg -> 3", rc("na", 3.4), 3);
verificar(
  "sodio 3,4 mg con «free of sodium» -> 0",
  rc("na", 3.4, { na: true }),
  0,
);
verificar("sodio 5 a 140 -> múltiplo de 5", rc("na", 23), 25);
verificar("sodio 142 -> 140", rc("na", 142), 140);
verificar("sodio 146 -> 150", rc("na", 146), 150);

verificar("carbohidrato 0,4 g -> 0", rc("cho", 0.4), 0);
verificar("fibra 0,5 g -> 1", rc("fibre", 0.5), 1);
verificar("azúcares 2,4 g -> 2", rc("sugars", 2.4), 2);
verificar("proteína 0,3 g -> 0,3", rc("prot", 0.3), 0.3);
verificar("proteína 0,46 g -> 0,5", rc("prot", 0.46), 0.5);
verificar("proteína 3,4 g -> 3", rc("prot", 3.4), 3);

verificar("potasio 4,9 mg -> 0", rc("pot", 4.9), 0);
verificar("potasio 7 mg -> 10", rc("pot", 7), 10);
verificar("calcio 52 mg -> 50", rc("ca", 52), 50);
verificar("calcio 63 mg -> 75", rc("ca", 63), 75);
verificar("calcio 260 mg -> 250", rc("ca", 260), 250);
verificar("calcio 280 mg -> 300", rc("ca", 280), 300);
verificar("hierro 0,04 mg -> 0", rc("fe", 0.04), 0);
verificar(
  "hierro 0,3 mg -> 0,3 (D10: sin ruido de coma flotante)",
  rc("fe", 0.3),
  0.3,
);
verificar("hierro 0,8 mg -> 0,75", rc("fe", 0.8), 0.75);
verificar("hierro 2,6 mg -> 2,5", rc("fe", 2.6), 2.5);
verificar("hierro 2,8 mg -> 3", rc("fe", 2.8), 3);

verificar("porción 9,94 -> 9,9", C.redondearPorcion(9.94), 9.9);
verificar("porción 9,96 -> 10", C.redondearPorcion(9.96), 10);
verificar("porción 10,4 -> 10", C.redondearPorcion(10.4), 10);
verificar("porción 250,5 -> 251", C.redondearPorcion(250.5), 251);
verificar(
  "porciones por envase 1,4 -> 1 con «about»",
  C.redondearPorEnvase(1.4),
  { valor: 1, aprox: true },
);
verificar(
  "porciones por envase 2,2 -> 2 con «about»",
  C.redondearPorEnvase(2.2),
  { valor: 2, aprox: true },
);
verificar(
  "porciones por envase 2,5 -> 2,5 sin «about»",
  C.redondearPorEnvase(2.5),
  { valor: 2.5, aprox: false },
);
verificar("porciones por envase 5,8 -> 6", C.redondearPorEnvase(5.8), {
  valor: 6,
  aprox: true,
});

// --- B.01.402: información adicional ---
const ad = (k, v) => {
  const def = D.ADICIONALES.find((a) => a.k === k);
  return C.aplicarTramos(v, def.tramos, false);
};
verificar("vitamina C 0,42 mg -> 0,4", ad("vitC", 0.42), 0.4);
verificar("vitamina C 3,3 mg -> 3,5", ad("vitC", 3.3), 3.5);
verificar("vitamina C 7,4 mg -> 7", ad("vitC", 7.4), 7);
verificar("vitamina A 4 µg -> 0", ad("vitA", 4), 0);
verificar("vitamina A 63 µg -> 50", ad("vitA", 63), 50);
verificar("vitamina A 280 µg -> 300", ad("vitA", 280), 300);
verificar("folato 0,8 µg -> 0", ad("folato", 0.8), 0);
verificar("folato 7 µg -> 8", ad("folato", 7), 8);
verificar("zinc 0,04 mg -> 0", ad("zinc", 0.04), 0);
verificar("cobre 0,02 mg -> 0,02", ad("cobre", 0.02), 0.02);
verificar("poliinsaturadas 0,96 g -> 1", ad("poli", 0.96), 1);
verificar("poliinsaturadas 3,2 g -> 3", ad("poli", 3.2), 3);
verificar("poliinsaturadas 6,4 g -> 6", ad("poli", 6.4), 6);
verificar("fibra soluble 0,4 g -> 0", ad("fibreSol", 0.4), 0);
verificar(
  "cada ítem con VD de B.01.402 tiene su valor diario",
  D.ADICIONALES.filter((a) => a.dv).every((a) => D.VD_PARTE2[a.dv]),
  true,
);
verificar(
  "kJ por porción: 100 Cal -> 420 kJ",
  col({ cal: 100 }, 100).cant.kJ,
  420,
);

// --- %DV: reglas de B.01.401 ---
const c1 = col(
  {
    cal: 120,
    fat: 0.4,
    sat: 0.2,
    trans: 0.2,
    chol: 3,
    na: 34,
    fibre: 0.4,
    ca: 6,
  },
  100,
);
verificar("D3: grasa 0,4 g -> 1 %", c1.pct.fat, 1);
verificar(
  "D3: fibra declarada 0 g -> 0 %",
  [c1.cant.fibre, c1.pct.fibre],
  [0, 0],
);
verificar("saturadas 0,2 + trans 0,2 declaradas -> 2 %", c1.pct.satTrans, 2);
verificar("colesterol 3 mg se declara 5 mg -> %VD 1", c1.pct.chol, 1);
verificar(
  "D4: sodio 34 mg se declara 35 mg -> %VD sobre lo redondeado = 2",
  [c1.cant.na, c1.pct.na],
  [35, 2],
);
verificar(
  "D4: calcio 6 mg se declara 10 mg -> %VD = 1",
  [c1.cant.ca, c1.pct.ca],
  [10, 1],
);
const c0 = col({ cal: 0, fat: 0.02, sat: 0.01, trans: 0, na: 2 }, 100, {
  claims: { na: true },
});
verificar(
  "cantidades declaradas 0 -> 0 % (grasa, sat+trans, sodio con claim)",
  [c0.pct.fat, c0.pct.satTrans, c0.pct.na],
  [0, 0, 0],
);
const cg = col({ fat: 0.4, sat: 0, trans: 0 }, 100, {
  claims: { grasa: true },
});
verificar(
  "«free of fat» con sat y trans en 0 -> grasa 0 g y 0 %",
  [cg.cant.fat, cg.pct.fat],
  [0, 0],
);
const cg2 = col({ fat: 0.4, sat: 0.3, trans: 0 }, 100, {
  claims: { grasa: true },
});
verificar(
  "«free of fat» con saturadas 0,3 g declaradas -> grasa 0,4 g",
  cg2.cant.fat,
  0.4,
);
const cg3 = col({ fat: 0.4, poli: 0.4 }, 100, {
  claims: { grasa: true },
  declaradas: ["poli"],
});
verificar(
  "«free of fat» con otra grasa declarada > 0 -> grasa 0,4 g",
  cg3.cant.fat,
  0.4,
);
verificar(
  "sat+trans: base cruda, no suma de redondeos (0,24 + 0,24 -> 2 %)",
  col({ sat: 0.24, trans: 0.24 }, 100).pct.satTrans,
  2,
);

// --- Valores diarios por destinatario (B.01.001.1(2)) ---
verificar("VD grasa general", D.valorDiario("fat", "general"), 75);
verificar("VD grasa niños 1 a < 4", D.valorDiario("fat", "ninos"), 44);
verificar("D5: VD sat+trans niños", D.valorDiario("satTrans", "ninos"), 10);
verificar("D5: VD sodio niños", D.valorDiario("na", "ninos"), 1200);
verificar("D5: VD azúcares niños", D.valorDiario("sugars", "ninos"), 50);
verificar("VD fibra niños", D.valorDiario("fibre", "ninos"), 14);
verificar(
  "VD calcio niños (Parte 2, col. 3)",
  D.valorDiario("ca", "ninos"),
  700,
);
verificar("VD calcio general", D.valorDiario("ca", "general"), 1300);
verificar(
  "VD calcio lactantes (Parte 2, col. 2)",
  D.valorDiario("ca", "lactantes"),
  260,
);
verificar(
  "VD grasa lactantes: no existe",
  D.valorDiario("fat", "lactantes"),
  null,
);
verificar("VD hierro general", D.valorDiario("fe", "general"), 18);
verificar("VD cloruro general", D.valorDiario("cloruro", "general"), 2300);
verificar(
  "D6: grasa 8 g, adulto -> 11 %",
  col({ fat: 8 }, 100, { audiencia: "general" }).pct.fat,
  11,
);
verificar(
  "D6: grasa 8 g, niño 1 a < 4 -> 18 %",
  col({ fat: 8 }, 100, { audiencia: "ninos" }).pct.fat,
  18,
);
const cl = col({ fat: 8, na: 100, pot: 300, ca: 130, fe: 1 }, 100, {
  audiencia: "lactantes",
});
verificar(
  "D13: lactantes sin %VD de grasa, sodio y sat+trans (B.01.403(2))",
  [
    cl.pct.fat,
    cl.pct.na,
    cl.pct.satTrans,
    cl.pct.chol,
    cl.pct.fibre,
    cl.pct.sugars,
  ],
  [null, null, null, null, null, null],
);
verificar(
  "lactantes: potasio y calcio sí llevan %VD (Parte 2, col. 2; calcio sobre 125 mg redondeados)",
  [cl.pct.pot, cl.pct.ca],
  [35, 48],
);

// --- «Free of»: validación contra los datos ---
const v1 = C.validarClaims({ cal: 10 }, 100, 100, { energia: true });
verificar(
  "«free of energy» con 10 Cal: no vigente y avisa",
  [v1.vigentes.energia || false, v1.advertencias.length],
  [false, 1],
);
const v2 = C.validarClaims({ na: 40 }, 10, 50, { na: true });
verificar(
  "«free of sodium» válido por porción pero no por RA: no vigente",
  v2.vigentes.na || false,
  false,
);
const v3 = C.validarClaims({ na: 40 }, 10, 10, { na: true });
verificar(
  "«free of sodium» 4 mg por porción y por RA: vigente",
  v3.vigentes.na,
  true,
);
const v4 = C.validarClaims(
  { cal: 200, fat: 0, sat: 0, trans: 0.1, chol: 1 },
  30,
  30,
  { trans: true, chol: true },
);
verificar(
  "«free of trans/cholesterol»: exige además «bajo en saturadas»",
  [v4.vigentes.trans, v4.vigentes.chol],
  [true, true],
);
const v5 = C.validarClaims({ cal: 100, sat: 4, trans: 0.1 }, 100, 100, {
  trans: true,
});
verificar(
  "«free of trans» con 4 g de saturadas por RA: no vigente",
  v5.vigentes.trans || false,
  false,
);

// --- Tabla reducida ---
const todoCero = col(
  {
    cal: 0,
    fat: 0,
    sat: 0,
    trans: 0,
    chol: 0,
    na: 0,
    cho: 0,
    fibre: 0,
    sugars: 0,
    prot: 0,
    pot: 0,
    ca: 0,
    fe: 0,
  },
  100,
);
const rA = C.analizarReducida(todoCero, { audiencia: "general" });
verificar(
  "todo en 0: tabla simplificada posible, 13 ceros",
  [rA.posible, rA.ceros.length],
  [true, 13],
);
verificar(
  "todo en 0: se omiten todos los ítems omisibles",
  rA.omitidos.length,
  9,
);
const cinco = col(
  {
    cal: 100,
    fat: 5,
    cho: 20,
    prot: 5,
    sat: 0,
    trans: 0,
    chol: 0,
    na: 0,
    fibre: 0,
    sugars: 0,
    pot: 0,
    ca: 0,
    fe: 0,
  },
  100,
);
verificar(
  "cinco ceros contados: 9 ceros (sat, trans, chol, na, fibra, azúcares, K, Ca, Fe)",
  C.analizarReducida(cinco, { audiencia: "general" }).ceros.length,
  9,
);
const pocos = col(
  {
    cal: 100,
    fat: 5,
    sat: 2,
    trans: 0,
    chol: 10,
    na: 200,
    cho: 20,
    fibre: 2,
    sugars: 8,
    prot: 5,
    pot: 300,
    ca: 100,
    fe: 1,
  },
  100,
);
verificar(
  "sin ceros suficientes: simplificada no posible",
  C.analizarReducida(pocos, { audiencia: "general" }).posible,
  false,
);
const seis = col(
  {
    cal: 100,
    fat: 5,
    cho: 20,
    prot: 5,
    na: 200,
    fibre: 2,
    sugars: 8,
    sat: 0,
    trans: 0,
    chol: 0,
    pot: 0,
    ca: 0,
    fe: 0,
  },
  100,
);
const rS = C.analizarReducida(seis, { audiencia: "general" });
verificar(
  "seis ceros: posible; se conservan sodio, fibra y azúcares; se omiten los demás",
  [rS.posible, rS.omitidos.join(",")],
  [true, "sat,trans,chol,pot,ca,fe"],
);
const rI = C.analizarReducida(
  col(
    {
      cal: 100,
      fat: 5,
      cho: 20,
      prot: 5,
      na: 0,
      fibre: 0,
      sugars: 0,
      pot: 0,
      ca: 0,
      fe: 0,
    },
    100,
  ),
  { audiencia: "lactantes" },
);
verificar(
  "lactantes: basta con 5 ceros de 10 (B.01.403(5))",
  [rI.posible, rI.minimo],
  [true, 5],
);

// --- calcular: orquestación y avisos ---
const base = {
  audiencia: "general",
  porcion: { valor: 100 },
  composicion: { cal: 100, fat: 5, cho: 20, prot: 5, na: 200, vitC: 10, sat: 2, trans: 0.5, chol: 10, fibre: 2, sugars: 8, pot: 300, ca: 100, fe: 1 },
};
const r1 = C.calcular({ ...base, adicionales: ["omega3"] });
cierto(
  "omega-3 sin omega-6 ni monoinsaturadas: avisa (B.01.402(3))",
  r1.advertencias.some((a) => a.includes("B.01.402(3)")),
);
const r2 = C.calcular({ ...base, anadidos: ["vitC"], adicionales: [] });
cierto(
  "vitamina C añadida y no declarada: avisa (B.01.402(6))",
  r2.advertencias.some((a) => a.includes("B.01.402(6)")),
);
const r3 = C.calcular({ ...base, reducida: "simplificada" });
cierto(
  "simplificada sin ceros suficientes: avisa y vuelve a la tabla completa",
  r3.reducida === null && r3.advertencias.length === 1,
);
let error = null;
try {
  C.calcular({ ...base, porcion: { valor: 0 } });
} catch (e) {
  error = e.message;
}
verificar(
  "porción 0: error explícito",
  error,
  "La porción debe ser mayor que cero",
);
const r4 = C.calcular({
  ...base,
  modo: "preparado",
  extras: [{ valor: 200, composicion: { cal: 50, fat: 1 } }],
});
verificar("modo preparado: dos columnas", r4.columnas.length, 2);
verificar(
  "modo preparado: la segunda columna usa su propia composición (200 g × 50 Cal/100 g = 100 Cal)",
  r4.columnas[1].res.cant.cal,
  100,
);
const r5 = C.calcular({
  ...base,
  modo: "cantidades",
  extras: [{ valor: 50 }, { valor: 200 }],
});
verificar(
  "modo cantidades: calorías por cada cantidad (100, 50, 200)",
  r5.columnas.map((c) => c.res.cant.cal),
  [100, 50, 200],
);

// --- Símbolo «High in» ---
verificar("umbral RA 30 -> 10 %", C.umbralSimbolo(30, false, false), 10);
verificar("umbral RA 31 -> 15 %", C.umbralSimbolo(31, false, false), 15);
verificar(
  "umbral plato principal RA 200 -> 30 %",
  C.umbralSimbolo(200, true, false),
  30,
);
verificar(
  "umbral plato principal RA 199 -> 15 %",
  C.umbralSimbolo(199, true, false),
  15,
);
verificar(
  "umbral plato principal niños RA 170 -> 30 %",
  C.umbralSimbolo(170, true, true),
  30,
);
verificar(
  "umbral plato principal adultos RA 170 -> 15 %",
  C.umbralSimbolo(170, true, false),
  15,
);

const sb = (comp, extra = {}) =>
  C.evaluarSimbolo({
    composicion: comp,
    porcion: 100,
    ra: 100,
    audiencia: "general",
    ...extra,
  });
verificar(
  "azúcares 15 g por 100 g (15 % exacto) dispara",
  sb({ sugars: 15 }).disparados,
  ["sugars"],
);
verificar(
  "azúcares 14,9 g no dispara",
  sb({ sugars: 14.9 }).estado,
  "no-aplica",
);
verificar(
  "sat 2,5 + trans 0,5 = 3 g = 15 % del VD de 20 g",
  sb({ sat: 2.5, trans: 0.5 }).disparados,
  ["sat"],
);
verificar("sodio 345 mg = 15 % de 2300 mg", sb({ na: 345 }).disparados, ["na"]);
verificar(
  "D5: niños, sat+trans 1,5 g = 15 % de 10 g",
  sb({ sat: 1.5 }, { audiencia: "ninos" }).disparados,
  ["sat"],
);
verificar(
  "D5: niños, sodio 180 mg = 15 % de 1200 mg",
  sb({ na: 180 }, { audiencia: "ninos" }).disparados,
  ["na"],
);
verificar(
  "D5: niños, azúcares 7,5 g = 15 % de 50 g",
  sb({ sugars: 7.5 }, { audiencia: "ninos" }).disparados,
  ["sugars"],
);
verificar(
  "mayor entre porción y RA: porción 20 g, RA 100 g",
  sb({ sugars: 15 }, { porcion: 20, ra: 100 }).disparados,
  ["sugars"],
);
verificar(
  "D14: reconstitución usa solo la porción (30 g de polvo, RA 200 g preparados)",
  sb({ sugars: 20 }, { porcion: 30, ra: 200, reconstituir: true }).estado,
  "no-aplica",
);
verificar(
  "sin reconstitución el mismo caso dispara por la RA",
  sb({ sugars: 20 }, { porcion: 30, ra: 200 }).disparados,
  ["sugars"],
);
verificar(
  "plato principal RA 200 g: 15 % ya no basta",
  sb({ sugars: 10 }, { porcion: 200, ra: 200, platoPrincipal: true }).estado,
  "no-aplica",
);
verificar(
  "plato principal RA 200 g: 30 % sí",
  sb({ sugars: 30 }, { porcion: 200, ra: 200, platoPrincipal: true })
    .disparados,
  ["sugars"],
);
verificar(
  "RA 30 g -> umbral 10 %",
  sb({ sugars: 40 }, { porcion: 30, ra: 30 }).disparados,
  ["sugars"],
);

// Prohibición, exención total y condicional (B.01.350(5), (13), (15))
verificar(
  "D13: lactantes -> prohibido",
  sb({ sugars: 50 }, { audiencia: "lactantes" }).estado,
  "prohibido",
);
verificar(
  "(15)(f) suplemento nutricional -> prohibido",
  sb({ sugars: 50 }, { categoria: "p_supl" }).estado,
  "prohibido",
);
verificar(
  "(5)(h) sal -> exento",
  sb({ na: 30000 }, { categoria: "e_sal" }).estado,
  "exento",
);
verificar(
  "exento conserva lo que se habría exigido",
  sb({ na: 30000 }, { categoria: "e_sal" }).disparados,
  ["na"],
);
verificar(
  "D2/(5)(b): superficie 10 cm² -> exento aunque deba llevar la tabla",
  sb({ sugars: 50 }, { superficieDisponible: 10, requiereNFT: true }).estado,
  "exento",
);
verificar(
  "(13)(h): 80 cm² sin obligación de tabla -> exento",
  sb({ sugars: 50 }, { superficieDisponible: 80, requiereNFT: false }).estado,
  "exento",
);
verificar(
  "D2: 80 cm² con obligación de tabla -> símbolo obligatorio",
  sb({ sugars: 50 }, { superficieDisponible: 80, requiereNFT: true }).estado,
  "requerido",
);
verificar(
  "D2: 100 cm² exactos no exime por tamaño",
  sb({ sugars: 50 }, { superficieDisponible: 100, requiereNFT: false }).estado,
  "requerido",
);
verificar(
  "(13)(a) alcohol sin obligación de tabla -> exento",
  sb({ sugars: 50 }, { categoria: "c_alcohol", requiereNFT: false }).estado,
  "exento",
);
verificar(
  "(13)(a) alcohol con claim (obligación de tabla) -> requerido",
  sb({ sugars: 50 }, { categoria: "c_alcohol", requiereNFT: true }).estado,
  "requerido",
);
verificar(
  "(13)(g) autoadhesivo con 250 cm²: no aplica",
  sb(
    { sugars: 50 },
    { categoria: "c_sticker", superficieDisponible: 250, requiereNFT: false },
  ).estado,
  "requerido",
);
verificar(
  "(13)(g) autoadhesivo con 150 cm²: exento",
  sb(
    { sugars: 50 },
    { categoria: "c_sticker", superficieDisponible: 150, requiereNFT: false },
  ).estado,
  "exento",
);

// Exenciones por nutriente (B.01.350(6)-(12))
const fr = (ing, extra = {}) =>
  sb(
    { sugars: 60, sat: 10, fat: 10, na: 1000 },
    { ingredientes: ing, ...extra },
  );
verificar(
  "(6)(a) fruta sola: exenta de los tres nutrientes",
  fr({ fruta: true }).estado,
  "no-aplica",
);
verificar(
  "(10) coco: no cuenta como fruta",
  fr({ fruta: true, coco: true }).estado,
  "requerido",
);
verificar(
  "fruta con azúcar añadida: pierde la exención de azúcares",
  fr({ fruta: true }, { anadidos: { azucares: true } }).disparados.includes(
    "sugars",
  ),
  true,
);
verificar(
  "fruta con sodio añadido: pierde la de sodio",
  fr({ fruta: true }, { anadidos: { na: true } }).disparados.includes("na"),
  true,
);
verificar(
  "(6)(d) frutos secos con 40 % de grasa saturada: no exentos",
  sb({ sat: 10, fat: 25 }, { ingredientes: { frutosSecos: true } }).disparados,
  ["sat"],
);
verificar(
  "(6)(d) frutos secos con 20 % de grasa saturada: exentos",
  sb({ sat: 5, fat: 25 }, { ingredientes: { frutosSecos: true } }).estado,
  "no-aplica",
);
verificar(
  "(6) otro ingrediente que aporta el nutriente: sin exención",
  fr({ fruta: true, otros: true }).estado,
  "requerido",
);
verificar(
  "(8) cereales exentos de azúcares",
  sb({ sugars: 60 }, { ingredientes: { cereales: true } }).estado,
  "no-aplica",
);
verificar(
  "(7) cereales NO exentos de grasa saturada",
  sb({ sat: 10 }, { ingredientes: { cereales: true } }).disparados,
  ["sat"],
);
verificar(
  "(8) aceites no están en la lista de azúcares",
  sb({ sugars: 60 }, { ingredientes: { aceites: true } }).disparados,
  ["sugars"],
);

// Queso y yogur (9), (11), (12)
const lac = { sat: 10, fat: 20, sugars: 30, na: 1000, ca: 200 };
verificar(
  "(12) yogur, RA 100 g, calcio 200 mg = 15,4 % del VD: exento de sat y azúcares",
  sb(lac, {
    tipoLacteo: "yogur",
    ingredientes: { leche: true },
  }).disparados.sort(),
  ["na"],
);
verificar(
  "(11) yogur no está exento de sodio",
  sb(lac, { tipoLacteo: "yogur", ingredientes: { leche: true } }).nutrientes.na
    .exento,
  null,
);
verificar(
  "(11) queso con calcio suficiente: exento también de sodio",
  sb(lac, { tipoLacteo: "queso", ingredientes: { leche: true } }).estado,
  "no-aplica",
);
verificar(
  "(12) calcio 150 mg = 11,5 % con RA > 30 g: insuficiente (exige 15 %)",
  sb(
    { ...lac, ca: 150 },
    { tipoLacteo: "queso", ingredientes: { leche: true } },
  ).estado,
  "requerido",
);
verificar(
  "(12) RA ≤ 30 g exige solo 10 %: calcio 140 mg × 30 g = 3,2 % no basta, 500 mg sí",
  sb(
    { ...lac, ca: 500 },
    { tipoLacteo: "queso", porcion: 30, ra: 30, ingredientes: { leche: true } },
  ).nutrientes.sat.exento !== null,
  true,
);
verificar(
  "(9) yogur con otro ingrediente que aporta azúcares: pierde la exención de azúcares",
  sb(lac, {
    tipoLacteo: "yogur",
    ingredientes: { leche: true, otros: true },
  }).disparados.includes("sugars"),
  true,
);
verificar(
  "(11) queso con otros ingredientes mantiene la exención de sodio",
  sb(lac, { tipoLacteo: "queso", ingredientes: { leche: true, otros: true } })
    .nutrientes.na.exento !== null,
  true,
);

// Versión y tamaño (B.01.352; Directory of Nutrition Symbol Specifications)
const ver = (comp, pds) => sb(comp, { superficiePrincipal: pds }).version;
verificar(
  "versión 1: los tres nutrientes",
  ver({ sat: 5, sugars: 20, na: 500 }, 100),
  1,
);
verificar(
  "versión 2: grasa saturada y azúcares",
  ver({ sat: 5, sugars: 20 }, 100),
  2,
);
verificar("versión 3: azúcares y sodio", ver({ sugars: 20, na: 500 }, 100), 3);
verificar(
  "versión 4: grasa saturada y sodio",
  ver({ sat: 5, na: 500 }, 100),
  4,
);
verificar(
  "versión 5, 6 y 7: un solo nutriente",
  [ver({ sat: 5 }, 100), ver({ sugars: 20 }, 100), ver({ na: 500 }, 100)],
  [5, 6, 7],
);
verificar(
  "superficie ≤ 30 cm²: versiones 8 a 13",
  [
    ver({ sat: 5, sugars: 20 }, 30),
    ver({ sugars: 20, na: 500 }, 30),
    ver({ sat: 5, na: 500 }, 30),
    ver({ sat: 5 }, 30),
    ver({ sugars: 20 }, 30),
    ver({ na: 500 }, 30),
  ],
  [8, 9, 10, 11, 12, 13],
);
verificar(
  "superficie ≤ 30 cm² con los tres: versión 1",
  ver({ sat: 5, sugars: 20, na: 500 }, 30),
  1,
);
verificar(
  "tamaño unilingüe, 120 cm², versión 2",
  C.dimensionSimbolo(false, 120, 2),
  { ancho: 2.5, alto: 1.89, margen: 1.5, lupa: 9.8 },
);
verificar(
  "tamaño bilingüe, 120 cm²",
  C.dimensionSimbolo(true, 120, 2).ancho,
  3.6,
);
verificar(
  "tamaño unilingüe, 700 cm²",
  C.dimensionSimbolo(false, 700, 1).ancho,
  4.42,
);
verificar(
  "tamaño unilingüe, 30 cm², versión 8",
  C.dimensionSimbolo(false, 30, 8).ancho,
  1.37,
);
verificar(
  "tamaño unilingüe, 30 cm², versión 13",
  C.dimensionSimbolo(false, 30, 13).alto,
  0.85,
);
verificar(
  "sin superficie principal no hay tamaño",
  C.dimensionSimbolo(false, 0, 1),
  null,
);

// --- formatos.js ---
const comp = {
  cal: 250,
  fat: 9,
  sat: 3.2,
  trans: 0.1,
  chol: 20,
  na: 480,
  cho: 30,
  fibre: 2,
  sugars: 12,
  prot: 8,
  pot: 300,
  ca: 120,
  fe: 1.4,
  vitC: 12,
};
const ent = {
  audiencia: "general",
  porcion: { valor: 60, hmEn: "1 cup", hmFr: "1 tasse", porEnvase: 3.4 },
  composicion: comp,
  adicionales: ["vitC"],
  mostrarKJ: true,
  mostrarPctChol: true,
  ra: 55,
};
const html = (e, cfg) =>
  F.renderizarTabla(C.calcular(e), { unidad: "g", formato: "tabla", ...cfg })[0]
    .html;
const texto = (h) =>
  h
    .replace(/<\/?(b|small)>/g, "")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const hEn = texto(html(ent, { idioma: "en" }));
const hFr = texto(html(ent, { idioma: "fr" }));
const hBi = texto(html(ent, { idioma: "bilingue" }));
cierto(
  "EN: título, porción y leyenda",
  hEn.includes("Nutrition Facts") &&
    hEn.includes("Per 1 cup (60 g)") &&
    hEn.includes("*5% or less is a little, 15% or more is a lot"),
);
cierto(
  "FR: título, porción y leyenda del reglamento (con espacio antes de %)",
  hFr.includes("Valeur nutritive") &&
    hFr.includes("pour 1 tasse (60 g)") &&
    hFr.includes("*5 % ou moins c'est peu, 15 % ou plus c'est beaucoup"),
);
cierto(
  "FR: coma decimal y «Lipides saturés»",
  hFr.includes("0,75 mg") && hFr.includes("saturés"),
);
cierto("EN: punto decimal", hEn.includes("0.75 mg"));
cierto(
  "bilingüe: filas «EN / FR» y título en dos idiomas",
  hBi.includes("Fat / Lipides") &&
    hBi.includes("Nutrition Facts / Valeur nutritive") &&
    hBi.includes("Sodium"),
);
cierto(
  "bilingüe: nombres idénticos no se duplican",
  !hBi.includes("Sodium / Sodium") && !hBi.includes("Calories / Calories"),
);
cierto(
  "kJ y porciones por envase con «about»",
  hEn.includes("(630 kJ)") && hEn.includes("about 3.5"),
);
cierto(
  "D18: orden de la Fig. 1.1 — carbohidrato, proteína, colesterol, sodio",
  hEn.indexOf("Carbohydrate") < hEn.indexOf("Protein") &&
    hEn.indexOf("Protein") < hEn.indexOf("Cholesterol") &&
    hEn.indexOf("Cholesterol") < hEn.indexOf("Sodium"),
);
cierto(
  "%VD del colesterol solo si se pide",
  !texto(html({ ...ent, mostrarPctChol: false }, { idioma: "en" })).includes(
    "Cholesterol 10 mg 4",
  ),
);
verificar(
  "«ambas» devuelve dos tablas",
  F.renderizarTabla(C.calcular(ent), { idioma: "ambas", formato: "tabla" }).map(
    (x) => x.id,
  ),
  ["en", "fr"],
);
const lin = texto(html(ent, { idioma: "fr", formato: "lineal" }));
cierto(
  "lineal FR: encabezado y suma sat+trans con un solo %",
  lin.includes("Valeur nutritive pour 1 tasse (60 g) :") &&
    lin.includes("Lipides saturés 2 g + trans 0,1 g (10 %)") &&
    lin.includes("% = % valeur quotidienne*"),
);
const simp = texto(
  html(
    {
      ...ent,
      composicion: {
        cal: 100,
        fat: 5,
        cho: 20,
        prot: 5,
        na: 200,
        fibre: 2,
        sugars: 8,
        sat: 0,
        trans: 0,
        chol: 0,
        pot: 0,
        ca: 0,
        fe: 0,
      },
      porcion: { valor: 100 },
      reducida: "simplificada",
      mostrarKJ: false,
    },
    { idioma: "en" },
  ),
);
cierto(
  "simplificada: omite saturadas y lista la frase «Not a significant source of»",
  simp.includes(
    "Not a significant source of saturated fat, trans fat, cholesterol, potassium, calcium, or iron.",
  ),
);
const simpFr = texto(
  html(
    {
      ...ent,
      composicion: {
        cal: 100,
        fat: 5,
        cho: 20,
        prot: 5,
        na: 200,
        fibre: 2,
        sugars: 8,
        sat: 0,
        trans: 0,
        chol: 0,
        pot: 0,
        ca: 0,
        fe: 0,
      },
      porcion: { valor: 100 },
      reducida: "simplificada",
    },
    { idioma: "fr" },
  ),
);
cierto(
  "simplificada FR: «Source négligeable de … et fer.»",
  simpFr.includes(
    "Source négligeable de lipides saturés, lipides trans, cholestérol, potassium, calcium et fer.",
  ),
);
const prep = texto(
  html(
    {
      ...ent,
      modo: "preparado",
      extras: [
        {
          valor: 200,
          hmEn: "1 cup",
          hmFr: "1 tasse",
          composicion: { cal: 50, fat: 2, sat: 1, na: 100, fibre: 1 },
        },
      ],
    },
    { idioma: "en" },
  ),
);
cierto(
  "dual preparado: As sold / Prepared y «about … prepared»",
  prep.includes("As sold") &&
    prep.includes("Prepared") &&
    prep.includes("about 1 cup prepared"),
);
const inf = texto(html({ ...ent, audiencia: "lactantes" }, { idioma: "en" }));
cierto(
  "lactantes: la fila de grasa no lleva %VD",
  /Fat 5 g Saturated/.test(inf) ||
    !/Fat [^|]*\d+ %/.test(inf.split("Saturated")[0]),
);
const sym = (comp2, pds, idioma) =>
  F.renderizarSimbolo(sb(comp2, { superficiePrincipal: pds }), idioma);
verificar(
  "símbolo v2 (> 30 cm²): tres barras, la de sodio vacía",
  (sym({ sat: 5, sugars: 20 }, 100, "en")[0].html.match(/class="barra/g) || [])
    .length,
  3,
);
verificar(
  "símbolo v8 (≤ 30 cm²): solo las barras que alcanzan el umbral",
  (sym({ sat: 5, sugars: 20 }, 30, "en")[0].html.match(/class="barra/g) || [])
    .length,
  2,
);
cierto(
  "símbolo EN usa «Sat fat» y FR «Gras sat.»",
  sym({ sat: 5 }, 100, "en")[0].html.includes("Sat fat") &&
    sym({ sat: 5 }, 100, "fr")[0].html.includes("Gras sat.") &&
    sym({ sat: 5 }, 100, "fr")[0].html.includes("Santé Canada"),
);
cierto(
  "símbolo bilingüe: «High in / Élevé en»",
  sym({ sat: 5 }, 100, "bilingue")[0].html.includes("High in / Élevé en"),
);
verificar(
  "símbolo «ambas»: dos piezas",
  sym({ sat: 5 }, 100, "ambas").map((x) => x.id),
  ["en", "fr"],
);
verificar(
  "sin nutrientes disparados no se dibuja símbolo",
  sym({ sat: 0.1 }, 100, "en"),
  [],
);

// --- Correcciones de la relectura independiente ---
verificar("(10) coco con leche: sin exención", sb({ sat: 10, fat: 20, sugars: 60, na: 1000 }, { ingredientes: { coco: true, leche: true } }).estado, "requerido");
verificar("(9)(a) yogur con coco: pierde la exención de sat", sb({ sat: 10, fat: 20, ca: 200 }, { tipoLacteo: "yogur", ingredientes: { leche: true, coco: true } }).disparados, ["sat"]);
verificar("(9)(a) yogur con aceite de ≥ 30 % de grasa saturada: pierde la exención de sat", sb({ sat: 10, fat: 20, ca: 200 }, { tipoLacteo: "yogur", ingredientes: { leche: true, aceites: true } }).disparados, ["sat"]);
verificar("(12) con reconstitución el calcio usa la mayor entre porción y RA", sb({ sat: 10, fat: 20, ca: 3000 }, { tipoLacteo: "yogur", porcion: 10, ra: 100, reconstituir: true, ingredientes: { leche: true } }).nutrientes.sat.exento !== null, true);
const rlc = C.analizarReducida(col({ cal: 0, fat: 0, sat: 0, trans: 0, chol: 10, na: 0, cho: 0, fibre: 0, sugars: 0, prot: 0, pot: 0, ca: 0, fe: 0 }, 100, { audiencia: "lactantes" }), { audiencia: "lactantes" });
verificar("B.01.403(4): colesterol mostrado obliga a mostrar saturadas y trans", [rlc.mostrar.has("sat"), rlc.mostrar.has("trans")], [true, true]);
const rpl = C.calcular({ ...base, audiencia: "lactantes", modo: "preparado", extras: [{ valor: 100, composicion: {} }] });
verificar("B.01.406(6): lactantes con «preparado» vuelve a una columna y avisa", [rpl.modo, rpl.columnas.length, rpl.advertencias.some((a) => a.includes("B.01.406(6)"))], ["unica", 1, true]);
cierto("folato en la tabla bilingüe: «µg DFE / ÉFA»", texto(html({ ...ent, adicionales: ["folato"], composicion: { ...comp, folato: 40 } }, { idioma: "bilingue" })).includes("µg DFE / µg ÉFA"));

if (fallos > 0) {
  console.log(`\n${fallos} prueba(s) fallida(s).`);
  process.exit(1);
} else {
  console.log("\nTodas las pruebas pasaron.");
}
