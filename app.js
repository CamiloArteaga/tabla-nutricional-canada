// DOM: formulario, render de la NFT y del símbolo frontal, persistencia.

const CAMPOS_100 = C.CORE_INFO.filter((n) => n.k !== "satTransDV");
const CLAVE_STORAGE = "tabla-nutricional-canada";

function construirCamposNutrientes() {
  const contenedor = document.getElementById("campos-nutrientes");
  for (const item of CAMPOS_100) {
    const label = document.createElement("label");
    label.textContent = `${item.nombre} (${item.unidad || "g"})`;
    const input = document.createElement("input");
    input.type = "number";
    input.step = "any";
    input.min = "0";
    input.id = `n-${item.k}`;
    input.value = "0";
    label.appendChild(input);
    contenedor.appendChild(label);
  }
}

function leerFormulario() {
  const valores100 = {};
  for (const item of CAMPOS_100) {
    valores100[item.k] =
      parseFloat(document.getElementById(`n-${item.k}`).value) || 0;
  }
  return {
    producto: document.getElementById("producto").value,
    porcionTexto: document.getElementById("porcion-texto").value,
    porcionValor:
      parseFloat(document.getElementById("porcion-valor").value) || 0,
    cantidadReferencia:
      parseFloat(document.getElementById("cantidad-referencia").value) || 0,
    valores100,
    opciones: {
      platoPrincipal: document.getElementById("es-plato-principal").checked,
      ninos1a4: document.getElementById("es-ninos").checked,
      envaseChico: document.getElementById("envase-chico").checked,
      frutaHortalizaSinAdicion:
        document.getElementById("fruta-sin-adicion").checked,
      quesoOYogurConCalcioSuficiente:
        document.getElementById("queso-yogur-calcio").checked,
      quesoEsExentoDeSodio:
        document.getElementById("queso-exento-sodio").checked,
      exentoPorCategoria: document.getElementById("exento-categoria").checked,
    },
  };
}

function fila(nombre, valorTexto, pctTexto, opts = {}) {
  const negrilla = opts.negrilla ? " negrilla" : "";
  const indentado = opts.indentado ? " indentado" : "";
  const pct = pctTexto != null ? `<span class="pct">${pctTexto}</span>` : "";
  return `<div class="fila${negrilla}${indentado}"><span class="nombre">${nombre}${valorTexto ? " " + valorTexto : ""}</span>${pct}</div>`;
}

function pintarNFT(datos, res) {
  const d = res.declarado;
  const p = res.porcentajes;
  const porciones = datos.porcionTexto
    ? `Serving Size ${datos.porcionTexto}`
    : "";

  let html = `<div class="marco-nft">`;
  html += `<h2>Nutrition Facts</h2>`;
  if (porciones) html += `<p class="porcion">${porciones}</p>`;
  html += `<hr class="gruesa" />`;
  html += `<div class="fila calorias"><span class="nombre">Calories</span><span class="valor-calorias">${d.cal}</span></div>`;
  html += `<hr class="gruesa" />`;
  html += `<div class="fila encabezado-dv"><span></span><span>% Daily Value*</span></div>`;
  html += fila("Fat", `${d.fat} g`, `${p.fat}%`, { negrilla: true });
  html += fila("Saturated Fat", `${d.sat} g`, null, { indentado: true });
  html += fila("+ Trans Fat", `${d.trans} g`, `${p.satTransDV}%`, {
    indentado: true,
    negrilla: true,
  });
  html += fila("Cholesterol", `${d.chol} mg`, `${p.chol}%`);
  html += fila("Sodium", `${d.na} mg`, `${p.na}%`, { negrilla: true });
  html += fila("Carbohydrate", `${d.cho} g`);
  html += fila("Fibre", `${d.fibre} g`, `${p.fibre}%`, { indentado: true });
  html += fila("Sugars", `${d.sugars} g`, `${p.sugars}%`, {
    indentado: true,
    negrilla: true,
  });
  html += fila("Protein", `${d.prot} g`);
  html += `<hr class="fina" />`;
  html += fila("Potassium", `${d.pot} mg`, `${p.pot}%`);
  html += fila("Calcium", `${d.ca} mg`, `${p.ca}%`);
  html += fila("Iron", `${d.fe} mg`, `${p.fe}%`);
  html += `<hr class="fina" />`;
  html += `<p class="nota-dv">*5% or less is a little, 15% or more is a lot</p>`;
  html += `</div>`;

  document.getElementById("tabla-nutricional").innerHTML = html;
}

// Cholesterol %DV es opcional (B.01.401): este primer commit siempre lo
// calcula y lo muestra; ocultarlo condicionalmente queda para si se pide.

function pintarSimbolo(disparados) {
  const cont = document.getElementById("simbolo-frontal");
  if (disparados.size === 0) {
    cont.innerHTML = `<p class="sin-simbolo">No symbol triggered.</p>`;
    return;
  }
  const NOMBRES = { satTrans: "Saturated Fat", sugars: "Sugars", na: "Sodium" };
  const lista = [...disparados].map((k) => NOMBRES[k]).join(", ");
  cont.innerHTML = `
    <div class="simbolo">
      <div class="lupa">🔍</div>
      <div class="texto-simbolo">
        <div class="high-in">High in</div>
        <div class="nutrientes-simbolo">${lista}</div>
      </div>
      <div class="firma">Health Canada</div>
    </div>
  `;
}

function recalcular() {
  const datos = leerFormulario();
  const res = C.calcular(datos.valores100, datos.porcionValor);
  pintarNFT(datos, res);

  const disparados = C.calcularSimbolo(
    datos.valores100,
    datos.porcionValor,
    datos.cantidadReferencia,
    datos.opciones,
  );
  pintarSimbolo(disparados);

  guardar(datos);
}

function guardar(datos) {
  try {
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(datos));
  } catch (e) {
    // localStorage puede fallar (ventana privada, storage bloqueado); no es crítico.
  }
}

function restaurar() {
  let datos;
  try {
    datos = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
  } catch (e) {
    datos = null;
  }
  if (!datos) return;

  document.getElementById("producto").value = datos.producto || "";
  document.getElementById("porcion-texto").value = datos.porcionTexto || "";
  document.getElementById("porcion-valor").value = datos.porcionValor || "";
  document.getElementById("cantidad-referencia").value =
    datos.cantidadReferencia || "";
  for (const item of CAMPOS_100) {
    const v = datos.valores100 && datos.valores100[item.k];
    if (v != null) document.getElementById(`n-${item.k}`).value = v;
  }
  if (datos.opciones) {
    document.getElementById("es-plato-principal").checked =
      !!datos.opciones.platoPrincipal;
    document.getElementById("es-ninos").checked = !!datos.opciones.ninos1a4;
    document.getElementById("envase-chico").checked =
      !!datos.opciones.envaseChico;
    document.getElementById("fruta-sin-adicion").checked =
      !!datos.opciones.frutaHortalizaSinAdicion;
    document.getElementById("queso-yogur-calcio").checked =
      !!datos.opciones.quesoOYogurConCalcioSuficiente;
    document.getElementById("queso-exento-sodio").checked =
      !!datos.opciones.quesoEsExentoDeSodio;
    document.getElementById("exento-categoria").checked =
      !!datos.opciones.exentoPorCategoria;
  }
}

function descargarPng(elementId, nombreArchivo) {
  const el = document.getElementById(elementId);
  html2canvas(el).then((canvas) => {
    const enlace = document.createElement("a");
    enlace.download = nombreArchivo;
    enlace.href = canvas.toDataURL("image/png");
    enlace.click();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  construirCamposNutrientes();
  restaurar();
  recalcular();

  document
    .getElementById("form-nutrientes")
    .addEventListener("input", recalcular);
  document
    .getElementById("form-nutrientes")
    .addEventListener("change", recalcular);
  document.getElementById("btn-descargar").addEventListener("click", () => {
    descargarPng("tabla-nutricional", "nutrition-facts-canada.png");
  });
  document
    .getElementById("btn-descargar-simbolo")
    .addEventListener("click", () => {
      descargarPng("simbolo-frontal", "high-in-symbol-canada.png");
    });
});
