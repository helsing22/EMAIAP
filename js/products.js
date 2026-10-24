/* ==========================================================================
   products.js — Carga y render del catálogo
   --------------------------------------------------------------------------
   ESTRATEGIA DE CARGA (doble respaldo):
     1) Intenta descargar data/products.json con fetch().
        → Funciona en GitHub Pages y en cualquier servidor HTTP.
     2) Si fetch() falla (pasa al abrir index.html con doble clic,
        protocolo file://, porque el navegador bloquea las peticiones
        de archivos locales por política CORS), usa los datos embebidos
        en data/products.js (variable global window.PRODUCTS_DATA),
        que se carga como <script> y sí funciona en file://.
     3) Solo si ambos mecanismos fallan, muestra el mensaje de error
        amigable (#errorBox).

   MANTENIMIENTO: edita data/products.json y regenera la copia de
   respaldo con:  python scripts/sync_products_js.py
   ========================================================================== */

(function (global) {
  "use strict";

  var DATA_URL = "data/products.json";

  var categories = [];
  var products = [];

  /* ======================================================================
     CARGA DE DATOS
     ====================================================================== */
  function load() {
    return fetch(DATA_URL)
      .then(function (res) {
        if (!res.ok) {
          throw new Error("HTTP " + res.status + " al cargar products.json");
        }
        return res.json();
      })
      .then(initData)
      .catch(function (err) {
        // Motivo más común: abrir la página con file:// (CORS bloquea fetch).
        console.warn(
          "products.js: no se pudo leer " + DATA_URL + " (" + err.message + "). " +
          "Usando respaldo local data/products.js…"
        );
        if (global.PRODUCTS_DATA) {
          try {
            initData(global.PRODUCTS_DATA);
          } catch (e2) {
            console.error("products.js: respaldo inválido:", e2);
            showError();
          }
        } else {
          showError();
        }
      });
  }

  /** Valida, ordena y renderiza los datos del catálogo. */
  function initData(data) {
    if (!data || !Array.isArray(data.categories) || !Array.isArray(data.products)) {
      throw new Error("Estructura de datos inválida");
    }
    categories = data.categories.slice().sort(function (a, b) {
      return (a.order || 0) - (b.order || 0);
    });
    products = data.products.slice();
    renderNav();
    renderCatalog();
  }

  /* ======================================================================
     RENDER: NAVEGACIÓN DE CATEGORÍAS
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
     RENDER: CATÁLOGO PRINCIPAL
     ====================================================================== */
  function renderCatalog() {
    var catalog = document.getElementById("catalog");
    if (!catalog) return;
    catalog.innerHTML = ""; // limpia el "Cargando…"

    categories.forEach(function (cat) {
      var prodsInCat = products.filter(function (p) { return p.category === cat.id; });
      if (prodsInCat.length === 0) return; // no muestra categorías vacías

      var section = document.createElement("section");
      section.className = "category-section";
      section.id = "cat-" + cat.id;

      var title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = cat.name;
      section.appendChild(title);

      // Descripción opcional de la categoría (campo "description" del JSON)
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

    // Precio + unidad de venta opcional (KG, U, LITRO, LIBRA…)
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
    btn.textContent = "Añadir al carrito";
    btn.addEventListener("click", function () {
      // El carrito vive en otro módulo (cart.js), disponible como window.Cart
      if (global.Cart) {
        global.Cart.addItem(product);
        // Feedback visual temporal
        var original = btn.textContent;
        btn.textContent = "✓ Añadido";
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

  /** Escape básico de HTML para valores insertados con innerHTML. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /** Muestra el mensaje de error amigable si nada funcionó. */
  function showError() {
    var loading = document.getElementById("loadingMsg");
    if (loading) loading.hidden = true;
    var box = document.getElementById("errorBox");
    if (box) box.hidden = false;
  }

  /* ======================================================================
     API PÚBLICA
     ====================================================================== */
  global.Products = {
    load: load,
    getAll: function () { return products.slice(); },
    getCategories: function () { return categories.slice(); }
  };
})(window);
