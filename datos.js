// Datos normativos de la Nutrition Facts table (Canadá).
// Fuentes: Food and Drug Regulations (C.R.C., c. 870) B.01.401 y B.01.402
// (texto vigente al 14-jun-2026); Table of Daily Values (Health Canada,
// 20-oct-2022, verificada en canada.ca el 13-oct-2026).

// Destinatario del alimento. Decide la columna de la Table of Daily Values
// (B.01.001.1(2)):
//   general   -> Parte 1 col. 3 / Parte 2 col. 4
//   ninos     -> alimento SOLO para niños 1 a <4 años: Parte 1 col. 2 / Parte 2 col. 3
//   lactantes -> alimento SOLO para lactantes 6 a <12 meses: Parte 1 no aplica / Parte 2 col. 2
const AUDIENCIAS = ["general", "ninos", "lactantes"];

// Parte 1: [niños 1 a <4 años (col. 2), general (col. 3)]
const VD_PARTE1 = {
  fat: [44, 75],
  satTrans: [10, 20], // suma de ácidos grasos saturados y trans
  fibre: [14, 28],
  sugars: [50, 100],
  chol: [300, 300],
  na: [1200, 2300],
};

// Parte 2: [lactantes 6 a <12 m (col. 2), lactantes o niños 1 a <4 (col. 3), otros casos (col. 4)]
const VD_PARTE2 = {
  pot: [860, 2000, 3400],
  ca: [260, 700, 1300],
  fe: [11, 7, 18],
  vitA: [500, 300, 900],
  vitC: [50, 15, 90],
  vitD: [10, 15, 20],
  vitE: [5, 6, 15],
  vitK: [2.5, 30, 120],
  tiamina: [0.3, 0.5, 1.2],
  riboflavina: [0.4, 0.5, 1.3],
  niacina: [4, 6, 16],
  vitB6: [0.3, 0.5, 1.7],
  folato: [80, 150, 400],
  vitB12: [0.5, 0.9, 2.4],
  colina: [150, 200, 550],
  biotina: [6, 8, 30],
  pantotenico: [1.8, 2, 5],
  fosforo: [275, 460, 1250],
  yodo: [130, 90, 150],
  magnesio: [75, 80, 420],
  zinc: [3, 3, 11],
  selenio: [20, 20, 55],
  cobre: [0.2, 0.3, 0.9],
  manganeso: [0.6, 1.2, 2.3],
  cromo: [5.5, 11, 35],
  molibdeno: [3, 17, 45],
  cloruro: [570, 1500, 2300],
};

// Valor diario aplicable, o null si no existe para ese destinatario
// (p. ej. nutrientes de la Parte 1 en un alimento solo para lactantes:
// B.01.403(2) prohíbe declarar su %DV).
function valorDiario(k, audiencia) {
  if (k in VD_PARTE1) {
    if (audiencia === "lactantes") return null;
    return VD_PARTE1[k][audiencia === "ninos" ? 0 : 1];
  }
  if (k in VD_PARTE2) {
    const col = audiencia === "lactantes" ? 0 : audiencia === "ninos" ? 1 : 2;
    return VD_PARTE2[k][col];
  }
  return null;
}

// B.01.401 "Core Information". en/fr: primera alternativa permitida (la que
// usa el Directory of NFT Formats). unidad: la de la tabla.
// pct: "obl" (%DV obligatorio), "opc" (opcional), null (sin %DV propio).
const CORE_INFO = [
  { k: "cal", en: "Calories", fr: "Calories", unidad: "Cal", pct: null },
  { k: "fat", en: "Fat", fr: "Lipides", unidad: "g", pct: "obl" },
  { k: "sat", en: "Saturated", fr: "saturés", unidad: "g", pct: null },
  { k: "trans", en: "Trans", fr: "trans", unidad: "g", pct: null },
  { k: "chol", en: "Cholesterol", fr: "Cholestérol", unidad: "mg", pct: "opc" },
  { k: "na", en: "Sodium", fr: "Sodium", unidad: "mg", pct: "obl" },
  { k: "cho", en: "Carbohydrate", fr: "Glucides", unidad: "g", pct: null },
  { k: "fibre", en: "Fibre", fr: "Fibres", unidad: "g", pct: "obl" },
  { k: "sugars", en: "Sugars", fr: "Sucres", unidad: "g", pct: "obl" },
  { k: "prot", en: "Protein", fr: "Protéines", unidad: "g", pct: null },
  { k: "pot", en: "Potassium", fr: "Potassium", unidad: "mg", pct: "obl" },
  { k: "ca", en: "Calcium", fr: "Calcium", unidad: "mg", pct: "obl" },
  { k: "fe", en: "Iron", fr: "Fer", unidad: "mg", pct: "obl" },
];

// Nombres en español para el formulario (la tabla de salida es EN/FR).
const NOMBRE_ES = {
  cal: "Calorías",
  fat: "Grasa total",
  sat: "Grasa saturada",
  trans: "Grasa trans",
  chol: "Colesterol",
  na: "Sodio",
  cho: "Carbohidratos",
  fibre: "Fibra",
  sugars: "Azúcares",
  prot: "Proteína",
  pot: "Potasio",
  ca: "Calcio",
  fe: "Hierro",
  kJ: "Energía en kilojulios",
  poli: "Grasa poliinsaturada",
  omega6: "Omega-6",
  omega3: "Omega-3",
  mono: "Grasa monoinsaturada",
  fibreSol: "Fibra soluble",
  fibreInsol: "Fibra insoluble",
  polialcoholes: "Polialcoholes",
  almidon: "Almidón",
  vitA: "Vitamina A",
  vitC: "Vitamina C",
  vitD: "Vitamina D",
  vitE: "Vitamina E",
  vitK: "Vitamina K",
  tiamina: "Tiamina (B1)",
  riboflavina: "Riboflavina (B2)",
  niacina: "Niacina",
  vitB6: "Vitamina B6",
  folato: "Folato",
  vitB12: "Vitamina B12",
  biotina: "Biotina",
  pantotenico: "Ácido pantoténico",
  colina: "Colina",
  fosforo: "Fósforo",
  yodo: "Yoduro",
  magnesio: "Magnesio",
  zinc: "Zinc",
  selenio: "Selenio",
  cobre: "Cobre",
  manganeso: "Manganeso",
  cromo: "Cromo",
  molibdeno: "Molibdeno",
  cloruro: "Cloruro",
};

// Tramos de redondeo [límite superior EXCLUSIVO, paso]; paso 0 = se declara "0".
// El último tramo no tiene límite (Infinity).
const T_GRASAS_ADIC = [
  [1, 0.1],
  [5.000001, 0.5],
  [Infinity, 1],
]; // <1 -> 0,1; 1 a 5 -> 0,5; >5 -> 1
const T_FIBRA_ADIC = [
  [0.5, 0],
  [Infinity, 1],
];
const T_MINERAL_A = [
  [5, 0],
  [50, 10],
  [250, 25],
  [Infinity, 50],
];
const T_PEQUENO_A = [
  [0.05, 0],
  [0.5, 0.1],
  [2.5, 0.25],
  [Infinity, 0.5],
];
const T_PEQUENO_B = [
  [0.005, 0],
  [0.05, 0.01],
  [0.25, 0.025],
  [Infinity, 0.05],
];
const T_PEQUENO_C = [
  [0.1, 0],
  [1, 0.2],
  [5, 0.5],
  [Infinity, 1],
];
const T_ENTERO = [
  [1, 0],
  [10, 2],
  [50, 5],
  [Infinity, 10],
];

// B.01.402 "Additional Information", ítems vigentes (3, 4 y 9 están derogados).
// dv: clave en VD_PARTE2 si lleva %DV (ítems 14 a 37). tramos: redondeo de col. 4.
const ADICIONALES = [
  { k: "kJ", en: "kilojoules", fr: "kilojoules", unidad: "kJ", tramos: "kj" },
  {
    k: "poli",
    en: "Polyunsaturated",
    fr: "polyinsaturés",
    unidad: "g",
    tramos: T_GRASAS_ADIC,
    grupo: "grasas",
  },
  {
    k: "omega6",
    en: "Omega-6",
    fr: "oméga-6",
    unidad: "g",
    tramos: T_GRASAS_ADIC,
    grupo: "grasas",
  },
  {
    k: "omega3",
    en: "Omega-3",
    fr: "oméga-3",
    unidad: "g",
    tramos: T_GRASAS_ADIC,
    grupo: "grasas",
  },
  {
    k: "mono",
    en: "Monounsaturated",
    fr: "monoinsaturés",
    unidad: "g",
    tramos: T_GRASAS_ADIC,
    grupo: "grasas",
  },
  {
    k: "fibreSol",
    en: "Soluble Fibre",
    fr: "Fibres solubles",
    unidad: "g",
    tramos: T_FIBRA_ADIC,
  },
  {
    k: "fibreInsol",
    en: "Insoluble Fibre",
    fr: "Fibres insolubles",
    unidad: "g",
    tramos: T_FIBRA_ADIC,
  },
  {
    k: "polialcoholes",
    en: "Sugar Alcohols",
    fr: "Polyalcools",
    unidad: "g",
    tramos: T_FIBRA_ADIC,
  },
  {
    k: "almidon",
    en: "Starch",
    fr: "Amidon",
    unidad: "g",
    tramos: T_FIBRA_ADIC,
  },
  {
    k: "vitA",
    en: "Vitamin A",
    fr: "Vitamine A",
    unidad: "µg",
    dv: "vitA",
    tramos: [
      [5, 0],
      [50, 10],
      [250, 50],
      [Infinity, 100],
    ],
  },
  {
    k: "vitC",
    en: "Vitamin C",
    fr: "Vitamine C",
    unidad: "mg",
    dv: "vitC",
    tramos: T_PEQUENO_C,
  },
  {
    k: "vitD",
    en: "Vitamin D",
    fr: "Vitamine D",
    unidad: "µg",
    dv: "vitD",
    tramos: T_PEQUENO_C,
  },
  {
    k: "vitE",
    en: "Vitamin E",
    fr: "Vitamine E",
    unidad: "mg",
    dv: "vitE",
    tramos: T_PEQUENO_A,
  },
  {
    k: "vitK",
    en: "Vitamin K",
    fr: "Vitamine K",
    unidad: "µg",
    dv: "vitK",
    tramos: T_PEQUENO_A,
  },
  {
    k: "tiamina",
    en: "Thiamine",
    fr: "Thiamine",
    unidad: "mg",
    dv: "tiamina",
    tramos: T_PEQUENO_B,
  },
  {
    k: "riboflavina",
    en: "Riboflavin",
    fr: "Riboflavine",
    unidad: "mg",
    dv: "riboflavina",
    tramos: T_PEQUENO_B,
  },
  {
    k: "niacina",
    en: "Niacin",
    fr: "Niacine",
    unidad: "mg",
    dv: "niacina",
    tramos: T_PEQUENO_A,
  },
  {
    k: "vitB6",
    en: "Vitamin B6",
    fr: "Vitamine B6",
    unidad: "mg",
    dv: "vitB6",
    tramos: T_PEQUENO_B,
  },
  {
    k: "folato",
    en: "Folate",
    fr: "Folate",
    unidad: "µg DFE",
    unidadFr: "µg ÉFA",
    dv: "folato",
    tramos: T_ENTERO,
  },
  {
    k: "vitB12",
    en: "Vitamin B12",
    fr: "Vitamine B12",
    unidad: "µg",
    dv: "vitB12",
    tramos: T_PEQUENO_B,
  },
  {
    k: "biotina",
    en: "Biotin",
    fr: "Biotine",
    unidad: "µg",
    dv: "biotina",
    tramos: T_PEQUENO_A,
  },
  {
    k: "pantotenico",
    en: "Pantothenate",
    fr: "Pantothénate",
    unidad: "mg",
    dv: "pantotenico",
    tramos: [
      [0.01, 0],
      [0.1, 0.02],
      [0.5, 0.05],
      [Infinity, 0.1],
    ],
  },
  {
    k: "colina",
    en: "Choline",
    fr: "Choline",
    unidad: "mg",
    dv: "colina",
    tramos: T_ENTERO,
  },
  {
    k: "fosforo",
    en: "Phosphorus",
    fr: "Phosphore",
    unidad: "mg",
    dv: "fosforo",
    tramos: T_MINERAL_A,
  },
  {
    k: "yodo",
    en: "Iodide",
    fr: "Iodure",
    unidad: "µg",
    dv: "yodo",
    tramos: T_ENTERO,
  },
  {
    k: "magnesio",
    en: "Magnesium",
    fr: "Magnésium",
    unidad: "mg",
    dv: "magnesio",
    tramos: T_ENTERO,
  },
  {
    k: "zinc",
    en: "Zinc",
    fr: "Zinc",
    unidad: "mg",
    dv: "zinc",
    tramos: T_PEQUENO_A,
  },
  {
    k: "selenio",
    en: "Selenium",
    fr: "Sélénium",
    unidad: "µg",
    dv: "selenio",
    tramos: T_PEQUENO_C,
  },
  {
    k: "cobre",
    en: "Copper",
    fr: "Cuivre",
    unidad: "mg",
    dv: "cobre",
    tramos: [
      [0.0015, 0],
      [0.025, 0.002],
      [0.05, 0.005],
      [Infinity, 0.01],
    ],
  },
  {
    k: "manganeso",
    en: "Manganese",
    fr: "Manganèse",
    unidad: "mg",
    dv: "manganeso",
    tramos: T_PEQUENO_B,
  },
  {
    k: "cromo",
    en: "Chromium",
    fr: "Chrome",
    unidad: "µg",
    dv: "cromo",
    tramos: T_PEQUENO_A,
  },
  {
    k: "molibdeno",
    en: "Molybdenum",
    fr: "Molybdène",
    unidad: "µg",
    dv: "molibdeno",
    tramos: T_PEQUENO_A,
  },
  {
    k: "cloruro",
    en: "Chloride",
    fr: "Chlorure",
    unidad: "mg",
    dv: "cloruro",
    tramos: T_MINERAL_A,
  },
];

// Textos fijos de la tabla, EN y FR (B.01.401 ítem 16 y Directory of NFT Formats).
const TEXTO = {
  en: {
    titulo: "Nutrition Facts",
    por: "Per",
    pctVd: "% Daily Value",
    leyenda: "*5% or less is a little, 15% or more is a lot",
    noSignificativa: "Not a significant source of",
    otros: "other nutrients",
    o: "or",
    porEnvase: "Servings per container",
    asSold: "As sold",
    preparado: "Prepared",
    alimento: "Food",
    aprox: "about",
    pctEquiv: "% = % Daily Value",
  },
  fr: {
    titulo: "Valeur nutritive",
    por: "pour",
    pctVd: "% valeur quotidienne",
    leyenda: "*5 % ou moins c'est peu, 15 % ou plus c'est beaucoup",
    noSignificativa: "Source négligeable de",
    otros: "d'autres éléments nutritifs",
    o: "et",
    porEnvase: "Portions par contenant",
    asSold: "Tel que vendu",
    preparado: "Préparé",
    alimento: "Aliment",
    aprox: "environ",
    pctEquiv: "% = % valeur quotidienne",
  },
};

// Frases "No es fuente significativa de": nombre del nutriente omitido.
const NOMBRE_OMITIDO = {
  en: {
    sat: "saturated fat",
    trans: "trans fat",
    chol: "cholesterol",
    na: "sodium",
    fibre: "fibre",
    sugars: "sugars",
    pot: "potassium",
    ca: "calcium",
    fe: "iron",
  },
  fr: {
    sat: "lipides saturés",
    trans: "lipides trans",
    chol: "cholestérol",
    na: "sodium",
    fibre: "fibres",
    sugars: "sucres",
    pot: "potassium",
    ca: "calcium",
    fe: "fer",
  },
};

// Símbolo "High in" (Schedule K.1): texto exacto de cada versión.
const TEXTO_SIMBOLO = {
  en: {
    cabecera: "High in",
    satFat: "Sat fat",
    sugars: "Sugars",
    sodium: "Sodium",
    pie: "Health Canada",
  },
  fr: {
    cabecera: "Élevé en",
    satFat: "Gras sat.",
    sugars: "Sucres",
    sodium: "Sodium",
    pie: "Santé Canada",
  },
};

// Redondeo de B.01.401, col. 4: [límite superior exclusivo, paso]. paso 0 = "0".
// El tramo inferior de cal/grasas/sodio admite "0" solo con declaración "free of".
const TRAMOS_CORE = {
  cal: [
    [5, 1],
    [50.0000001, 5],
    [Infinity, 10],
  ],
  fat: [
    [0.5, 0.1],
    [5.0000001, 0.5],
    [Infinity, 1],
  ],
  sat: [
    [0.5, 0.1],
    [5.0000001, 0.5],
    [Infinity, 1],
  ],
  trans: [
    [0.5, 0.1],
    [5.0000001, 0.5],
    [Infinity, 1],
  ],
  na: [
    [5, 1],
    [140.0000001, 5],
    [Infinity, 10],
  ],
  cho: [
    [0.5, 0],
    [Infinity, 1],
  ],
  fibre: [
    [0.5, 0],
    [Infinity, 1],
  ],
  sugars: [
    [0.5, 0],
    [Infinity, 1],
  ],
  prot: [
    [0.5, 0.1],
    [Infinity, 1],
  ],
  pot: T_MINERAL_A,
  ca: T_MINERAL_A,
  fe: T_PEQUENO_A,
};

// Categorías para el símbolo "High in" (B.01.350). tipo:
//   prohibido (15): la etiqueta NO puede llevar el símbolo.
//   exento (5): exención total incondicional.
//   cond (13): exento salvo que el producto deba llevar la tabla (B.01.401(3)).
const CATEGORIAS_SIMBOLO = [
  {
    id: "ninguna",
    tipo: "ninguna",
    ref: "",
    es: "Ninguna: producto sujeto al símbolo",
  },
  {
    id: "p_fort",
    tipo: "prohibido",
    ref: "(15)(b)",
    es: "Fortificante de leche humana",
  },
  {
    id: "p_suc",
    tipo: "prohibido",
    ref: "(15)(c)",
    es: "Sucedáneo de leche humana o alimento presentado como tal",
  },
  {
    id: "p_liq",
    tipo: "prohibido",
    ref: "(15)(d)",
    es: "Dieta líquida formulada",
  },
  {
    id: "p_reemp",
    tipo: "prohibido",
    ref: "(15)(e)",
    es: "Reemplazo de comida",
  },
  {
    id: "p_supl",
    tipo: "prohibido",
    ref: "(15)(f)",
    es: "Suplemento nutricional",
  },
  {
    id: "p_prot",
    tipo: "prohibido",
    ref: "(15)(g)",
    es: "Alimento para dietas restringidas en proteína",
  },
  {
    id: "p_aa",
    tipo: "prohibido",
    ref: "(15)(h)",
    es: "Alimento para dietas bajas en un aminoácido",
  },
  {
    id: "p_vled",
    tipo: "prohibido",
    ref: "(15)(i)",
    es: "Dieta de muy bajo aporte energético",
  },
  {
    id: "e_embarque",
    tipo: "exento",
    ref: "(5)(a)",
    es: "Contenedor de embarque (no se vende como una unidad al consumidor)",
  },
  {
    id: "e_rest",
    tipo: "exento",
    ref: "(5)(c)",
    es: "Porción individual destinada solo a restaurante o empresa comercial",
  },
  {
    id: "e_inst",
    tipo: "exento",
    ref: "(5)(d)",
    es: "Multiporción listo para servir destinado solo a empresa o institución",
  },
  {
    id: "e_ingr",
    tipo: "exento",
    ref: "(5)(e)",
    es: "Destinado solo como ingrediente (industria o comercio)",
  },
  {
    id: "e_leche",
    tipo: "exento",
    ref: "(5)(f)",
    es: "Leche o crema en envase de vidrio reutilizable",
  },
  {
    id: "e_edulc",
    tipo: "exento",
    ref: "(5)(g)",
    es: "Edulcorante alimentario (azúcar, miel, jarabes, jarabe de arce)",
  },
  {
    id: "e_sal",
    tipo: "exento",
    ref: "(5)(h)",
    es: "Sal de mesa o condimento con «sal» en el nombre",
  },
  {
    id: "e_grasas",
    tipo: "exento",
    ref: "(5)(i)",
    es: "Grasas y aceites, mantequilla, ghee, margarina",
  },
  {
    id: "e_mil",
    tipo: "exento",
    ref: "(5)(j)",
    es: "Ración individual militar",
  },
  {
    id: "c_alcohol",
    tipo: "cond",
    ref: "(13)(a)",
    es: "Bebida con más de 0,5 % de alcohol",
  },
  {
    id: "c_carne",
    tipo: "cond",
    ref: "(13)(b)",
    es: "Carne o carne de ave cruda de un ingrediente, sin moler",
  },
  {
    id: "c_molida",
    tipo: "cond",
    ref: "(13.01)",
    es: "Carne o carne de ave cruda de un ingrediente, molida",
  },
  {
    id: "c_acuatico",
    tipo: "cond",
    ref: "(13)(c)",
    es: "Producto acuático crudo de un ingrediente",
  },
  {
    id: "c_local",
    tipo: "cond",
    ref: "(13)(d)",
    es: "Vendido solo en el establecimiento donde se elabora",
  },
  {
    id: "c_feria",
    tipo: "cond",
    ref: "(13)(e)",
    es: "Vendido por quien lo elaboró en puesto de carretera, feria o mercado campesino",
  },
  {
    id: "c_inmediato",
    tipo: "cond",
    ref: "(13)(f)",
    es: "Porción individual de consumo inmediato, sin proceso de conservación",
  },
  {
    id: "c_sticker",
    tipo: "cond",
    ref: "(13)(g)",
    es: "Vendido solo donde se empaca, con autoadhesivo y superficie < 200 cm²",
  },
  {
    id: "c_suplementado",
    tipo: "cond",
    ref: "(13.1)/(13.2)",
    es: "Alimento suplementado con superficie < 100 cm²",
  },
];

// Directory of Nutrition Symbol Specifications (jul-2024): [sup. principal mín. exclusivo,
// máx. inclusivo, ancho cm, alto cm, margen mm, lupa mm]. Horizontal unilingüe (Tabla 1)
// y bilingüe (Tabla 3). Para <=30 cm² los símbolos 8-10 y 11-13 tienen medidas propias.
const DIM_SIMBOLO = {
  uni: [
    [600, Infinity, 4.42, 3.3, 2.7, 17.3],
    [450, 600, 3.79, 2.83, 2.3, 14.8],
    [250, 450, 3.1, 2.36, 1.9, 12.1],
    [100, 250, 2.5, 1.89, 1.5, 9.8],
    [30, 100, 1.87, 1.42, 1.1, 7.3],
  ],
  uniPeq: {
    1: [1.87, 1.42, 1.1, 7.3],
    8: [1.37, 1.2, 1.1, 2.9],
    11: [1.37, 0.85, 1.1, 2.9],
  },
  bi: [
    [600, Infinity, 6.29, 3.3, 2.7, 17.3],
    [450, 600, 5.4, 2.83, 2.3, 14.8],
    [250, 450, 4.5, 2.36, 1.9, 12.4],
    [100, 250, 3.6, 1.89, 1.5, 9.9],
    [30, 100, 2.8, 1.42, 1.1, 7.4],
  ],
  biPeq: {
    1: [2.8, 1.42, 1.1, 7.4],
    8: [2.5, 1.2, 1.1, 4.2],
    11: [2.5, 0.85, 1.1, 3.9],
  },
};

// Versión del símbolo (B.01.352): [nutrientes que alcanzan el umbral] -> n.º por superficie.
const VERSION_SIMBOLO = {
  grande: {
    "sat,sugars,na": 1,
    "sat,sugars": 2,
    "sugars,na": 3,
    "sat,na": 4,
    sat: 5,
    sugars: 6,
    na: 7,
  },
  chica: {
    "sat,sugars,na": 1,
    "sat,sugars": 8,
    "sugars,na": 9,
    "sat,na": 10,
    sat: 11,
    sugars: 12,
    na: 13,
  },
};

const datos = {
  TRAMOS_CORE,
  CATEGORIAS_SIMBOLO,
  DIM_SIMBOLO,
  VERSION_SIMBOLO,
  AUDIENCIAS,
  VD_PARTE1,
  VD_PARTE2,
  valorDiario,
  CORE_INFO,
  NOMBRE_ES,
  ADICIONALES,
  TEXTO,
  NOMBRE_OMITIDO,
  TEXTO_SIMBOLO,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = datos;
}
if (typeof window !== "undefined") {
  window.D = datos;
}
