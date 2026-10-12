// ---------- Datos ----------
// Todo el contenido vive en content.js y se edita desde el panel /admin.
const C = window.CONTENT;

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clp = n => Number(n).toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const waLink = p => `https://wa.me/${C.general.whatsapp}${p ? `?text=${encodeURIComponent(`Hola, me interesa: ${p.name} (${clp(p.price)})`)}` : ""}`;
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
$("#teamImg").src = C.equipo.image;

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
$("#products").innerHTML = C.flautas.products.map(p => `
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
      <a class="btn full center" href="${waLink(p)}" target="_blank" rel="noopener">Comprar por WhatsApp</a>
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
