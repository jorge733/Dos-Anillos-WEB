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
  { id: 1, cat: "flauta", name: "Flauta pentatónica en La 432\u00a0Hz", price: 70000, imgs: ["flautas-horizontal", "flautas-vertical", "flautas-detalle", "flautas-cruzadas-arcoiris"],
    desc: "Flauta de afinación pentatónica: cualquier combinación de notas suena armoniosa. Ideal para iniciarse y para pedagogía musical.",
    specs: { Madera: "Cerezo", Afinación: "Pentatónica en La (432\u00a0Hz)" } },
  { id: 3, cat: "cantel", name: "Kantele de 7 cuerdas", price: 120000, imgs: ["cantel"],
    desc: "Cítara de mesa de afinación pentatónica, de sonido envolvente y meditativo.",
    specs: { Caja: "Cerezo", Cuerdas: "7, afinación pentatónica", Acabado: "Aceite natural" } },
  { id: 4, cat: "otros", name: "Tabla de cortar", price: 25000, imgs: ["tabla-lisa", "tabla-canal", "tabla-canal-perfil", "tabla-lisa-detalle"],
    desc: "Tabla de cortar maciza en dos maderas, reversible: una cara lisa con asas laterales talladas y otra con canal perimetral para retener jugos. Terminada a mano con aceite apto para alimentos.",
    specs: { Madera: "Dos maderas combinadas", Detalles: "Reversible · asas talladas · canal para jugos", Acabado: "Aceite apto para alimentos" } },
];

const WOODS = [
  { name: "Cerezo", c: "linear-gradient(90deg,#a8613f,#bf7550 25%,#9a5637 55%,#b86e49)", d: "Madera de grano fino y tono rojizo que se oscurece con el tiempo. Se tornea con precisión y deja un acabado suave y sedoso.", tone: "Cálido · equilibrado" },
  { name: "Haya europea", c: "linear-gradient(90deg,#d8b08a,#e3bf9b 30%,#cfa37c 60%,#dcb592)", d: "Dura, densa y de grano muy fino y uniforme. Es estable, resiste bien el uso diario y su color claro rosado le da un aspecto limpio.", tone: "Claro · nítido" },
  { name: "Nogal americano", c: "linear-gradient(90deg,#4a3326,#5e4130 30%,#3f2b20 60%,#563b2c)", d: "Tono chocolate profundo con vetas elegantes. Es muy estable, se trabaja con facilidad y gana belleza con los años.", tone: "Profundo · elegante" },
  { name: "Nogal", c: "linear-gradient(90deg,#7a5638,#8d6544 30%,#6c4b30 60%,#84603f)", d: "Marrón dorado con vetas marcadas. Resistente y estable, con un pulido natural muy agradable al tacto.", tone: "Cálido · noble" },
  { name: "Sirari", c: "linear-gradient(90deg,#8c4a2f,#a15a3a 30%,#7a3f27 60%,#965236)", d: "Madera tropical de tono marrón rojizo y veta intensa. Muy dura y densa, de gran durabilidad.", tone: "Firme · intenso" },
  { name: "Roble chileno", c: "linear-gradient(90deg,#a8724f,#bb8460 30%,#966344 60%,#b07a57)", d: "Madera nativa del sur de Chile, de tono café rojizo y veta marcada. Dura, resistente y muy durable, con mucho carácter.", tone: "Nativo · robusto" },
  { name: "Roble vaporizado", c: "linear-gradient(90deg,#8a5a42,#9c6a50 30%,#7a4e38 60%,#94634a)", d: "Roble chileno tratado con vapor: adquiere un color más parejo y profundo, y gana estabilidad al liberar tensiones internas de la madera.", tone: "Parejo · estable" },
  { name: "Paquio", c: "linear-gradient(90deg,#a5502f,#b8623c 30%,#934528 60%,#ad5934)", d: "Una de las maderas más duras y densas, de tono rojizo anaranjado que se intensifica con el tiempo. Muy estable y durable.", tone: "Denso · resistente" },
  { name: "Raulí", c: "linear-gradient(90deg,#b06a4f,#c27c5f 30%,#9e5d44 60%,#b8735a)", d: "Madera nativa chilena de tono rosado rojizo y grano fino y parejo. Liviana, estable y noble para trabajar.", tone: "Nativo · cálido" },
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
const menuBtn = $("#menuBtn");
const setMenu = open => { nav.classList.toggle("open", open); menuBtn.setAttribute("aria-expanded", open); menuBtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); };
menuBtn.onclick = () => setMenu(!nav.classList.contains("open"));
$("#menu").addEventListener("click", e => e.target.closest("a") && setMenu(false));

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
  document.title = page === sections[0] ? baseTitle : `${$(`#menu a[href="#${page.id}"]`).textContent} · Dos Anillos`;
  scrollTo({ top: 0, behavior: "instant" });
}
addEventListener("hashchange", route);
route();

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
