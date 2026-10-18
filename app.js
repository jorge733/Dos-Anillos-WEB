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
$("#mailBtn").href = `mailto:${C.general.email}`;

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
// La ficha de cada producto vive en #producto/<id>; en el menú queda marcado «Catálogo».
const sections = $$("#main > section");
const baseTitle = document.title;
function route() {
  const [id, sub] = location.hash.slice(1).split("/");
  const p = id === "producto" && product(decodeURIComponent(sub || ""));
  if (id === "producto" && !p) return history.replaceState(null, "", "#catalogo"), route();
  const page = sections.find(s => s.id === id) || sections[0];
  if (p) renderProduct(p);
  const menuId = p ? "catalogo" : page.id;
  sections.forEach(s => (s.hidden = s !== page));
  $$("#menu a").forEach(a => {
    const on = a.hash === "#" + menuId;
    a.classList.toggle("active", on);
    on ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  nav.classList.toggle("on-hero", page === sections[0]);
  document.title = page === sections[0] ? baseTitle : `${p ? p.name : page.dataset.title || $(`#menu a[href="#${page.id}"]`).textContent} · Dos Anillos`;
  scrollTo({ top: 0, behavior: "instant" });
}
addEventListener("hashchange", route);

// ---------- Catálogo ----------
// Grilla de tarjetas (foto, nombre y precio); cada una abre la ficha del producto.
const product = id => C.productos.products.find(p => p.id === id);
const shipLabel = p => p.shipping === "coordinar" ? "Envío por coordinar" : "Envío a todo Chile";
// Las fotos se muestran completas dentro de su marco; el espacio que sobra se rellena con la misma foto desenfocada.
const framed = (src, alt, lazy) => `<div class="photo-bg" style="background-image:url('${esc(src)}')"></div>
  <img ${lazy ? 'loading="lazy" ' : ""}src="${esc(src)}" alt="${esc(alt)}">`;

$("#products").innerHTML = C.productos.products.map((p, i) => `
  <a class="pcard" href="#producto/${encodeURIComponent(p.id)}">
    <div class="frame">${p.imgs[0] ? framed(p.imgs[0], p.name, i > 3) : ""}</div>
    <div class="pcard-body">
      <h3>${esc(p.name)}</h3>
      <p class="price">${clp(p.price)}</p>
      <p class="ship">${shipLabel(p)}</p>
    </div>
  </a>`).join("");

// ---------- Ficha de producto ----------
// Miniaturas a la izquierda (abajo en celular), foto grande al centro y los datos de compra a la derecha.
function renderProduct(p) {
  const n = p.imgs.length;
  $("#productView").innerHTML = `
  <article class="pdp" data-id="${esc(p.id)}">
    <div class="gallery">
      ${n > 1 ? `<div class="thumbs">${p.imgs.map((src, i) => `
        <button type="button" data-i="${i}" aria-label="Ver foto ${i + 1} de ${n}"${i ? "" : ' aria-current="true"'}><img loading="lazy" src="${esc(src)}" alt=""></button>`).join("")}
      </div>` : ""}
      <figure class="frame viewer">${n ? framed(p.imgs[0], `${p.name} — foto 1 de ${n}`) : ""}
        ${n > 1 ? `<button type="button" class="nav-arrow prev" data-step="-1" aria-label="Foto anterior">‹</button>
        <button type="button" class="nav-arrow next" data-step="1" aria-label="Foto siguiente">›</button>
        <span class="counter">1 / ${n}</span>` : ""}
      </figure>
    </div>
    <div class="buybox">
      <h1>${esc(p.name)}</h1>
      <p class="price">${clp(p.price)}</p>
      <p class="ship">${shipLabel(p)}</p>
      <button class="btn full center" type="button" data-add="${esc(p.id)}">Agregar al carrito</button>
      ${p.specs.length ? `<dl class="specs">${p.specs.map(s => `<dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd>`).join("")}</dl>` : ""}
    </div>
    ${String(p.desc || "").trim() ? `<div class="pdp-desc"><h2>Descripción</h2>${md(p.desc)}</div>` : ""}
  </article>`;
}

function showPhoto(i) {
  const pdp = $(".pdp"), p = product(pdp.dataset.id), n = p.imgs.length;
  i = (i + n) % n;
  pdp.dataset.i = i;
  const viewer = $(".viewer", pdp);
  $(".photo-bg", viewer).style.backgroundImage = `url('${p.imgs[i]}')`;
  Object.assign($("img", viewer), { src: p.imgs[i], alt: `${p.name} — foto ${i + 1} de ${n}` });
  $(".counter", viewer).textContent = `${i + 1} / ${n}`;
  $$(".thumbs button", pdp).forEach((b, j) => j === i ? b.setAttribute("aria-current", "true") : b.removeAttribute("aria-current"));
}
const pv = $("#productView");
pv.addEventListener("click", e => {
  const t = e.target.closest(".thumbs [data-i]"), s = e.target.closest("[data-step]");
  if (t) showPhoto(Number(t.dataset.i));
  if (s) showPhoto(Number($(".pdp").dataset.i || 0) + Number(s.dataset.step));
});
// Como en las tiendas grandes: pasar el mouse por una miniatura ya cambia la foto.
pv.addEventListener("mouseover", e => { const t = e.target.closest(".thumbs [data-i]"); if (t) showPhoto(Number(t.dataset.i)); });
// En celular se desliza la foto con el dedo.
let touchX = null;
pv.addEventListener("touchstart", e => { if (e.target.closest(".viewer")) touchX = e.touches[0].clientX; }, { passive: true });
pv.addEventListener("touchend", e => {
  if (touchX == null || !$(".pdp .counter")) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 40) showPhoto(Number($(".pdp").dataset.i || 0) + (dx < 0 ? 1 : -1));
});
addEventListener("keydown", e => {
  if ($("#producto").hidden || !$(".pdp .counter") || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") showPhoto(Number($(".pdp").dataset.i || 0) + (e.key === "ArrowRight" ? 1 : -1));
});
route();

// ---------- Datos estructurados para Google (tienda y productos) ----------
// Se arman desde content.js, así quedan al día cuando se edita desde /admin.
const SITE = "https://dosanillos.cl/";
const abs = src => new URL(src, SITE).href;
const ldStore = { "@type": "OnlineStore", "@id": SITE + "#tienda", name: "Dos Anillos", url: SITE, logo: abs("logo.png"), image: abs("og-image.jpg"),
  description: document.querySelector('meta[name="description"]').content, email: C.general.email, telephone: C.general.phone,
  address: { "@type": "PostalAddress", addressCountry: "CL" }, areaServed: { "@type": "Country", name: "Chile" } };
const ld = { "@context": "https://schema.org", "@graph": [
  ldStore,
  { "@type": "WebSite", "@id": SITE + "#web", url: SITE, name: "Dos Anillos", inLanguage: "es-CL", publisher: { "@id": ldStore["@id"] } },
  ...C.productos.products.map(p => ({ "@type": "Product", "@id": `${SITE}#${p.id}`, sku: p.id, name: p.name,
    description: String(p.desc || "").replace(/\s+/g, " ").trim(), image: p.imgs.map(abs),
    brand: { "@type": "Brand", name: "Dos Anillos" },
    additionalProperty: p.specs.map(s => ({ "@type": "PropertyValue", name: s.label.trim(), value: s.value.trim() })),
    offers: { "@type": "Offer", url: `${SITE}#producto/${encodeURIComponent(p.id)}`, price: p.price, priceCurrency: "CLP", availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition", seller: { "@id": ldStore["@id"] } } }))
] };
document.head.append(Object.assign(document.createElement("script"), { type: "application/ld+json", textContent: JSON.stringify(ld) }));

// ---------- Maderas, cuidado, historia y artesanos ----------
// Cada madera muestra su foto real si tiene una; si no, la muestra de color.
$("#woods").innerHTML = C.maderas.woods.map(w => `
  <div class="wood reveal">${w.img
    ? `<img class="swatch photo" loading="lazy" src="${esc(w.img)}" alt="Madera de ${esc(w.name)}">`
    : `<div class="swatch" style="background:${esc(w.c)}"></div>`}
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

// ---------- Envío ----------
// Mismo cálculo que el servidor (api/_lib.js → quoteShipping): el precio de la región (/admin → Envíos)
// más un recargo por cada producto adicional. Devuelve null si queda por coordinar: algún producto
// tiene envío especial (grande o pesado) o la región todavía no tiene precio.
const regions = C.envios?.regions || [];
const special = () => cart.some(i => product(i.id).shipping === "coordinar");
function quoteShipping(region) {
  const rate = regions.find(r => r.name === region)?.price;
  if (special() || rate == null || rate === "") return null;
  const units = cart.reduce((s, i) => s + i.qty, 0);
  return Math.round(Number(rate) + Number(C.envios.extra || 0) * (units - 1));
}
const regionSelect = $("#checkout").elements.region;
regionSelect.append(...regions.map(r => new Option(r.name)));
regionSelect.addEventListener("change", renderTotals);

function renderTotals() {
  const region = regionSelect.value, ship = region ? quoteShipping(region) : null;
  const shipText = !region && !special() ? "Elige tu región" : ship == null ? "Por coordinar" : ship ? clp(ship) : "Gratis";
  $("#totals").innerHTML = `<dt>Subtotal</dt><dd>${clp(subtotal())}</dd><dt>Envío</dt><dd>${shipText}</dd>
    <dt class="total">Total</dt><dd class="total">${clp(subtotal() + (ship || 0))}</dd>`;
  $("#shipNote").textContent = special()
    ? "Tu pedido incluye productos de envío especial por su tamaño o peso: después de tu compra te escribimos para coordinar el envío, que se paga aparte."
    : !region ? "El costo del envío depende de tu región."
    : ship == null ? "Todavía no tenemos una tarifa fija para tu región: después de tu compra te escribimos para coordinar el envío, que se paga aparte."
    : "El envío a tu dirección ya va incluido en el total. Cuando despachemos tu pedido te enviaremos el número de seguimiento.";
  $("#payBtn").disabled = !cart.length;
}

// Agregar no lleva al carrito: la foto vuela al ícono y aparece un aviso al lado.
pv.addEventListener("click", e => {
  const b = e.target.closest("[data-add]");
  if (!b) return;
  const p = product(b.dataset.add);
  setQty(p.id, (cart.find(i => i.id === p.id)?.qty || 0) + 1);
  flyToCart($(".viewer img"), b);
  showAdded(p);
});

const added = $("#added");
let addedTimer;
function showAdded(p) {
  added.innerHTML = `<span class="tick" aria-hidden="true">✓</span>
    ${p.imgs[0] ? `<img src="${esc(p.imgs[0])}" alt="">` : ""}
    <div><strong>Añadido al carrito</strong><span>${esc(p.name)}</span></div>
    <a href="#carrito">Ver carrito</a>`;
  added.hidden = false;
  added.classList.remove("show"); void added.offsetWidth; added.classList.add("show");
  clearTimeout(addedTimer);
  addedTimer = setTimeout(hideAdded, 3500);
}
const hideAdded = () => added.classList.remove("show");
added.addEventListener("transitionend", e => { if (e.target === added && !added.classList.contains("show")) added.hidden = true; });
added.addEventListener("mouseenter", () => clearTimeout(addedTimer));
added.addEventListener("mouseleave", () => (addedTimer = setTimeout(hideAdded, 1500)));
added.addEventListener("click", e => e.target.closest("a") && hideAdded());

// La foto del producto vuela hasta el ícono del carrito y el ícono salta.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
function bumpCart() {
  const btn = $("#cartBtn");
  btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
}
$("#cartBtn").addEventListener("animationend", e => e.target === e.currentTarget && e.target.classList.remove("bump"));
function flyToCart(img, btn) {
  if (!img || reduceMotion.matches) return bumpCart();
  // Si la foto quedó fuera de la pantalla (en celular está sobre el botón), sale desde el botón.
  let from = img.getBoundingClientRect();
  if (from.bottom < 0 || from.top > innerHeight) from = btn.getBoundingClientRect();
  const to = $("#cartBtn").getBoundingClientRect();
  const size = Math.min(from.width, from.height * 2, 160);
  const x = from.left + from.width / 2 - size / 2, y = from.top + from.height / 2 - size / 2;
  const dx = to.left + to.width / 2 - (x + size / 2), dy = to.top + to.height / 2 - (y + size / 2);
  const fly = Object.assign(document.createElement("img"), { src: img.currentSrc || img.src, alt: "", className: "fly-to-cart" });
  Object.assign(fly.style, { left: `${x}px`, top: `${y}px`, width: `${size}px`, height: `${size}px` });
  document.body.append(fly);
  fly.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * .5}px,${dy * .5 - 80}px) scale(.6)`, opacity: 1, offset: .5 },
    { transform: `translate(${dx}px,${dy}px) scale(.12)`, opacity: .4 }
  ], { duration: 750, easing: "cubic-bezier(.5,0,.6,1)" }).onfinish = () => { fly.remove(); bumpCart(); };
}
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
    const shipPaid = o.shipping?.code === "region";
    box.innerHTML = `
      <p class="eyebrow">Pago aprobado</p>
      <h2>¡Gracias por tu compra, ${esc(o.customer.name.split(" ")[0])}!</h2>
      <p class="muted">Te enviamos el comprobante a ${esc(o.customer.email)}. ${shipPaid ? "Cuando despachemos tu pedido te enviaremos el número de seguimiento." : "Te escribiremos para acordar el costo del envío, que se paga aparte."}</p>
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
        <li><div><h3>Envío</h3><p class="muted">${shipPaid ? esc(o.shipping.name) : "Se coordina contigo y se paga aparte"}</p></div><strong>${shipPaid ? (o.shipping.price ? clp(o.shipping.price) : "Gratis") : "Por coordinar"}</strong></li></ul>
      <a class="btn" href="#inicio">Volver al inicio</a>`;
  } catch { fail("No encontramos tu pedido", `Si pagaste y no ves tu comprobante, ${waHelp} y te ayudamos.`); }
}
showOrder();
