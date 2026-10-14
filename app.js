// ---------- Datos ----------
// Todo el contenido vive en content.js y se edita desde el panel /admin.
const C = window.CONTENT;

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clp = n => Number(n).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const waLink = () => `https://wa.me/${C.general.whatsapp}`;
const get = path => path.split(".").reduce((o, k) => o?.[k], C) ?? "";
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// Formato mínimo para los textos del panel: **negrita**, párrafos separados por una línea en blanco y listas con "- ".
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
const md = s => String(s ?? "").trim().split(/\n\s*\n/).map(b => {
  const lines = b.split("\n").map(l => l.trim()).filter(Boolean);
  const items = lines.filter(l => l.startsWith("- "));
  if (items.length && items.length === lines.length) return `<ul>${items.map(l => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
  return `<p>${lines.map(inline).join("<br>")}</p>`;
}).join("");

// ---------- Textos fijos de cada sección ----------
$$("[data-t]").forEach(el => (el.textContent = get(el.dataset.t)));
$$("[data-md]").forEach(el => (el.innerHTML = inline(get(el.dataset.md))));
$$("a.wa").forEach(a => (a.href = waLink()));
$("#heroImg").src = C.hero.image;
const mailto = `mailto:${C.general.email}`;
Object.assign($("#heroMail"), { href: mailto, textContent: C.general.email });
$("#mailBtn").href = mailto;

// ---------- Nav ----------
const nav = $("#nav");
const menuBtn = $("#menuBtn");
const setMenu = open => { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); };
menuBtn.onclick = () => setMenu(!nav.classList.contains("open"));
$("#menu").addEventListener("click", e => e.target.closest("a") && setMenu(false));

// Barra lateral contraíble (solo escritorio); se recuerda si quedó cerrada.
const sideToggle = $("#sideToggle");
const setSide = closed => {
  document.body.classList.toggle("side-closed", closed);
  sideToggle.setAttribute("aria-expanded", !closed);
  sideToggle.setAttribute("aria-label", closed ? "Mostrar menú" : "Ocultar menú");
  try { localStorage.setItem("sideClosed", closed ? "1" : ""); } catch {}
};
sideToggle.onclick = () => setSide(!document.body.classList.contains("side-closed"));
try { if (localStorage.getItem("sideClosed")) { document.body.classList.add("no-anim"); setSide(true); requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove("no-anim"))); } } catch {}

// ---------- Secciones: una a la vez, según el #ancla de la URL ----------
const sections = $$("#main > section");
const baseTitle = document.title;
function route() {
  const id = location.hash.slice(1);
  const page = sections.find(s => s.id === id) || sections[0];
  sections.forEach(s => (s.hidden = s !== page));
  $$("#menu a").forEach(a => {
    const on = a.hash === "#" + page.id;
    a.classList.toggle("active", on);
    on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  nav.classList.toggle("on-hero", page === sections[0]);
  document.title = page === sections[0] ? baseTitle : `${page.dataset.title || $(`#menu a[href="#${page.id}"]`).textContent} · Dos Anillos`;
  scrollTo({ top: 0, behavior: "instant" });
}
addEventListener("hashchange", route);
route();

// ---------- Catálogo ----------
// Todas las fotos de cada producto a la vista, sin carrusel.
$("#products").innerHTML = C.productos.products.map(p => `
  <article class="product">
    <div class="photos">${p.imgs.map((src, i) => `
      <figure><div class="photo-bg" style="background-image:url('${esc(src)}')"></div>
      <img loading="${i ? "lazy" : "eager"}" src="${esc(src)}" alt="${esc(p.name)} — foto ${i + 1} de ${p.imgs.length}"></figure>`).join("")}
    </div>
    <div class="info">
      <h3>${esc(p.name)}</h3>
      <p class="price">${clp(p.price)}</p>
      <div class="desc">${md(p.desc)}</div>
      <dl class="specs">${p.specs.map(s => `<dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd>`).join("")}</dl>
      <button class="btn full center" type="button" data-add="${esc(p.id)}">Agregar al carrito</button>
    </div>
  </article>`).join("");

// ---------- Maderas, cuidado, historia y artesanos ----------
$("#woods").innerHTML = C.maderas.woods.map(w => `
  <div class="wood reveal"><div class="swatch" style="background:${esc(w.c)}"></div>
  <h3>${esc(w.name)}</h3><p>${esc(w.d)}</p><p class="tone">${esc(w.tone)}</p></div>`).join("");
$("#care").innerHTML = C.cuidado.steps.map((s, i) => `
  <li><span>${i + 1}</span><div><h3>${esc(s.title)}</h3>${md(s.text)}</div></li>`).join("");
$("#story").innerHTML = C.historia.blocks.map(b => `<article><h3>${esc(b.title)}</h3>${md(b.text)}</article>`).join("");
$("#makers").innerHTML = C.equipo.makers.map(m => `<li>${esc(m.name)}</li>`).join("");
// Fotos del taller: la primera grande y el resto en una grilla debajo.
$("#teamPhotos").innerHTML = C.equipo.images.map((src, i) => `<img loading="lazy" src="${esc(src)}" alt="Taller Dos Anillos — foto ${i + 1}">`).join("");

// ---------- Contactos secundarios (solo los que tienen número) ----------
const others = (C.contacto.others || []).filter(o => o.whatsapp);
$("#others").innerHTML = others.length ? `<p class="eyebrow">También puedes escribirle a</p><div class="contact-btns">${others.map(o => `
  <a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/${esc(o.whatsapp.replace(/\D/g, ""))}">${esc(o.name)}</a>`).join("")}</div>` : "";

// ---------- Sugerencias y reclamos ----------
// FormSubmit reenvía el formulario al correo de contacto (el primer envío pide activar el servicio desde ese correo).
const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 4000); };
$("#feedback").action = `https://formsubmit.co/${C.general.email}`;
$("#feedback").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = $("button", f), data = Object.fromEntries(new FormData(f));
  data._subject = `${data.Tipo} desde la web · Dos Anillos`;
  btn.disabled = true; btn.textContent = "Enviando…";
  try {
    const r = await fetch(`https://formsubmit.co/ajax/${C.general.email}`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw 0;
    f.reset(); toast("¡Gracias! Recibimos tu mensaje.");
  } catch { toast(`No se pudo enviar. Escríbenos a ${C.general.email}`); }
  btn.disabled = false; btn.textContent = "Enviar";
});

// ---------- Animaciones de entrada ----------
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
$$(".reveal, .section-head").forEach(el => { el.classList.add("reveal"); io.observe(el); });

// ---------- Carrito ----------
// Se guarda en este navegador ([{ id, qty }]); los precios reales los calcula el servidor al pagar.
const product = id => C.productos.products.find(p => p.id === id);
let cart = [];
try { cart = JSON.parse(localStorage.getItem("cart") || "[]").filter(i => product(i.id)); } catch {}
const saveCart = () => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch {} };
const subtotal = () => cart.reduce((s, i) => s + product(i.id).price * i.qty, 0);

function setQty(id, qty) {
  const item = cart.find(i => i.id === id);
  if (item) item.qty = Math.max(0, Math.min(20, qty)); else if (qty > 0) cart.push({ id, qty });
  cart = cart.filter(i => i.qty > 0);
  saveCart(); renderCart();
}

function renderCart() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $("#cartCount").hidden = !n; $("#cartCount").textContent = n;
  $("#checkout").hidden = !n;
  $("#cart").innerHTML = n ? `
    <ul class="cart-list">${cart.map(i => { const p = product(i.id); return `
      <li><img src="${esc(p.imgs[0])}" alt=""><div><h3>${esc(p.name)}</h3><p class="muted">${clp(p.price)}</p></div>
        <div class="qty" data-id="${esc(p.id)}"><button type="button" data-d="-1" aria-label="Quitar uno">−</button><span>${i.qty}</span><button type="button" data-d="1" aria-label="Agregar uno">+</button></div>
        <strong>${clp(p.price * i.qty)}</strong></li>`; }).join("")}
    </ul>` : `<p class="muted">Tu carrito está vacío.</p><a class="btn" href="#catalogo">Ver catálogo</a>`;
  renderTotals();
}

// El envío no se cobra en la tienda: se coordina con el vendedor después de la compra y se paga aparte.
function renderTotals() {
  $("#totals").innerHTML = `<dt>Subtotal</dt><dd>${clp(subtotal())}</dd><dt>Envío</dt><dd>Por coordinar</dd>
    <dt class="total">Total</dt><dd class="total">${clp(subtotal())}</dd>`;
  $("#payBtn").disabled = !cart.length;
}

$("#products").addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  setQty(b.dataset.add, (cart.find(i => i.id === b.dataset.add)?.qty || 0) + 1);
  location.hash = "#carrito";
});
$("#cart").addEventListener("click", e => {
  const b = e.target.closest(".qty button");
  if (b) { const id = b.parentElement.dataset.id; setQty(id, cart.find(i => i.id === id).qty + Number(b.dataset.d)); }
});

const waHelp = `<a class="link" href="${waLink()}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>`;

// Mientras Mercado Pago use credenciales de prueba, se avisa que no hay cobros reales.
let testChecked = false;
async function checkTestMode() {
  if (testChecked) return;
  testChecked = true;
  try {
    const { testMode } = await (await fetch("/api/checkout")).json();
    if (testMode) $("#checkout").prepend(Object.assign(document.createElement("p"), { className: "wide test-mode", textContent: "Modo de prueba: Mercado Pago usa credenciales de prueba y no se hacen cobros reales." }));
  } catch {}
}

// ---------- Pago con Mercado Pago ----------
$("#checkout").addEventListener("submit", async e => {
  e.preventDefault();
  const btn = $("#payBtn"), f = e.target;
  btn.disabled = true; btn.textContent = "Conectando con Mercado Pago…";
  try {
    const customer = Object.fromEntries(new FormData(f));
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: cart, customer }) });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error);
    location.href = data.url;
  } catch (err) {
    toast(err.message || "No se pudo iniciar el pago. Intenta de nuevo.");
    btn.textContent = "Pagar con Mercado Pago"; renderTotals();
  }
});
// Si el cliente vuelve con el botón "atrás" del navegador, el botón de pago queda como al principio.
addEventListener("pageshow", e => { if (e.persisted) { $("#payBtn").textContent = "Pagar con Mercado Pago"; renderTotals(); } });

const onCart = () => location.hash === "#carrito" && cart.length && checkTestMode();
addEventListener("hashchange", onCart);
renderCart(); onCart();

// ---------- Resultado del pago (vuelta desde Mercado Pago) ----------
const MP_TYPES = { credit_card: "Tarjeta de crédito", debit_card: "Tarjeta de débito", prepaid_card: "Tarjeta prepago", account_money: "Saldo de Mercado Pago", bank_transfer: "Transferencia", ticket: "Efectivo", digital_currency: "Mercado Crédito" };
async function showOrder() {
  const q = new URLSearchParams(location.search), id = q.get("pedido");
  if (!id) return;
  const box = $("#orderResult");
  const fail = (title, text) => (box.innerHTML = `<p class="eyebrow">Tu pedido</p><h2>${title}</h2><p class="muted">${text}</p><a class="btn" href="#carrito">Volver al carrito</a>`);
  if (location.hash !== "#pedido") location.hash = "#pedido";
  box.innerHTML = `<p class="muted">Cargando tu pedido…</p>`;
  try {
    const r = await fetch(`/api/order?id=${encodeURIComponent(id)}&k=${encodeURIComponent(q.get("k") || "")}`);
    const o = await r.json();
    if (!r.ok) throw new Error(o.error);
    const p = o.payment || {};
    if (o.status === "rechazado") return fail("El pago fue rechazado", `Mercado Pago no aprobó el pago del pedido ${esc(o.id)}, así que no se hizo ningún cargo. Puedes intentarlo de nuevo con otra tarjeta.`);
    if (o.status === "anulado") return fail("El pago no se completó", `Se anuló el pago del pedido ${esc(o.id)} o se acabó el tiempo para pagar. No se hizo ningún cargo.`);
    if (o.status === "pendiente" && ["pending", "in_process", "authorized"].includes(p.status)) {
      cart = []; saveCart(); renderCart();
      return fail("Tu pago está en proceso", `Mercado Pago todavía está revisando el pago del pedido ${esc(o.id)}. Cuando se apruebe te llegará el comprobante a ${esc(o.customer.email)}.`);
    }
    if (o.status === "pendiente") return fail("No pudimos confirmar el pago", `Si se hizo un cargo en tu tarjeta, ${waHelp} con el número de pedido ${esc(o.id)} y lo revisamos.`);
    cart = []; saveCart(); renderCart();
    box.innerHTML = `
      <p class="eyebrow">Pago aprobado</p>
      <h2>¡Gracias por tu compra, ${esc(o.customer.name.split(" ")[0])}!</h2>
      <p class="muted">Te enviamos el comprobante a ${esc(o.customer.email)}. Te escribiremos para acordar el costo del envío, que se paga aparte.</p>
      <dl class="voucher">
        <dt>Número de pedido</dt><dd>${esc(o.id)}</dd>
        <dt>Monto pagado</dt><dd>${clp(o.total)}</dd>
        <dt>Fecha</dt><dd>${new Date(p.transactionDate || o.createdAt).toLocaleString("es-CL")}</dd>
        <dt>Pagado con</dt><dd>Mercado Pago</dd>
        <dt>Nº de operación</dt><dd>${esc(p.operation)}</dd>
        <dt>Medio de pago</dt><dd>${esc(MP_TYPES[p.paymentType] || p.paymentType)}</dd>
        ${p.cardNumber ? `<dt>Cuotas</dt><dd>${p.installments > 1 ? p.installments : "Sin cuotas"}</dd><dt>Tarjeta</dt><dd>**** ${esc(p.cardNumber)}</dd>` : ""}
      </dl>
      <ul class="cart-list">${o.lines.map(l => `<li><div><h3>${l.qty} × ${esc(l.name)}</h3></div><strong>${clp(l.price * l.qty)}</strong></li>`).join("")}
        <li><div><h3>Envío</h3><p class="muted">Se coordina contigo y se paga aparte</p></div><strong>Por coordinar</strong></li></ul>
      <a class="btn" href="#inicio">Volver al inicio</a>`;
  } catch { fail("No encontramos tu pedido", `Si pagaste y no ves tu comprobante, ${waHelp} y te ayudamos.`); }
}
showOrder();
