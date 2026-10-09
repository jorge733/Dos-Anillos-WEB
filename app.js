// ---------- Datos ----------
// Fotos, precios y descripciones de ejemplo: reemplazar por las reales.
const WHATSAPP = "56961772886";
const U = id => `img/${id}.webp`;

const CATEGORIES = [
  { key: "flauta", title: "Flautas pentatónicas" },
  { key: "cantel", title: "Kantele" },
  { key: "otros", title: "Otros productos" },
];

const PRODUCTS = [
  { id: 1, cat: "flauta", name: "Flauta pentatónica en Re", price: 70000, imgs: ["flautas-horizontal", "flautas-vertical", "flautas-detalle", "flautas-cruzadas-arcoiris", "flautas-cruzadas-verde"],
    desc: "Flauta de afinación pentatónica: cualquier combinación de notas suena armoniosa. Ideal para iniciarse y para pedagogía musical.",
    specs: { Madera: "Cerezo", Afinación: "Pentatónica en Re" } },
  { id: 3, cat: "cantel", name: "Kantele de 7 cuerdas", price: 120000, imgs: ["cantel"],
    desc: "Cítara de mesa de afinación pentatónica, de sonido envolvente y meditativo.",
    specs: { Caja: "Cerezo", Cuerdas: "7, afinación pentatónica", Acabado: "Aceite natural" } },
  { id: 4, cat: "otros", name: "Tabla de cortar", price: 25000, imgs: ["tabla-lisa", "tabla-canal", "tabla-canal-perfil", "tabla-lisa-detalle"],
    desc: "Tabla de cortar maciza en dos maderas, reversible: una cara lisa con asas laterales talladas y otra con canal perimetral para retener jugos. Terminada a mano con aceite apto para alimentos.",
    specs: { Madera: "Dos maderas combinadas (por confirmar)", Detalles: "Reversible · asas talladas · canal para jugos", Acabado: "Aceite apto para alimentos" } },
];

// Por completar: añadir aquí el resto de maderas que se trabajan.
const WOODS = [
  { name: "Cerezo", c: "linear-gradient(90deg,#a8613f,#bf7550 25%,#9a5637 55%,#b86e49)", d: "Madera de grano fino y tono rojizo que se oscurece con el tiempo.", tone: "Cálido · equilibrado" },
];

const MAKERS = [
  { name: "Nicolás Bordali" },
  { name: "Vicente Paz" },
  { name: "Amador Orellana" },
];

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clp = n => n.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const waLink = p => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola, me interesa: ${p.name} (${clp(p.price)})`)}`;

// ---------- Nav ----------
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > innerHeight * 0.7), { passive: true });

// ---------- Catálogo ----------
// La primera foto de cada producto es la portada: debe mostrar el producto entero.
const slide = (p, i) => `
  <div class="slide-bg" style="background-image:url(${U(p.imgs[i])})"></div>
  <img loading="lazy" src="${U(p.imgs[i])}" alt="${p.name} — foto ${i + 1} de ${p.imgs.length}">`;
$("#catalogList").innerHTML = `<div class="grid">${PRODUCTS.map(p => {
  const n = CATEGORIES.findIndex(c => c.key === p.cat);
  return `
  <article class="card" data-id="${p.id}" data-i="0" tabindex="0">
    <p class="cat-label"><span>${n + 1}.</span> ${CATEGORIES[n].title}</p>
    <div class="img">${slide(p, 0)}${p.imgs.length > 1 ? `
      <button class="arrow prev" aria-label="Foto anterior">‹</button>
      <button class="arrow next" aria-label="Foto siguiente">›</button>
      <div class="dots">${p.imgs.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}
    </div>
    <h3>${p.name}</h3>
    <p class="meta">${Object.values(p.specs)[0]}</p>
    <p class="price">${clp(p.price)}</p>
  </article>`;
}).join("")}</div>`;
$("#catalogList").addEventListener("click", e => {
  const c = e.target.closest(".card"); if (!c) return;
  const arrow = e.target.closest(".arrow");
  if (!arrow) return openProduct(+c.dataset.id);
  const p = PRODUCTS.find(p => p.id === +c.dataset.id), len = p.imgs.length;
  const i = (+c.dataset.i + (arrow.classList.contains("next") ? 1 : -1) + len) % len;
  c.dataset.i = i;
  $(".slide-bg", c).style.backgroundImage = `url(${U(p.imgs[i])})`;
  Object.assign($("img", c), { src: U(p.imgs[i]), alt: `${p.name} — foto ${i + 1} de ${len}` });
  $$(".dots i", c).forEach((d, j) => d.classList.toggle("on", j === i));
});
$("#catalogList").addEventListener("keydown", e => { const c = e.target.closest(".card"); if (c && e.key === "Enter" && e.target === c) openProduct(+c.dataset.id); });

// ---------- Maderas y artesanos ----------
$("#woods").innerHTML = WOODS.map(w => `
  <div class="wood reveal"><div class="swatch" style="background:${w.c}"></div>
  <h3>${w.name}</h3><p>${w.d}</p><p class="tone">${w.tone}</p></div>`).join("");
$("#makers").innerHTML = MAKERS.map(m => `<li>${m.name}</li>`).join("");

// ---------- Modal producto ----------
const modal = $("#modal");
let current = null;
function openProduct(id) {
  current = PRODUCTS.find(p => p.id === id);
  $("#mCat").textContent = CATEGORIES.find(c => c.key === current.cat).title;
  $("#mTitle").textContent = current.name;
  $("#mPrice").textContent = clp(current.price);
  $("#mDesc").innerHTML = `<p>${current.desc}</p>`;
  $("#mSpecs").innerHTML = Object.entries(current.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  $("#buyBtn").href = waLink(current);
  setMain(0);
  $("#thumbs").innerHTML = current.imgs.length > 1 ? current.imgs.map((id, i) => `<img src="${U(id, 160)}" data-i="${i}" class="${i ? "" : "active"}" alt="Vista ${i + 1}">`).join("") : "";
  switchTab("desc");
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
function setMain(i) {
  $("#zoom").classList.toggle("empty-img", !current.imgs.length); if (!current.imgs.length) { $("#mainImg").removeAttribute("src"); return; }
  $("#mainImg").src = U(current.imgs[i], 1400); $("#mainImg").alt = current.name; }
$("#modalClose").onclick = closeModal;
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("#thumbs").addEventListener("click", e => {
  const i = e.target.dataset.i; if (i == null) return;
  setMain(+i); $$("#thumbs img").forEach(t => t.classList.toggle("active", t === e.target));
});
const zoom = $("#zoom");
zoom.addEventListener("mousemove", e => {
  const r = zoom.getBoundingClientRect();
  $("#mainImg").style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  zoom.classList.add("on");
});
zoom.addEventListener("mouseleave", () => zoom.classList.remove("on"));
function switchTab(t) {
  $$(".tab").forEach(b => b.classList.toggle("active", b.dataset.tab === t));
  $$(".tab-panel").forEach(p => (p.hidden = p.dataset.panel !== t));
}
$$(".tab").forEach(b => (b.onclick = () => switchTab(b.dataset.tab)));

// ---------- Sugerencias y reclamos ----------
// FormSubmit reenvía el formulario a dosanilloschile@gmail.com (el primer envío pide activar el servicio desde ese correo).
const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 4000); };
$("#feedback").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target, btn = $("button", f), data = Object.fromEntries(new FormData(f));
  data._subject = `${data.Tipo} desde la web · Dos Anillos`;
  btn.disabled = true; btn.textContent = "Enviando…";
  try {
    const r = await fetch("https://formsubmit.co/ajax/dosanilloschile@gmail.com", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data) });
    if (!r.ok) throw 0;
    f.reset(); toast("¡Gracias! Recibimos tu mensaje.");
  } catch { toast("No se pudo enviar. Escríbenos a dosanilloschile@gmail.com"); }
  btn.disabled = false; btn.textContent = "Enviar";
});

// ---------- Animaciones de entrada ----------
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
$$(".reveal, .section-head").forEach(el => { el.classList.add("reveal"); io.observe(el); });
