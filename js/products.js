/* ==========================================================================
   products.js — Carga y render del catálogo (v2 "Editorial Cómica")
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
     METADATOS VISUALES POR CATEGORÍA (emoji del chip y degradado de tarjeta)
     ====================================================================== */
  var CAT_META = {
    "carnicos":       { emoji: "🥩", art: "art-carnicos" },
    "carnicos-mpa":   { emoji: "🐄", art: "art-mpa" },
    "otros-carnicos": { emoji: "🌭", art: "art-otros" },
    "lacteos-dulces": { emoji: "🥛", art: "art-lacteos" },
    "agropecuarios":  { emoji: "🌱", art: "art-agro" }
  };
  var DEFAULT_META = { emoji: "🛒", art: "art-agro" };

  /* Stickers "⭐ Popular" en productos destacados (IDs reales del catálogo) */
  var POPULAR_IDS = {
    "mpa-pollo": true,
    "mpa-cortes-res-primera": true,
    "carn-masa-jamon": true,
    "lac-queso": true,
    "agr-frijol-negro": true,
    "carn-chorizo": true
  };

  /* ======================================================================
     EMOJIS POR PRODUCTO — busca palabras clave en el nombre;
     si no hay coincidencia, usa el emoji de su categoría.
     ====================================================================== */
  var EMOJI_RULES = [
    [/pollo/,        "🍗"],
    [/conejo/,       "🐰"],
    [/ovino/,        "🐑"],
    [/patas/,        "🐷"],
    [/hueso/,        "🦴"],
    [/ternilla/,     "🍖"],
    [/hamburguesa/,  "🍔"],
    [/chorizo/,      "🌭"],
    [/salchicha/,    "🌭"],
    [/morcilla/,     "🌭"],
    [/jam[oó]n/,     "🥓"],
    [/jamonada/,     "🥓"],
    [/mortadella/,   "🥓"],
    [/picadillo/,    "🥩"],
    [/h[ií]gado/,    "🍖"],
    [/lengua/,       "👅"],
    [/coraz[oó]n/,   "🫀"],
    [/panza/,        "🍲"],
    [/ri[nñ]on/,     "🍖"],
    [/bofe/,         "🍖"],
    [/pitrafa/,      "🍖"],
    [/rabo/,         "🍖"],
    [/res|banda/,    "🥩"],
    [/jab[oó]n/,     "🧼"],
    [/sangre/,       "🩸"],
    [/cueros/,       "🐄"],
    [/sebo/,         "🫙"],
    [/queso/,        "🧀"],
    [/yogur/,        "🥛"],
    [/vinagre/,      "🧴"],
    [/arroz/,        "🌾"],
    [/frijol/,       "🫘"],
    [/boniato/,      "🍠"],
    [/yuca/,         "🥔"],
    [/malanga/,      "🥔"],
    [/calabaza/,     "🎃"],
    [/pl[aá]tano/,   "🍌"],
    [/frutabomba/,   "🍈"],
    [/guayaba/,      "🍑"],
    [/lim[oó]n/,     "🍋"],
    [/mango/,        "🥭"],
    [/mel[oó]n/,     "🍈"],
    [/pi[nñ]a/,      "🍍"],
    [/toronja/,      "🍊"],
    [/n[ií]spero/,   "🍒"],
    [/carb[oó]n/,    "🪵"]
  ];

  function emojiFor(product) {
    var name = (product.name || "").toLowerCase();
    for (var i = 0; i < EMOJI_RULES.length; i++) {
      if (EMOJI_RULES[i][0].test(name)) return EMOJI_RULES[i][1];
    }
    var meta = CAT_META[product.category] || DEFAULT_META;
    return meta.emoji;
  }

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
    renderChips();
    renderCatalog();
  }

  /* ======================================================================
     RENDER: CHIPS DE CATEGORÍAS (sticky, con scrollspy en app.js)
     ====================================================================== */
  function renderChips() {
    var chips = document.getElementById("categoryChips");
    if (!chips) return;
    chips.innerHTML = "";
    categories.forEach(function (cat) {
      var meta = CAT_META[cat.id] || DEFAULT_META;
      var a = document.createElement("a");
      a.className = "chip";
      a.href = "#cat-" + cat.id;
      a.setAttribute("data-target", "cat-" + cat.id);

      var em = document.createElement("span");
      em.className = "chip-emoji";
      em.textContent = meta.emoji;
      em.setAttribute("aria-hidden", "true");

      a.appendChild(em);
      a.appendChild(document.createTextNode(cat.name));
      chips.appendChild(a);
    });
  }

  /* ======================================================================
     RENDER: CATÁLOGO PRINCIPAL
     ====================================================================== */
  function renderCatalog() {
    var catalog = document.getElementById("catalog-list");
    if (!catalog) return;
    catalog.innerHTML = ""; // limpia el "Cargando…"

    categories.forEach(function (cat) {
      var prodsInCat = products.filter(function (p) { return p.category === cat.id; });
      if (prodsInCat.length === 0) return; // no muestra categorías vacías

      var meta = CAT_META[cat.id] || DEFAULT_META;

      var section = document.createElement("section");
      section.className = "category-section";
      section.id = "cat-" + cat.id;

      // Cabecera: emoji + título + contador
      var head = document.createElement("div");
      head.className = "category-head";

      var em = document.createElement("span");
      em.className = "category-emoji";
      em.textContent = meta.emoji;
      em.setAttribute("aria-hidden", "true");
      head.appendChild(em);

      var title = document.createElement("h2");
      title.className = "category-title";
      title.textContent = cat.name;
      head.appendChild(title);

      var count = document.createElement("span");
      count.className = "category-count";
      count.textContent = prodsInCat.length + (prodsInCat.length === 1 ? " producto" : " productos");
      head.appendChild(count);

      section.appendChild(head);

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
        grid.appendChild(buildProductCard(p, meta));
      });

      section.appendChild(grid);
      catalog.appendChild(section);

      // Efectos de entrada + scrollspy (definidos en app.js)
      if (global.EMAIAP_UI) {
        if (typeof global.EMAIAP_UI.enhance === "function") global.EMAIAP_UI.enhance(section);
        if (typeof global.EMAIAP_UI.observeSection === "function") {
          global.EMAIAP_UI.observeSection(section, cat.id);
        }
      }
    });
  }

  /* ======================================================================
     CONSTRUYE UNA TARJETA DE PRODUCTO (estilo sticker)
     ====================================================================== */
  function buildProductCard(product, meta) {
    meta = meta || CAT_META[product.category] || DEFAULT_META;
    var emoji = emojiFor(product);

    var card = document.createElement("article");
    card.className = "product-card";

    /* --- Cabecera ilustrada --- */
    var art = document.createElement("div");
    art.className = "product-art " + meta.art;

    var artEmoji = document.createElement("span");
    artEmoji.className = "art-emoji";
    artEmoji.textContent = emoji;
    artEmoji.setAttribute("aria-hidden", "true");
    art.appendChild(artEmoji);

    var tag = document.createElement("span");
    tag.className = "art-tag";
    tag.textContent = "Disponible";
    art.appendChild(tag);

    if (POPULAR_IDS[product.id]) {
      var fav = document.createElement("span");
      fav.className = "art-fav";
      fav.textContent = "⭐ Popular";
      art.appendChild(fav);
    }

    card.appendChild(art);

    /* --- Cuerpo --- */
    var body = document.createElement("div");
    body.className = "product-body";

    var eyebrow = document.createElement("p");
    eyebrow.className = "product-eyebrow";
    var catName = categoryName(product.category);
    eyebrow.textContent = catName;

    var name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = product.name;

    body.appendChild(eyebrow);
    body.appendChild(name);

    if (product.description) {
      var desc = document.createElement("p");
      desc.className = "product-desc";
      desc.textContent = product.description;
      body.appendChild(desc);
    }

    // Precio + unidad de venta opcional (KG, U, LITRO, LIBRA…)
    var priceRow = document.createElement("div");
    priceRow.className = "product-price-row";

    var price = document.createElement("div");
    price.className = "product-price";
    price.innerHTML = formatMoney(product.price);
    if (product.unit) {
      var unit = document.createElement("span");
      unit.className = "product-unit";
      unit.textContent = "por " + product.unit.toLowerCase();
      price.appendChild(unit);
    }
    priceRow.appendChild(price);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-add";
    btn.setAttribute("aria-label", "Añadir " + product.name + " al carrito");
    btn.innerHTML = '<span class="plus" aria-hidden="true">+</span> Agregar';
    priceRow.appendChild(btn);

    body.appendChild(priceRow);
    card.appendChild(body);

    /* --- Interacción: añadir al carrito + feedback divertido --- */
    btn.addEventListener("click", function () {
      if (!global.Cart) return;
      global.Cart.addItem(product);

      // Feedback visual del botón
      btn.classList.add("ok");
      var plus = btn.querySelector(".plus");
      if (plus) plus.textContent = "✓";
      setTimeout(function () {
        btn.classList.remove("ok");
        if (plus) plus.textContent = "+";
      }, 900);

      // Efectos opcionales (definidos en app.js): emoji volador + toast
      if (global.EMAIAP_UI) {
        if (typeof global.EMAIAP_UI.flyToCart === "function") {
          global.EMAIAP_UI.flyToCart(btn, emoji);
        }
        if (typeof global.EMAIAP_UI.toast === "function") {
          global.EMAIAP_UI.toast(emoji + " " + product.name + " añadido");
        }
      }
    });

    return card;
  }

  /* ======================================================================
     UTILIDADES
     ====================================================================== */

  /** Nombre legible de una categoría por su id. */
  function categoryName(id) {
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) return categories[i].name;
    }
    return "";
  }

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
