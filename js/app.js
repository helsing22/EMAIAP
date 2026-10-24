/* ==========================================================================
   app.js — Orquestador de la UI (v2 "Editorial Cómica")
   --------------------------------------------------------------------------
   Responsabilidades:
     - Inicializar la app al cargar el DOM.
     - Abrir/cerrar el drawer del carrito y los modales.
     - Renderizar el contenido del carrito cuando cambia.
     - Gestionar el flujo de checkout y la generación del mensaje de WhatsApp.
     - Mostrar la pantalla de confirmación tras enviar el pedido.
     - Efectos dinámicos (window.EMAIAP_UI):
         · toast()          — notificaciones amigables
         · flyToCart()      — emoji que vuela hasta el botón "Mi pedido"
         · enhance()        — revelado al hacer scroll de las tarjetas
         · observeSection() — scrollspy de los chips de categoría
     - Extras: sombra del header al hacer scroll, botón "volver arriba",
       animación del badge del carrito.

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

  /* ---------- Preferencias de movimiento ---------- */
  var prefersReducedMotion = false;
  try {
    prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { /* navegador antiguo: seguimos con animaciones */ }

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

  var toastContainer  = $("toastContainer");
  var backTopBtn      = $("backTop");
  var siteHeader      = $("siteHeader");
  var heroOrderBtn    = $("heroOrderBtn");

  /* ======================================================================
     EFECTOS DINÁMICOS — API usada también por products.js
     ======================================================================
     Se define antes de init() para que exista cuando Products.load()
     renderice el catálogo (los scripts se cargan en orden cart→products→app,
     pero el render ocurre dentro del DOMContentLoaded de este archivo).
     ====================================================================== */
  var EMAIAP_UI = {};

  /* ---------- Toast: notificación flotante amigable ---------- */
  EMAIAP_UI.toast = function (message) {
    if (!toastContainer) return;
    // Máximo 3 toasts simultáneos
    while (toastContainer.children.length >= 3) {
      toastContainer.removeChild(toastContainer.firstChild);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.textContent = message;
    toastContainer.appendChild(t);
    setTimeout(function () {
      t.classList.add("out");
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 320);
    }, 2100);
  };

  /* ---------- Emoji volador: del botón "Agregar" al "Mi pedido" ---------- */
  EMAIAP_UI.flyToCart = function (fromBtn, emoji) {
    if (!fromBtn || !cartToggleBtn || prefersReducedMotion) return;
    if (typeof fromBtn.animate !== "function") return; // WAAPI no disponible

    var from = fromBtn.getBoundingClientRect();
    var to   = cartToggleBtn.getBoundingClientRect();

    var fly = document.createElement("span");
    fly.className = "fly-emoji";
    fly.textContent = emoji || "🛒";
    fly.style.left = (from.left + from.width / 2 - 12) + "px";
    fly.style.top  = (from.top + from.height / 2 - 12) + "px";
    document.body.appendChild(fly);

    var dx = (to.left + to.width / 2) - (from.left + from.width / 2);
    var dy = (to.top + to.height / 2) - (from.top + from.height / 2);

    var anim = fly.animate(
      [
        { transform: "translate(0, 0) scale(1)",        opacity: 1 },
        { transform: "translate(" + dx * 0.6 + "px, " + (dy * 0.6 - 60) + "px) scale(1.15)", opacity: 1, offset: 0.6 },
        { transform: "translate(" + dx + "px, " + dy + "px) scale(0.4)", opacity: 0.2 }
      ],
      { duration: 650, easing: "cubic-bezier(.3,.7,.4,1)" }
    );
    anim.onfinish = function () {
      if (fly.parentNode) fly.parentNode.removeChild(fly);
    };
  };

  /* ---------- Revelado al hacer scroll (tarjetas y cabeceras) ---------- */
  var revealObserver = null;
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -30px 0px" });
  }

  /**
   * Añade animación de entrada a las tarjetas de una sección recién renderizada.
   * Solo se aplica si el navegador soporta IntersectionObserver; si no,
   * el contenido simplemente se muestra sin animación.
   */
  EMAIAP_UI.enhance = function (section) {
    if (!section || !revealObserver) return;
    var cards = section.querySelectorAll(".product-card");
    Array.prototype.forEach.call(cards, function (card, i) {
      card.style.setProperty("--reveal-delay", (i % 8) * 55 + "ms");
      card.classList.add("reveal");
      revealObserver.observe(card);
    });
  };

  /* ---------- Scrollspy: chip activo según la sección visible ---------- */
  var chipsNav = $("categoryChips");
  var spyObserver = null;
  if ("IntersectionObserver" in window && chipsNav) {
    spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        var chips = chipsNav.querySelectorAll(".chip");
        Array.prototype.forEach.call(chips, function (chip) {
          chip.classList.toggle("active", chip.getAttribute("data-target") === id);
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
  }

  EMAIAP_UI.observeSection = function (section) {
    if (section && spyObserver) spyObserver.observe(section);
  };

  window.EMAIAP_UI = EMAIAP_UI;

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
    bindExtras();

    // Render inicial
    renderCart();
  }

  /* ======================================================================
     EXTRAS: sombra del header, volver arriba, botón del hero
     ====================================================================== */
  function bindExtras() {
    var ticking = false;

    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        var y = window.pageYOffset || document.documentElement.scrollTop;

        // Sombra del header
        if (siteHeader) siteHeader.classList.toggle("scrolled", y > 8);

        // Botón volver arriba
        if (backTopBtn) backTopBtn.hidden = y <= 600;

        ticking = false;
      });
    }, { passive: true });

    if (backTopBtn) {
      backTopBtn.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: prefersReducedMotion ? "auto" : "smooth"
        });
      });
    }

    // Botón "Hacer pedido" del hero → lleva al catálogo
    if (heroOrderBtn) {
      heroOrderBtn.addEventListener("click", function () {
        var catalog = document.getElementById("catalog");
        if (catalog) {
          catalog.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
        }
      });
    }
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
    setTimeout(function () { cartOverlay.hidden = true; }, 280);
  }

  /* ======================================================================
     RENDER DEL CARRITO
     ====================================================================== */
  var lastCount = -1;

  function renderCart() {
    if (!window.Cart) return;
    var items = Cart.getItems();
    var count = Cart.getCount();
    var total = Cart.getTotal();

    // Contador del icono (con animación "pop" cuando cambia)
    cartCountEl.textContent = count;
    cartCountEl.setAttribute("data-count", String(count));
    if (count !== lastCount && count > 0 && lastCount !== -1) {
      cartCountEl.classList.remove("pop");
      void cartCountEl.offsetWidth; // reinicia la animación
      cartCountEl.classList.add("pop");
    }
    lastCount = count;

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
    name.textContent = item.name + (item.unit ? " (" + item.unit + ")" : "");

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
      if (window.EMAIAP_UI && window.EMAIAP_UI.toast) {
        window.EMAIAP_UI.toast("💰 Selecciona un método de pago");
      } else {
        alert("Por favor selecciona un método de pago.");
      }
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
    setTimeout(function () { overlay.hidden = true; }, 260);
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
