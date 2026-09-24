// Pruebas de calculo.js — sin framework, node prueba.js
const C = require("./calculo.js");

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

// --- Redondeo B.01.401, un caso en cada extremo de bracket ---

verificar("calorías <5 -> nearest 1", C.redondear("cal", 4.4), 4);
verificar("calorías 5-50 -> nearest 5", C.redondear("cal", 23), 25);
verificar("calorías >50 -> nearest 10", C.redondear("cal", 96), 100);

verificar("grasa <0.5g -> 0", C.redondear("fat", 0.4), 0);
verificar("grasa 0.5-5g -> nearest 0.5", C.redondear("fat", 2.2), 2);
verificar("grasa >5g -> nearest 1", C.redondear("fat", 5.6), 6);

verificar("colesterol <5mg -> 0", C.redondear("chol", 4), 0);
verificar("colesterol >=5mg -> nearest 5", C.redondear("chol", 23), 25);

verificar("sodio <5mg -> nearest 1", C.redondear("na", 4.4), 4);
verificar("sodio 5-140mg -> nearest 5", C.redondear("na", 88), 90);
verificar("sodio >140mg -> nearest 10", C.redondear("na", 246), 250);

verificar("carbohidrato <0.5g -> 0", C.redondear("cho", 0.4), 0);
verificar("carbohidrato >=0.5g -> nearest 1", C.redondear("cho", 12.6), 13);

verificar("proteína <0.5g -> nearest 0.1", C.redondear("prot", 0.23), 0.2);
verificar("proteína >=0.5g -> nearest 1", C.redondear("prot", 7.6), 8);

verificar("potasio <5mg -> 0", C.redondear("pot", 4), 0);
verificar("potasio 5-50mg -> nearest 10", C.redondear("pot", 32), 30);
verificar("potasio 50-250mg -> nearest 25", C.redondear("pot", 110), 100);
verificar("potasio >=250mg -> nearest 50", C.redondear("pot", 380), 400);

verificar(
  "calcio usa los mismos brackets que potasio",
  C.redondear("ca", 110),
  100,
);

verificar("hierro <0.05mg -> 0", C.redondear("fe", 0.04), 0);
verificar("hierro 0.05-0.5mg -> nearest 0.1", C.redondear("fe", 0.23), 0.2);
verificar("hierro 0.5-2.5mg -> nearest 0.25", C.redondear("fe", 1.4), 1.5);
verificar("hierro >=2.5mg -> nearest 0.5", C.redondear("fe", 3.3), 3.5);

// --- %DV ---

verificar(
  "%DV de sodio: 2300mg (el DV entero) -> 100%",
  C.calcularPorcentajeDV("na", 2300),
  100,
);
verificar(
  "%DV de fibra: 0g declarado -> 0%",
  C.calcularPorcentajeDV("fibre", 0),
  0,
);
verificar(
  "%DV de potasio: 1700mg (mitad del DV) -> 50%",
  C.calcularPorcentajeDV("pot", 1700),
  50,
);

// --- Fila combinada saturada+trans (particularidad canadiense: un solo %DV sobre la suma, DV=20g) ---

{
  const res = C.calcular(
    {
      cal: 0,
      fat: 0,
      sat: 5,
      trans: 5,
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
  verificar(
    "sat 5g + trans 5g sobre DV 20g -> 50% combinado",
    res.porcentajes.satTransDV,
    50,
  );
}

// --- calcular(): escalado por porción + redondeo ---

{
  const valores100 = {
    cal: 250,
    fat: 10,
    sat: 3,
    trans: 0,
    chol: 20,
    na: 400,
    cho: 30,
    fibre: 2,
    sugars: 8,
    prot: 6,
    pot: 200,
    ca: 100,
    fe: 1,
  };
  const res = C.calcular(valores100, 50); // media porción de 100g
  verificar(
    "calcular(): sodio a media porción (200mg) -> %DV",
    res.porcentajes.na,
    9,
  );
  verificar(
    "calcular(): sodio a media porción -> declarado 200mg",
    res.declarado.na,
    200,
  );
}

// --- Símbolo frontal: umbrales de los 6 casos ---

verificar("umbral RA>30g/mL (adulto)", C.umbralSimbolo(50, false, false), 15);
verificar("umbral RA<=30g/mL (adulto)", C.umbralSimbolo(20, false, false), 10);
verificar(
  "umbral plato principal RA>=200g (adulto)",
  C.umbralSimbolo(250, true, false),
  30,
);
verificar("umbral niños 1-4a RA>30g/mL", C.umbralSimbolo(50, false, true), 15);
verificar("umbral niños 1-4a RA<=30g/mL", C.umbralSimbolo(20, false, true), 10);
verificar(
  "umbral plato principal niños 1-4a RA>=170g",
  C.umbralSimbolo(180, true, true),
  30,
);

// --- Símbolo: disparo por azúcares y exención de fruta sin adición ---

{
  // 100g/mL con 60g de azúcares -> muy por encima del umbral de 15% (DV 100g)
  const valores100 = {
    cal: 0,
    fat: 0,
    sat: 0,
    trans: 0,
    chol: 0,
    na: 0,
    cho: 0,
    fibre: 0,
    sugars: 60,
    prot: 0,
    pot: 0,
    ca: 0,
    fe: 0,
  };
  const disparados = C.calcularSimbolo(valores100, 100, 100, {});
  verificar(
    "azúcares altos sin exención -> dispara símbolo por azúcares",
    disparados.has("sugars"),
    true,
  );

  const disparadosExento = C.calcularSimbolo(valores100, 100, 100, {
    frutaHortalizaSinAdicion: true,
  });
  verificar(
    "misma composición, fruta/hortaliza sin adición -> exenta, no dispara nada",
    disparadosExento.size,
    0,
  );
}

// --- Símbolo: envase chico exento de todo ---

{
  const valores100 = {
    cal: 0,
    fat: 0,
    sat: 20,
    trans: 0,
    chol: 0,
    na: 5000,
    cho: 0,
    fibre: 0,
    sugars: 90,
    prot: 0,
    pot: 0,
    ca: 0,
    fe: 0,
  };
  const disparados = C.calcularSimbolo(valores100, 100, 100, {
    envaseChico: true,
  });
  verificar(
    "envase con superficie < 100cm² -> exento aunque supere todos los umbrales",
    disparados.size,
    0,
  );
}

// --- Símbolo: queso con calcio suficiente exento de sat+trans y azúcares, no de sodio ---

{
  const valores100 = {
    cal: 0,
    fat: 0,
    sat: 20,
    trans: 0,
    chol: 0,
    na: 5000,
    cho: 0,
    fibre: 0,
    sugars: 90,
    prot: 0,
    pot: 0,
    ca: 0,
    fe: 0,
  };
  const disparados = C.calcularSimbolo(valores100, 100, 100, {
    quesoOYogurConCalcioSuficiente: true,
  });
  verificar(
    "queso/yogur exento de grasa sat+trans y azúcares",
    disparados.has("satTrans") || disparados.has("sugars"),
    false,
  );
  verificar(
    "queso/yogur exento de sat+trans/azúcares SIGUE disparando por sodio (no es queso, o no se marcó exento de sodio)",
    disparados.has("na"),
    true,
  );
}

if (fallos > 0) {
  console.log(`\n${fallos} prueba(s) fallida(s).`);
  process.exit(1);
} else {
  console.log("\nTodas las pruebas pasaron.");
}
