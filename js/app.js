/* ==========================================================================
   app.js — Orquestador de la UI
   --------------------------------------------------------------------------
   Responsabilidades:
     - Inicializar la app al cargar el DOM.
     - Abrir/cerrar el drawer del carrito y los modales.
     - Renderizar el contenido del carrito cuando cambia.
     - Gestionar el flujo de checkout y la generación del mensaje de WhatsApp.
     - Mostrar la pantalla de confirmación tras enviar el pedido.

   Depende de:
     - window.Cart   (definido en cart.js)
     - window.Products (definido en products.js)
   ========================================================================== */

(function () {
  "use strict";

  /* ======================================================================
     ⚠️ CONFIGURACIÓN — Cambia aquí tu número de WhatsApp
     ======================================================================
     Usa el formato internacional SIN signos, espacios ni "+".
     Ejemplo: para +53 55555555 escribe "5355555555".
     ====================================================================== */
  var WHATSAPP_NUMBER = "5355555555";

  /* ---------- Referencias del DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };

  var cartToggleBtn = $("cartToggle");
  var cartCloseBtn  = $("cartClose");
  var cartDrawer    = $("cartDrawer");
  var cartOverlay   = $("cartOverlay");
  var cartBody      = $("cartBody");
  var cartEmptyMsg  = $("cartEmpty");
  var cartCountEl   = $("cartCount");
  var cartTotalEl   = $("cartTotal");
  var checkoutBtn   = $("checkoutBtn");

  var checkoutOverlay = $("checkoutOverlay");
  var checkoutClose   = $("checkoutClose");
  var checkoutCancel  = $("checkoutCancel");
  var confirmOrderBtn = $("confirmOrderBtn");
  var checkoutSummary = $("checkoutSummary");
  var customerNameInp = $("customerName");
  var checkoutForm    = $("checkoutForm");

  var confirmOverlay  = $("confirmOverlay");
  var confirmCloseBtn = $("confirmCloseBtn");

  /* ---------- Init ---------- */
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // Año en el footer
    var yearEl = $("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Carga del catálogo
    if (window.Products) window.Products.load();

    // Suscribirse a cambios del carrito para redibujar
    if (window.Cart) window.Cart.subscribe(renderCart);

    // Listeners de UI
    bindCartUI();
    bindCheckoutUI();
    bindConfirmUI();
    bindEscToClose();
    bindCopyButtons();

    // Render inicial
    renderCart();
  }

  /* ======================================================================
     BOTONES DE COPIAR TARJETAS BANCARIAS (sección Contacto y pagos)
     ====================================================================== */
  function bindCopyButtons() {
    var buttons = document.querySelectorAll(".btn-copiar");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var value = btn.getAttribute("data-copy");
        if (!value) return;
        copyToClipboard(value);
        // Feedback visual: cambiar icono a check y volver
        var originalHTML = btn.innerHTML;
        btn.classList.add("copiado");
        btn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        setTimeout(function () {
          btn.classList.remove("copiado");
          btn.innerHTML = originalHTML;
        }, 1400);
      });
    });
  }

  /** Copia al portapapeles con fallback para navegadores sin navigator.clipboard */
  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {
        legacyCopy(text);
      });
    } else {
      legacyCopy(text);
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ======================================================================
     CARRITO — Abrir / cerrar drawer
     ====================================================================== */
  function bindCartUI() {
    cartToggleBtn.addEventListener("click", openCart);
    cartCloseBtn.addEventListener("click", closeCart);
    cartOverlay.addEventListener("click", closeCart);
  }

  function openCart() {
    cartOverlay.hidden = false;
    // Forzamos reflow para que la transición se aplique
    void cartOverlay.offsetWidth;
    cartOverlay.classList.add("is-visible");
    cartDrawer.classList.add("is-open");
    cartDrawer.setAttribute("aria-hidden", "false");
  }

  function closeCart() {
    cartOverlay.classList.remove("is-visible");
    cartDrawer.classList.remove("is-open");
    cartDrawer.setAttribute("aria-hidden", "true");
    // Esperamos a que termine la transición antes de ocultar el overlay
    setTimeout(function () { cartOverlay.hidden = true; }, 250);
  }

  /* ======================================================================
     RENDER DEL CARRITO
     ====================================================================== */
  function renderCart() {
    if (!window.Cart) return;
    var items = Cart.getItems();
    var count = Cart.getCount();
    var total = Cart.getTotal();

    // Contador del icono
    cartCountEl.textContent = count;
    cartCountEl.setAttribute("data-count", String(count));

    // Total (Money.format añade separador de miles)
    cartTotalEl.textContent = "$" + fmt(total);

    // Botón de checkout (deshabilitado si vacío)
    checkoutBtn.disabled = items.length === 0;

    // Cuerpo del carrito
    cartBody.innerHTML = "";
    if (items.length === 0) {
      cartBody.appendChild(cartEmptyMsg);
      return;
    }

    items.forEach(function (it) {
      cartBody.appendChild(buildCartItem(it));
    });
  }

  function buildCartItem(item) {
    var row = document.createElement("div");
    row.className = "cart-item";

    var name = document.createElement("div");
    name.className = "cart-item-name";
    name.textContent = item.name;

    var removeBtn = document.createElement("button");
    removeBtn.className = "cart-item-remove";
    removeBtn.type = "button";
    removeBtn.setAttribute("aria-label", "Eliminar " + item.name);
    removeBtn.innerHTML = "&times;";
    removeBtn.addEventListener("click", function () {
      Cart.removeItem(item.id);
    });

    var controls = document.createElement("div");
    controls.className = "cart-item-controls";

    var minusBtn = document.createElement("button");
    minusBtn.className = "qty-btn";
    minusBtn.type = "button";
    minusBtn.setAttribute("aria-label", "Disminuir cantidad");
    minusBtn.textContent = "−";
    minusBtn.addEventListener("click", function () {
      Cart.updateQty(item.id, item.qty - 1);
    });

    var qtyInput = document.createElement("input");
    qtyInput.className = "qty-input";
    qtyInput.type = "number";
    qtyInput.value = item.qty;
    qtyInput.min = 1;
    qtyInput.setAttribute("aria-label", "Cantidad de " + item.name);
    qtyInput.addEventListener("change", function () {
      var v = parseInt(qtyInput.value, 10);
      if (isNaN(v)) v = 1;
      Cart.updateQty(item.id, v);
    });

    var plusBtn = document.createElement("button");
    plusBtn.className = "qty-btn";
    plusBtn.type = "button";
    plusBtn.setAttribute("aria-label", "Aumentar cantidad");
    plusBtn.textContent = "+";
    plusBtn.addEventListener("click", function () {
      Cart.updateQty(item.id, item.qty + 1);
    });

    var price = document.createElement("span");
    price.className = "cart-item-price";
    price.textContent = "$" + fmt(item.price * item.qty);

    controls.appendChild(minusBtn);
    controls.appendChild(qtyInput);
    controls.appendChild(plusBtn);
    controls.appendChild(price);

    row.appendChild(name);
    row.appendChild(removeBtn);
    row.appendChild(controls);
    return row;
  }

  /* ======================================================================
     CHECKOUT
     ====================================================================== */
  function bindCheckoutUI() {
    checkoutBtn.addEventListener("click", openCheckout);
    checkoutClose.addEventListener("click", closeCheckout);
    checkoutCancel.addEventListener("click", closeCheckout);
    checkoutOverlay.addEventListener("click", function (e) {
      if (e.target === checkoutOverlay) closeCheckout();
    });
    confirmOrderBtn.addEventListener("click", handleConfirmOrder);
  }

  function openCheckout() {
    if (Cart.getCount() === 0) return;
    renderCheckoutSummary();
    openModal(checkoutOverlay);
  }

  function closeCheckout() {
    closeModal(checkoutOverlay);
  }

  function renderCheckoutSummary() {
    var items = Cart.getItems();
    checkoutSummary.innerHTML = "";
    items.forEach(function (it) {
      var line = document.createElement("div");
      line.className = "summary-line";

      var left = document.createElement("span");
      left.innerHTML =
        '<span class="summary-qty">' + it.qty + "x</span> " + escapeHtml(it.name);

      var right = document.createElement("span");
      right.textContent = "$" + fmt(it.price * it.qty);

      line.appendChild(left);
      line.appendChild(right);
      checkoutSummary.appendChild(line);
    });

    // Línea de total
    var totalLine = document.createElement("div");
    totalLine.className = "summary-line";
    totalLine.innerHTML =
      '<span>Total</span><span>$' + fmt(Cart.getTotal()) + "</span>";
    checkoutSummary.appendChild(totalLine);
  }

  /* ---------- Confirmar pedido ---------- */
  function handleConfirmOrder() {
    var payment = getSelectedPayment();
    if (!payment) {
      alert("Por favor selecciona un método de pago.");
      return;
    }

    var name = (customerNameInp.value || "").trim();
    var message = buildWhatsAppMessage(name, payment);
    var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);

    // Abrir WhatsApp en una pestaña nueva
    window.open(url, "_blank");

    // Vaciar el carrito y mostrar confirmación
    Cart.clear();
    closeCheckout();
    // Limpiar el formulario para el próximo pedido
    if (checkoutForm) checkoutForm.reset();
    openModal(confirmOverlay);
  }

  function getSelectedPayment() {
    var checked = document.querySelector('input[name="payment"]:checked');
    return checked ? checked.value : null;
  }

  /* ======================================================================
     CONSTRUCCIÓN DEL MENSAJE DE WHATSAPP
     ======================================================================
     Genera un mensaje limpio y legible:
     ------------------------------------------------------------
     ¡Hola! Quiero hacer un pedido:

     2x Pollo (KG) — $4,600.00
     1x Queso (LIBRA) — $350.00

     Total: $4,950.00 CUP
     Método de pago: Transfermóvil
     Cliente: María Pérez
     ------------------------------------------------------------
     ====================================================================== */
  function buildWhatsAppMessage(name, payment) {
    var lines = [];
    lines.push("¡Hola! Quiero hacer un pedido:");
    lines.push(""); // línea en blanco
    lines = lines.concat(Cart.toPlainLines());
    lines.push("");
    lines.push("Total: $" + fmt(Cart.getTotal()) + " CUP");
    lines.push("Método de pago: " + payment);
    if (name) {
      lines.push("Cliente: " + name);
    }
    return lines.join("\n");
  }

  /* ======================================================================
     MODAL DE CONFIRMACIÓN
     ====================================================================== */
  function bindConfirmUI() {
    confirmCloseBtn.addEventListener("click", function () {
      closeModal(confirmOverlay);
      // Si el carrito estaba abierto lo cerramos también
      closeCart();
    });
    confirmOverlay.addEventListener("click", function (e) {
      if (e.target === confirmOverlay) {
        closeModal(confirmOverlay);
        closeCart();
      }
    });
  }

  /* ======================================================================
     UTILIDADES DE MODAL
     ====================================================================== */
  function openModal(overlay) {
    overlay.hidden = false;
    void overlay.offsetWidth; // reflow para activar transición
    overlay.classList.add("is-visible");
  }

  function closeModal(overlay) {
    overlay.classList.remove("is-visible");
    setTimeout(function () { overlay.hidden = true; }, 250);
  }

  /* ---------- Cerrar modales con tecla ESC ---------- */
  function bindEscToClose() {
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;

      if (confirmOverlay.classList.contains("is-visible")) {
        closeModal(confirmOverlay);
        closeCart();
      } else if (checkoutOverlay.classList.contains("is-visible")) {
        closeCheckout();
      } else if (cartDrawer.classList.contains("is-open")) {
        closeCart();
      }
    });
  }

  /* ---------- Utilidades de formato y escape ---------- */

  /**
   * Formato monetario con separador de miles.
   * Usa la utilidad global Money (definida en cart.js, que se carga antes);
   * si no estuviera disponible, cae a un formato simple.
   */
  function fmt(n) {
    if (window.Money && typeof window.Money.format === "function") {
      return window.Money.format(n);
    }
    return (Number(n) || 0).toFixed(2);
  }

  /* ---------- Pequeño escape de HTML para evitar inyección en el resumen ---------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
