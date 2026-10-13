# Tabla nutricional — Canadá

Herramienta web personal para generar la Nutrition Facts table canadiense y
evaluar el símbolo nutricional frontal «High in». Página estática sin
framework, uso propio, no forma parte de ningún sistema de gestión de calidad.
Los datos se cargan en español; la tabla y el símbolo salen en inglés, francés,
en dos tablas o en una tabla bilingüe combinada.

## Qué cubre

- **Core Information** (B.01.401): redondeo de cada nutriente, %VD, orden de
  filas del Directory of NFT Formats, valores diarios según el destinatario
  (adultos, niños de 1 a < 4 años, lactantes de 6 a < 12 meses).
- **Información adicional** (B.01.402): kilojulios, porciones por envase,
  poliinsaturadas, omega-6, omega-3, monoinsaturadas, fibras soluble e
  insoluble, polialcoholes, almidón y las 24 vitaminas y minerales con su %VD.
- **Declaraciones «free of»** que permiten declarar «0»: se validan contra los
  datos (por porción y por cantidad de referencia); si no se cumplen, se avisa
  y se redondea sin ellas.
- **Formatos**: estándar, simplificado (B.01.401(6) y B.01.403(5)),
  simplificado de porción individual (B.01.401(6.1)), dual «tal como se vende /
  preparado» (B.01.456), agregado de varios alimentos (B.01.457), dual de otras
  cantidades (B.01.458), agregado de otras cantidades (B.01.459), lineal
  (Fig. 16.1 y 17.1) y modo de lactantes (B.01.403).
- **Símbolo «High in»** (B.01.350 a B.01.352): umbral por columna, tres
  resultados distintos (obligatorio, exento con su motivo, **prohibido**),
  exenciones totales (5), exenciones por nutriente según ingredientes (6) a
  (12), exenciones condicionadas a que no se exija la tabla (13), reconstitución
  (3) y (4), queso y yogur con el calcio calculado de los propios datos,
  versión 1 a 13 del Schedule K.1, texto en inglés, francés o bilingüe y tamaño
  mínimo del Directory of Nutrition Symbol Specifications (jul-2024).

## Decisiones donde la norma no es concluyente

- **Base del %VD** de grasa, fibra, azúcares, colesterol y suma saturadas +
  trans: la cantidad sin redondear. La norma solo fija la cantidad redondeada
  para minerales (B.01.401(1.2)) y para las vitaminas y minerales de B.01.402
  (B.01.402(2.2)). Si la cantidad se declara «0», el %VD es «0 %».
- **Empate del redondeo** («múltiplo más cercano»): hacia arriba.
- **Símbolo**: se compara el %VD calculado sin redondear contra el umbral
  («meets or exceeds»). El texto no dice si se usa el valor redondeado de la
  tabla.
- **Calorías en kJ**: 4,184 kJ por Cal sobre la energía sin redondear, redondeado
  a 10 kJ; se muestra «Calories 150 (630 kJ)».
- **Tipografía del francés**: coma decimal y espacio de no separación antes de
  «%» y de las unidades. En la tabla bilingüe se usa el punto decimal. La
  leyenda usa el literal del reglamento en cada idioma («5% or less…» y
  «5 % ou moins…»).
- **Exenciones por ingredientes**: se evalúan sobre el producto completo (no
  ingrediente por ingrediente). La regla de «menos de 30 % de la grasa es
  saturada» se calcula con los datos del producto. Los huevos, aceites y
  productos acuáticos se tratan como fuera de la lista de azúcares de (8).
- **Free of saturated fat**: se exige < 0,2 g de saturadas y < 0,2 g de trans
  (cada una) por porción y por cantidad de referencia.

## Límites conocidos

- Las **dimensiones físicas** y el test del 15 % de la superficie disponible
  (B.01.454 y homólogos) no se evalúan: el Directory of NFT Formats no trae
  medidas. La herramienta no elige entre la versión de 8 pt y las condensadas;
  el diseñador debe aplicar el tamaño de letra de la figura. La tabla en
  pantalla es una representación, no la figura oficial.
- El símbolo vertical (B.01.351(3)) no se dibuja; solo se da el tamaño del
  horizontal.
- Los pies ‡ de la columna «preparado» con las cantidades del alimento añadido
  (B.01.406(5)(b)) no se generan.
- Los polialcoholes siempre se rotulan en plural («Sugar Alcohols»); con un solo
  polialcohol B.01.402 ítem 12(1) pide «Sugar Alcohol», «Polyol» o su nombre.
- La columna «preparado» no lleva fibra (B.01.406(5)(a)(iv)), aunque la Fig. 8.1
  del Directory la muestra, y no imprime las dagas † y ‡.
- La regla del 30 % de grasa saturada se evalúa sobre el producto entero, no por
  ingrediente (exacta solo en productos de un ingrediente).
- Un alimento para lactantes de 6 a < 12 meses y también para niños de 1 a < 4
  años no se puede representar (B.01.001.1(2)(b)(ii)).
- Las exenciones de B.29.018(2)(b) (alimentos suplementados) no se evalúan.
- No existe la **Table of Reference Amounts**: la cantidad de referencia se
  ingresa a mano. El umbral de plato principal (main dish) es una declaración
  del usuario.
- El texto de las condiciones «free of» y la Table of Daily Values se
  verificaron en canada.ca el 13-oct-2026; no están en ningún PDF local.
- Quebec (Charte de la langue française) no se evaluó.

## Fuentes legales

- Food and Drug Regulations (C.R.C., c. 870), Parte B, División 1: B.01.350 a
  B.01.358 y Schedule K.1, B.01.401 a B.01.406, B.01.450 a B.01.469 (texto
  vigente al 14-jun-2026).
- Table of Daily Values (Health Canada), versión del 20 de octubre de 2022,
  obligatoria desde el 1 de enero de 2026.
- Table of Permitted Nutrient Content Statements and Claims (condiciones de
  «free of»).
- Directory of Nutrition Facts table Formats (dic-2016) y Directory of
  Nutrition Symbol Specifications (jul-2024).

## Archivos

- `datos.js` — tablas normativas: valores diarios, ítems de B.01.401 y
  B.01.402 con nombres EN/FR y tramos de redondeo, categorías y tamaños del
  símbolo, textos fijos.
- `calculo.js` — lógica pura (redondeo, %VD, «free of», tabla reducida,
  símbolo), testeable con Node.
- `formatos.js` — HTML de la tabla (todos los formatos e idiomas) y del símbolo.
- `app.js`, `index.html`, `estilos.css` — interfaz en español.
- `prueba.js` — pruebas (`node prueba.js`).

## Pruebas

```
node prueba.js
```
