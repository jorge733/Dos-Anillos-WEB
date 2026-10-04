// ---------- Datos ----------
// Fotos, precios y descripciones de ejemplo: reemplazar por las reales.
const WHATSAPP = "56961772886";
const U = id => `img/${id}.webp`;

const CATEGORIES = [
  { key: "flauta", title: "Flautas pentatónicas" },
  { key: "cantel", title: "Cántel" },
  { key: "otros", title: "Otros productos" },
];

const PRODUCTS = [
  { id: 1, cat: "flauta", name: "Flauta pentatónica en Do", price: 35000, imgs: ["flautas-horizontal", "flautas-vertical", "flautas-detalle"],
    desc: "Flauta de afinación pentatónica: cualquier combinación de notas suena armoniosa. Ideal para iniciarse y para pedagogía musical.",
    specs: { Madera: "Cerezo", Afinación: "Pentatónica en Do", Acabado: "Aceite natural" }, sound: { kind: "flute", base: 523 } },
  { id: 2, cat: "flauta", name: "Flauta pentatónica en La", price: 35000, imgs: ["flautas-cruzadas-arcoiris", "flautas-cruzadas-verde"],
    desc: "Versión en La, de timbre suave y cálido.",
    specs: { Madera: "Cerezo", Afinación: "Pentatónica en La", Acabado: "Aceite natural" }, sound: { kind: "flute", base: 440 } },
  { id: 3, cat: "cantel", name: "Cántel de 7 cuerdas", price: 120000, imgs: ["cantel"],
    desc: "Cítara de mesa de afinación pentatónica, de sonido envolvente y meditativo.",
    specs: { Caja: "Cerezo", Cuerdas: "7, afinación pentatónica", Acabado: "Aceite natural" }, sound: { kind: "pluck", base: 196 } },
  { id: 4, cat: "otros", name: "Tabla de cortar", price: 25000, imgs: [],
    desc: "Tabla de cortar maciza, terminada a mano con aceite apto para alimentos.",
    specs: { Madera: "Cerezo", Acabado: "Aceite apto para alimentos" } },
];

// Por completar: añadir aquí el resto de maderas que se trabajan.
const WOODS = [
  { name: "Cerezo", c: "linear-gradient(90deg,#a8613f,#bf7550 25%,#9a5637 55%,#b86e49)", d: "Madera de grano fino y tono rojizo que se oscurece con el tiempo.", tone: "Cálido · equilibrado" },
];

// Por completar: añadir biografía y foto de cada artesano.
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
$("#catalogList").innerHTML = CATEGORIES.map((c, i) => `
  <div class="category">
    <h3 class="cat-title"><span>${i + 1}.</span> ${c.title}</h3>
    <div class="grid">${PRODUCTS.filter(p => p.cat === c.key).map(p => `
      <article class="card" data-id="${p.id}" tabindex="0">
        <div class="img">${p.imgs.length ? `<img loading="lazy" src="${U(p.imgs[0], 700)}" alt="${p.name}">` : `<div class="ph">Foto próximamente</div>`}</div>
        <h3>${p.name}</h3>
        <p class="meta">${Object.values(p.specs)[0]}</p>
        <p class="price">${clp(p.price)}</p>
      </article>`).join("")}</div>
  </div>`).join("");
$("#catalogList").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openProduct(+c.dataset.id); });
$("#catalogList").addEventListener("keydown", e => { const c = e.target.closest(".card"); if (c && e.key === "Enter") openProduct(+c.dataset.id); });

// ---------- Maderas y artesanos ----------
$("#woods").innerHTML = WOODS.map(w => `
  <div class="wood reveal"><div class="swatch" style="background:${w.c}"></div>
  <h3>${w.name}</h3><p>${w.d}</p><p class="tone">${w.tone}</p></div>`).join("");
$("#makers").innerHTML = MAKERS.map(m => `
  <article class="maker reveal">
    <div class="avatar">${m.name.split(" ").map(s => s[0]).join("")}</div>
    <h3>${m.name}</h3><p class="role">Artesano · Dos Anillos</p></article>`).join("");

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
  $("#audioTab").hidden = !current.sound;
  if (current.sound) {
    const notes = [["Nota base", 1], ["Quinta", 1.5], ["Octava", 2], ["Escala pentatónica", 0]];
    $("#mSamples").innerHTML = notes.map(([n, r]) => `
      <button class="sample" data-r="${r}"><span class="play">▶</span><span>${n}<small>${r ? Math.round(current.sound.base * r) + " Hz" : "Cinco notas"}</small></span></button>`).join("");
  }
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

// ---------- Audio sintetizado (sustituir por grabaciones reales) ----------
let ctx;
function pluck(freq, t) {
  const sr = ctx.sampleRate, n = sr * 3, buf = ctx.createBuffer(1, n, sr), out = buf.getChannelData(0);
  const N = Math.round(sr / freq), ring = new Float32Array(N).map(() => Math.random() * 2 - 1);
  for (let i = 0, p = 0; i < n; i++) { const q = (p + 1) % N; ring[p] = 0.996 * 0.5 * (ring[p] + ring[q]); out[i] = ring[p]; p = q; }
  const src = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = 0.5;
  src.buffer = buf; src.connect(g).connect(ctx.destination); src.start(t); return src;
}
function flute(freq, t, dur = 0.9) {
  const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = "sine"; o.frequency.value = freq;
  lfo.frequency.value = 5; lg.gain.value = freq * 0.006; lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.08); g.gain.setValueAtTime(0.35, t + dur - 0.15); g.gain.linearRampToValueAtTime(0, t + dur);
  o.connect(g).connect(ctx.destination); o.start(t); lfo.start(t); o.stop(t + dur); lfo.stop(t + dur); return o;
}
$("#mSamples").addEventListener("click", e => {
  const b = e.target.closest(".sample"); if (!b || !current.sound) return;
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  const { kind, base } = current.sound, r = +b.dataset.r, now = ctx.currentTime, play = kind === "flute" ? flute : pluck;
  const step = kind === "flute" ? 0.5 : 0.25;
  const last = r ? play(base * r, now) : [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3].map((m, i) => play(base * m, now + i * step)).pop();
  b.classList.add("playing"); last.onended = () => b.classList.remove("playing");
});

// ---------- Animaciones de entrada ----------
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
$$(".reveal, .section-head, .category").forEach(el => { el.classList.add("reveal"); io.observe(el); });
