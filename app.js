// ---------- Datos ----------
// Fotos, precios y descripciones de ejemplo: reemplazar por las reales.
const WHATSAPP = "56961772886";
const U = id => `img/${id}.webp`;

const PRODUCTS = [
  { id: 1, name: "Flauta pentatónica en La 432 Hz", price: 70000, imgs: ["flautas-horizontal", "flautas-vertical", "flautas-detalle", "flautas-cruzadas-arcoiris"],
    desc: "Flauta de afinación pentatónica: cualquier combinación de notas suena armoniosa. Ideal para iniciarse y para pedagogía musical. Incluye estuche y limpiador hechos por nosotros.",
    specs: { Madera: "Cerezo", Afinación: "Pentatónica en La (432 Hz)" } },
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
  document.title = page === sections[0] ? baseTitle : `${$(`#menu a[href="#${page.id}"]`).textContent} · Dos Anillos`;
  scrollTo({ top: 0, behavior: "instant" });
}
addEventListener("hashchange", route);
route();

// ---------- Flautas ----------
// Todas las fotos de cada flauta a la vista, sin carrusel.
$("#products").innerHTML = PRODUCTS.map(p => `
  <article class="product">
    <div class="photos">${p.imgs.map((id, i) => `
      <figure><div class="photo-bg" style="background-image:url(${U(id)})"></div>
      <img loading="${i ? "lazy" : "eager"}" src="${U(id)}" alt="${p.name} — foto ${i + 1} de ${p.imgs.length}"></figure>`).join("")}
    </div>
    <div class="info">
      <h3>${p.name}</h3>
      <p class="price">${clp(p.price)}</p>
      <p class="desc">${p.desc}</p>
      <dl class="specs">${Object.entries(p.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      <a class="btn full center" href="${waLink(p)}" target="_blank" rel="noopener">Comprar por WhatsApp</a>
    </div>
  </article>`).join("");

// ---------- Maderas y artesanos ----------
$("#woods").innerHTML = WOODS.map(w => `
  <div class="wood reveal"><div class="swatch" style="background:${w.c}"></div>
  <h3>${w.name}</h3><p>${w.d}</p><p class="tone">${w.tone}</p></div>`).join("");
$("#makers").innerHTML = MAKERS.map(m => `<li>${m.name}</li>`).join("");

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
