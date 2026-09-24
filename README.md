# Tabla nutricional — Canadá

Herramienta web personal para generar la Nutrition Facts table canadiense
(Standard Format) y evaluar el símbolo nutricional frontal "High in". Página
estática sin framework, uso propio, no forma parte de ningún sistema de
gestión de calidad.

## Alcance de este primer commit

Cubre:

- **Standard Format** de la Nutrition Facts table, unilingüe en inglés
  (Food and Drug Regulations, C.R.C., c. 870, B.01.401 "Core Information").
- **Símbolo nutricional frontal "High in"** (B.01.350): umbrales por
  cantidad de referencia (RA), fila combinada de grasa saturada + trans con
  un único %DV, y las exenciones de cálculo simple (envase pequeño, fruta u
  hortaliza sin adición, queso/yogur con calcio suficiente).

Deliberadamente fuera de alcance (no pedido en este commit):

- Bilingüismo (inglés/francés).
- Otros formatos de la NFT (Simplified, Dual, Aggregate, Linear).
- Sección opcional de vitaminas y minerales adicionales (B.01.402).
- Modelado de categorías de producto para exenciones puras del símbolo
  (azúcar de mesa, aceites, fórmulas infantiles, etc.) — se declaran con un
  checkbox genérico.
- La Table of Reference Amounts por categoría de alimento: la cantidad de
  referencia se ingresa como dato directo.

## Fuentes legales

- Food and Drug Regulations (C.R.C., c. 870), Parte B, División 1 — B.01.401
  (Core Information) y B.01.350 (símbolo nutricional frontal).
- Table of Daily Values — documento incorporado por referencia, versión
  vigente 20 de octubre de 2022, obligatoria desde el 1 de enero de 2026.

## Archivos

- `calculo.js` — lógica pura (redondeo, %DV, umbrales del símbolo),
  testeable con Node.
- `app.js` — formulario, render de la tabla y del símbolo, exportación a PNG.
- `index.html`, `estilos.css` — interfaz.
- `prueba.js` — pruebas (`node prueba.js`).

## Pruebas

```
node prueba.js
```
