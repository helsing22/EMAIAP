/* ==========================================================================
   products.js — Carga y render del catálogo
   --------------------------------------------------------------------------
   ESTRATEGIA DE CARGA (3 capas, fail-safe):
     1) Si existe window.PRODUCTS_DATA (cargada por data/products.js como
        <script> en el HTML), la usa directamente. Es el camino mas rapido
        y funciona en file://, http:// y https://.
     2) Si no, intenta descargar data/products.json con fetch().
        Funciona en GitHub Pages y en cualquier servidor HTTP.
     3) Si fetch() tambien falla, usa el catalogo EMBEBIDO en este archivo
        (CATALOG_EMBED, mas abajo). Garantia absoluta de que la tienda
        siempre muestre productos aunque el navegador bloquee fetch() Y
        data/products.js no se haya cargado.
     4) Solo si todo lo anterior falla, muestra el mensaje de error (#errorBox).

   MANTENIMIENTO: edita data/products.json y vuelve a ejecutar
   python scripts/sync_products_js.py (o pega el JSON nuevo en CATALOG_EMBED).
   ========================================================================== */

(function (global) {
  "use strict";

  var DATA_URL = "data/products.json";

  var categories = [];
  var products = [];

  /* ======================================================================
     CATALOGO EMBEDIDO — copia literal de data/products.json
     ======================================================================
     Ultima linea de defensa: si ni fetch() ni window.PRODUCTS_DATA estan
     disponibles, este literal garantiza que los productos se muestren.
     ====================================================================== */
  var CATALOG_EMBED = {
  "categories": [
    {
      "id": "carnicos",
      "name": "Productos Cárnicos",
      "order": 1,
      "description": "Oferta de productos cárnicos de la empresa. Precios en Moneda Nacional (CUP)."
    },
    {
      "id": "carnicos-mpa",
      "name": "Cárnicos — Materia Prima Adquirida",
      "order": 2,
      "description": "Productos cárnicos con materia prima adquirida o de sobrecumplimiento."
    },
    {
      "id": "otros-carnicos",
      "name": "Otros Productos",
      "order": 3,
      "description": "Otros productos disponibles de la sección cárnica."
    },
    {
      "id": "lacteos-dulces",
      "name": "Lácteos, Dulces y Conservas",
      "order": 4,
      "description": "Producción de la mini industria láctea, dulces y conservas. M.P.A. = materia prima adquirida."
    },
    {
      "id": "agropecuarios",
      "name": "Productos Agropecuarios",
      "order": 5,
      "description": "Viandas, hortalizas, frutas, granos y otros. Oferta pendiente de concertación: los precios pueden variar."
    }
  ],
  "products": [
    {
      "id": "carn-ternilla",
      "name": "Ternilla",
      "price": 200.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Carne de res joven en cortes listos para elaborar."
    },
    {
      "id": "carn-hueso-rojo",
      "name": "Hueso Rojo",
      "price": 200.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Hueso de res con médula roja, ideal para caldos y sopas."
    },
    {
      "id": "carn-hueso-blanco",
      "name": "Hueso Blanco",
      "price": 100.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Hueso de res para caldos, precio por kilogramo."
    },
    {
      "id": "carn-patas",
      "name": "Patas",
      "price": 15.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Patas de res, base para caldos y gelatinas naturales."
    },
    {
      "id": "carn-masa-hamburguesa",
      "name": "Masa de Hamburguesa",
      "price": 710.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Masa condimentada lista para formar hamburguesas."
    },
    {
      "id": "carn-masa-chorizo",
      "name": "Masa Chorizo",
      "price": 1000.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Masa de chorizo condimentada lista para embutir."
    },
    {
      "id": "carn-masa-jamon",
      "name": "Masa Jamón",
      "price": 1200.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Masa para la elaboración de jamón."
    },
    {
      "id": "carn-higado",
      "name": "Hígado",
      "price": 800.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Hígado de res fresco, rico en hierro."
    },
    {
      "id": "carn-mortadella",
      "name": "Mortadella",
      "price": 1200.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Embutido tipo mortadella, precio por kilogramo."
    },
    {
      "id": "carn-chorizo",
      "name": "Chorizo",
      "price": 1450.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Chorizo elaborado en la empresa."
    },
    {
      "id": "carn-corazon",
      "name": "Corazón",
      "price": 800.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Corazón de res fresco."
    },
    {
      "id": "carn-lengua",
      "name": "Lengua",
      "price": 800.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Lengua de res lista para cocinar."
    },
    {
      "id": "carn-jabon-lavar",
      "name": "Jabón de Lavar",
      "price": 100.0,
      "category": "carnicos",
      "unit": "U",
      "description": "Jabón de lavar producido por la empresa."
    },
    {
      "id": "carn-bofe",
      "name": "Bofe",
      "price": 25.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Bofe (pulmón) de res fresco."
    },
    {
      "id": "carn-pitrafa",
      "name": "Pitrafa",
      "price": 50.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Pitrafa de res fresca."
    },
    {
      "id": "carn-rinon",
      "name": "Riñón",
      "price": 50.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Riñón de res fresco."
    },
    {
      "id": "carn-rabo-troceado",
      "name": "Rabo Troceado",
      "price": 250.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Rabo de res troceado, ideal para sopas y guisos."
    },
    {
      "id": "carn-jamonada",
      "name": "Jamonada",
      "price": 1300.0,
      "category": "carnicos",
      "unit": "KG",
      "description": "Jamonada elaborada en la empresa."
    },
    {
      "id": "carn-panza",
      "name": "Panza",
      "price": 150.0,
      "category": "carnicos",
      "unit": "U",
      "description": "Panza de res, precio por unidad (Anexo 1, tabla principal)."
    },
    {
      "id": "mpa-cortes-res-primera",
      "name": "Cortes varios de Res Primera",
      "price": 2250.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Selección de cortes de res de primera calidad."
    },
    {
      "id": "mpa-picadillo-res-primera",
      "name": "Picadillo de Res Primera",
      "price": 1600.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Picadillo de res de primera calidad."
    },
    {
      "id": "mpa-cortes-res-segunda",
      "name": "Cortes varios de Res Segunda",
      "price": 1830.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Cortes de res de segunda calidad a mejor precio."
    },
    {
      "id": "mpa-picadillo-res-segunda",
      "name": "Picadillo de Res Segunda",
      "price": 710.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Picadillo de res de segunda calidad."
    },
    {
      "id": "mpa-higado-res",
      "name": "Hígado de Res",
      "price": 800.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Hígado de res con materia prima adquirida."
    },
    {
      "id": "mpa-rabo-troceado-res",
      "name": "Rabo Troceado Res",
      "price": 800.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Rabo de res troceado, materia prima adquirida."
    },
    {
      "id": "mpa-lengua-res",
      "name": "Lengua Res",
      "price": 800.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Lengua de res, materia prima adquirida."
    },
    {
      "id": "mpa-corazon-res",
      "name": "Corazón Res",
      "price": 800.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Corazón de res, materia prima adquirida."
    },
    {
      "id": "mpa-conejo-canal",
      "name": "Conejo Canal (Calidad Única)",
      "price": 1800.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Conejo en canal, calidad única."
    },
    {
      "id": "mpa-ovino-canal",
      "name": "Ovino Canal (Calidad Única)",
      "price": 2800.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Ovino en canal, calidad única."
    },
    {
      "id": "mpa-pollo",
      "name": "Pollo",
      "price": 2300.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Pollo fresco, precio por kilogramo."
    },
    {
      "id": "mpa-res-en-banda",
      "name": "Carne de Res en Banda",
      "price": 2000.0,
      "category": "carnicos-mpa",
      "unit": "KG",
      "description": "Carne de res en banda, sin deshuesar."
    },
    {
      "id": "otros-panza",
      "name": "Panza",
      "price": 1300.0,
      "category": "otros-carnicos",
      "unit": "U",
      "description": "Panza de res listada en Otros Productos de la sección cárnica. Precio por unidad."
    },
    {
      "id": "otros-morcilla",
      "name": "Morcilla",
      "price": 150.0,
      "category": "otros-carnicos",
      "unit": "U",
      "description": "Morcilla elaborada en la empresa."
    },
    {
      "id": "otros-sangre",
      "name": "Sangre",
      "price": 50.0,
      "category": "otros-carnicos",
      "unit": "U",
      "description": "Sangre de res para platos tradicionales."
    },
    {
      "id": "otros-cueros",
      "name": "Cueros",
      "price": 30.0,
      "category": "otros-carnicos",
      "unit": "U",
      "description": "Cuero de res, precio por unidad."
    },
    {
      "id": "otros-sebo",
      "name": "Sebo",
      "price": 50.0,
      "category": "otros-carnicos",
      "unit": "LITRO",
      "description": "Sebo, precio por litro."
    },
    {
      "id": "otros-picadillo-especial",
      "name": "Picadillo Especial",
      "price": 2000.0,
      "category": "otros-carnicos",
      "unit": "U",
      "description": "Picadillo especial de alta calidad, precio por unidad."
    },
    {
      "id": "otros-salchicha",
      "name": "Salchicha",
      "price": 1500.0,
      "category": "otros-carnicos",
      "unit": "KG",
      "description": "Salchicha elaborada en la empresa."
    },
    {
      "id": "lac-yogurt-natural",
      "name": "Yogurt Natural",
      "price": 350.0,
      "category": "lacteos-dulces",
      "unit": "LITRO",
      "description": "Yogurt natural de la mini industria láctea."
    },
    {
      "id": "lac-vinagre",
      "name": "Vinagre",
      "price": 300.0,
      "category": "lacteos-dulces",
      "unit": "LITRO",
      "description": "Vinagre producido en la mini industria."
    },
    {
      "id": "lac-queso",
      "name": "Queso",
      "price": 350.0,
      "category": "lacteos-dulces",
      "unit": "LIBRA",
      "description": "Queso fresco de producción propia."
    },
    {
      "id": "lac-yogurt-natural-mpa",
      "name": "Yogurt Natural (M.P.A.)",
      "price": 420.0,
      "category": "lacteos-dulces",
      "unit": "LITRO",
      "description": "Yogurt natural elaborado con materia prima adquirida."
    },
    {
      "id": "lac-queso-mpa",
      "name": "Queso (M.P.A.)",
      "price": 400.0,
      "category": "lacteos-dulces",
      "unit": "LIBRA",
      "description": "Queso elaborado con materia prima adquirida."
    },
    {
      "id": "agr-boniato",
      "name": "Boniato",
      "price": 180.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Vianda fresca beneficiada, lista para cocinar."
    },
    {
      "id": "agr-yuca-pelada",
      "name": "Yuca pelada congelada",
      "price": 200.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Yuca pelada y congelada, lista para su uso."
    },
    {
      "id": "agr-calabaza",
      "name": "Calabaza beneficiada",
      "price": 160.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Calabaza limpia y beneficiada."
    },
    {
      "id": "agr-platano-manzano",
      "name": "Plátano fruta manzano",
      "price": 175.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Plátano manzano desmanado y beneficiado."
    },
    {
      "id": "agr-platano-fruta",
      "name": "Plátano fruta",
      "price": 185.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Plátano fruta desmanado y beneficiado."
    },
    {
      "id": "agr-platano-burro",
      "name": "Plátano burro",
      "price": 145.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Plátano burro desmanado y beneficiado."
    },
    {
      "id": "agr-platano-vianda",
      "name": "Plátano vianda",
      "price": 200.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Plátano vianda desmanado y beneficiado."
    },
    {
      "id": "agr-malanga-colocasia",
      "name": "Malanga Colocasia",
      "price": 175.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Malanga colocasia beneficiada."
    },
    {
      "id": "agr-malanga-xantosoma",
      "name": "Malanga Xantosoma",
      "price": 185.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Malanga xantosoma beneficiada."
    },
    {
      "id": "agr-frijol-negro",
      "name": "Frijol Negro",
      "price": 1050.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Frijol negro seleccionado."
    },
    {
      "id": "agr-frijol-colorado",
      "name": "Frijol Colorado",
      "price": 1150.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Frijol colorado seleccionado."
    },
    {
      "id": "agr-frijol-blanco",
      "name": "Frijol Blanco",
      "price": 1200.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Frijol blanco seleccionado."
    },
    {
      "id": "agr-frutabomba",
      "name": "Frutabomba madura",
      "price": 145.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Frutabomba beneficiada y madura."
    },
    {
      "id": "agr-guayaba",
      "name": "Guayaba",
      "price": 155.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Guayaba beneficiada."
    },
    {
      "id": "agr-limon-primera",
      "name": "Limón Primera",
      "price": 900.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Limón de primera calidad."
    },
    {
      "id": "agr-limon-segunda",
      "name": "Limón Segunda",
      "price": 740.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Limón de segunda calidad."
    },
    {
      "id": "agr-mango-primera",
      "name": "Mango Primera",
      "price": 140.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Mango de primera calidad."
    },
    {
      "id": "agr-mango-segunda",
      "name": "Mango Segunda",
      "price": 120.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Mango de segunda calidad."
    },
    {
      "id": "agr-melon-primera",
      "name": "Melón Primera",
      "price": 165.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Melón de primera calidad."
    },
    {
      "id": "agr-melon-segunda",
      "name": "Melón Segunda",
      "price": 150.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Melón de segunda calidad."
    },
    {
      "id": "agr-pina-primera",
      "name": "Piña Primera",
      "price": 170.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Piña de primera calidad."
    },
    {
      "id": "agr-pina-segunda",
      "name": "Piña Segunda",
      "price": 155.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Piña de segunda calidad."
    },
    {
      "id": "agr-toronja-primera",
      "name": "Toronja Primera",
      "price": 200.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Toronja de primera calidad."
    },
    {
      "id": "agr-toronja-segunda",
      "name": "Toronja Segunda",
      "price": 190.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Toronja de segunda calidad."
    },
    {
      "id": "agr-nispero-primera",
      "name": "Níspero Primera",
      "price": 230.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Níspero de primera calidad."
    },
    {
      "id": "agr-nispero-segunda",
      "name": "Níspero Segunda",
      "price": 215.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Níspero de segunda calidad."
    },
    {
      "id": "agr-carbon-vegetal",
      "name": "Carbón Vegetal",
      "price": 130.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Carbón vegetal, precio por kilogramo."
    },
    {
      "id": "agr-carbon-marabu",
      "name": "Carbón Marabú Primera",
      "price": 86.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Carbón de marabú clasificado de primera calidad."
    },
    {
      "id": "agr-carbon-mezcla",
      "name": "Carbón Mezcla Marabú",
      "price": 117.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Carbón de marabú clasificado: 70% primera + 30% segunda."
    },
    {
      "id": "agr-carbon-diferenciado",
      "name": "Carbón Precio Diferenciado",
      "price": 1600.0,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Carbón con precio diferenciado."
    },
    {
      "id": "agr-arroz-consumo",
      "name": "Arroz de Consumo",
      "price": 760.87,
      "category": "agropecuarios",
      "unit": "KG",
      "description": "Arroz de consumo nacional."
    }
  ]
};

  /* ======================================================================
     CARGA DE DATOS
     ====================================================================== */
  function load() {
    // Capa 1: respaldo embebido en data/products.js (cargado como <script>)
    if (global.PRODUCTS_DATA) {
      try {
        initData(global.PRODUCTS_DATA);
        console.info("products.js: catalogo cargado desde window.PRODUCTS_DATA");
        return Promise.resolve();
      } catch (e) {
        console.warn("products.js: window.PRODUCTS_DATA invalido:", e);
      }
    }

    // Capa 2: fetch del JSON
    return fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status + " al cargar products.json");
        }
        return res.json();
      })
      .then(function (data) {
        console.info("products.js: catalogo cargado desde " + DATA_URL);
        initData(data);
      })
      .catch(function (err) {
        console.warn(
          "products.js: no se pudo leer " + DATA_URL + " (" + (err && err.message ? err.message : err) + "). " +
          "Usando catalogo embebido en este archivo..."
        );
        // Capa 3: catalogo embebido en este propio js/products.js
        try {
          initData(CATALOG_EMBED);
          console.info("products.js: catalogo cargado desde CATALOG_EMBED");
        } catch (e2) {
          console.error("products.js: catalogo embebido invalido:", e2);
          showError();
        }
      });
  }

  /** Valida, ordena y renderiza los datos del catalogo. */
  function initData(data) {
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
      throw new Error("Estructura de datos invalida");
    }
    categories = data.categories.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    products = data.products.slice();
    renderNav();
    renderCatalog();
  }

  /* ======================================================================
     RENDER: NAVEGACION DE CATEGORIAS
     ====================================================================== */
  function renderNav() {
    var nav = document.getElementById("navCategories");
    if (!nav) return;
    nav.innerHTML = "";
    categories.forEach(function (cat) {
      var a = document.createElement("a");
      a.href = "#cat-" + cat.id;
      a.textContent = cat.name;
      nav.appendChild(a);
    });
  }

  /* ======================================================================
     RENDER: CATALOGO PRINCIPAL
     ====================================================================== */
  function renderCatalog() {
    var catalog = document.getElementById("catalog");
    if (!catalog) return;
    catalog.innerHTML = ""; // limpia el "Cargando..."

    categories.forEach(function (cat) {
      var prodsInCat = products.filter(function (p) { return p.category === cat.id; });
      if (prodsInCat.length === 0) return; // no muestra categorias vacias

      var section = document.createElement("section");
      section.className = "category-section";
      section.id = "cat-" + cat.id;

      var title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = cat.name;
      section.appendChild(title);

      // Descripcion opcional de la categoria (campo "description" del JSON)
      if (cat.description) {
        var desc = document.createElement("p");
        desc.className = "category-desc";
        desc.textContent = cat.description;
        section.appendChild(desc);
      }

      var grid = document.createElement("div");
      grid.className = "product-grid";

      prodsInCat.forEach(function (p) {
        grid.appendChild(buildProductCard(p));
      });

      section.appendChild(grid);
      catalog.appendChild(section);
    });
  }

  /* ======================================================================
     CONSTRUYE UNA TARJETA DE PRODUCTO
     ====================================================================== */
  function buildProductCard(product) {
    var card = document.createElement("article");
    card.className = "product-card";

    var name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.name;

    var desc = document.createElement("p");
    desc.className = "product-desc";
    desc.textContent = product.description || "";

    // Precio + unidad de venta opcional (KG, U, LITRO, LIBRA...)
    var price = document.createElement("div");
    price.className = "product-price";
    if (product.unit) {
      price.innerHTML =
        formatMoney(product.price) +
        ' <span class="product-unit">/ ' + escapeHtml(product.unit) + "</span>";
    } else {
      price.textContent = formatMoney(product.price);
    }

    var btn = document.createElement("button");
    btn.className = "btn btn-primary btn-block";
    btn.type = "button";
    btn.textContent = "A\u00f1adir al carrito";
    btn.addEventListener("click", function () {
      // El carrito vive en otro modulo (cart.js), disponible como window.Cart
      if (global.Cart) {
        global.Cart.addItem(product);
        // Feedback visual temporal
        var original = btn.textContent;
        btn.textContent = "\u2713 A\u00f1adido";
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = original;
          btn.disabled = false;
        }, 900);
      }
    });

    card.appendChild(name);
    if (product.description) card.appendChild(desc);
    card.appendChild(price);
    card.appendChild(btn);
    return card;
  }

  /* ======================================================================
     UTILIDADES
     ====================================================================== */

  /**
   * Formato monetario con 2 decimales y separador de miles.
   * Usa la utilidad global Money (definida en cart.js, que se carga antes);
   * si no estuviera disponible, cae a un formato simple.
   */
  function formatMoney(n) {
    if (global.Money && typeof global.Money.format === "function") {
      return global.Money.format(n);
    }
    return (Number(n) || 0).toFixed(2);
  }

  /** Escape basico de HTML para valores insertados con innerHTML. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Muestra el mensaje de error amigable si nada funciono. */
  function showError() {
    var loading = document.getElementById("loadingMsg");
    if (loading) loading.hidden = true;
    var box = document.getElementById("errorBox");
    if (box) box.hidden = false;
  }

  /* ======================================================================
     API PUBLICA
     ====================================================================== */
  global.Products = {
    load: load,
    getAll: function () { return products.slice(); },
    getCategories: function () { return categories.slice(); }
  };
})(window);
