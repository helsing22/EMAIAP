/* ==========================================================================
   cart.js — Modelo de datos del carrito
   --------------------------------------------------------------------------
   - Persiste el carrito en localStorage bajo la clave "sc_cart_v2".
     (v2: se cambió la clave al actualizar el catálogo para que los
      carritos antiguos con datos de demostración no se mezclen).
   - Expone el objeto global `Cart` con métodos para:
       addItem(product), updateQty(productId, qty), removeItem(productId),
       clear(), getItems(), getCount(), getTotal(), toPlainLines().
   - También define la utilidad global `Money.format()` (formato monetario
     con separador de miles) usada por products.js y app.js: este archivo
     DEBE cargarse primero (ver orden de <script> en index.html).
   - No toca el DOM directamente: el módulo app.js escucha cambios y
     redibuja la UI.
   ========================================================================== */

(function (global) {
  "use strict";

  var STORAGE_KEY = "sc_cart_v2"; // clave de localStorage

  /* ---------- Utilidad compartida de formato monetario ---------- */
  // Devuelve el número con 2 decimales y separador de miles: 2250 -> "2,250.00"
  global.Money = {
    format: function (n) {
      var num = Number(n) || 0;
      return num.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  };

  /** Estado interno del carrito: array de {id, name, price, unit, qty}. */
  var items = load();

  /* ---------- Persistencia ---------- */
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // Si el JSON está corrupto, empezamos con carrito vacío
      console.warn("Cart: no se pudo leer localStorage:", e);
      return [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Cart: no se pudo guardar en localStorage:", e);
    }
  }

  /* ---------- API pública ---------- */

  /** Añade un producto al carrito (o incrementa su cantidad si ya existe). */
  function addItem(product) {
    if (!product || !product.id) return;
    var existing = findItem(product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        unit: product.unit || "",   // unidad de venta (KG, U, LITRO, LIBRA…)
        qty: 1
      });
    }
    save();
    notify();
  }

  /** Actualiza la cantidad de un producto. Si qty <= 0, lo elimina. */
  function updateQty(productId, qty) {
    var item = findItem(productId);
    if (!item) return;
    qty = parseInt(qty, 10);
    if (isNaN(qty) || qty <= 0) {
      removeItem(productId);
      return;
    }
    item.qty = qty;
    save();
    notify();
  }

  /** Elimina un producto del carrito. */
  function removeItem(productId) {
    items = items.filter(function (it) { return it.id !== productId; });
    save();
    notify();
  }

  /** Vacía el carrito por completo. */
  function clear() {
    items = [];
    save();
    notify();
  }

  /** Devuelve una copia del array de items (para no mutar el interno). */
  function getItems() {
    return items.slice();
  }

  /** Número total de unidades (suma de cantidades). */
  function getCount() {
    return items.reduce(function (sum, it) { return sum + it.qty; }, 0);
  }

  /** Total en dinero (suma de precio * cantidad). */
  function getTotal() {
    return items.reduce(function (sum, it) {
      return sum + it.price * it.qty;
    }, 0);
  }

  /** Devuelve líneas de texto plano para el mensaje de WhatsApp. */
  function toPlainLines() {
    return items.map(function (it) {
      var lineTotal = Money.format(it.price * it.qty);
      // Ejemplo: "2x Pollo (KG) — $4,600.00"
      var unit = it.unit ? " (" + it.unit + ")" : "";
      return it.qty + "x " + it.name + unit + " — $" + lineTotal;
    });
  }

  /* ---------- Utilidades internas ---------- */
  function findItem(id) {
    return items.find(function (it) { return it.id === id; }) || null;
  }

  /** Patrón observer muy simple para que la UI se redibuje al cambiar. */
  var listeners = [];
  function subscribe(fn) { listeners.push(fn); }
  function notify() {
    listeners.forEach(function (fn) {
      try { fn(); } catch (e) { console.error(e); }
    });
  }

  /* ---------- Exportar ---------- */
  global.Cart = {
    addItem: addItem,
    updateQty: updateQty,
    removeItem: removeItem,
    clear: clear,
    getItems: getItems,
    getCount: getCount,
    getTotal: getTotal,
    toPlainLines: toPlainLines,
    subscribe: subscribe
  };
})(window);
