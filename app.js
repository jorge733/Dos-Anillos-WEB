// ---------- Datos ----------
const U = (id, w = 900) => `https://images.unsplash.com/${id}?w=${w}&q=75&auto=format&fit=crop`;

const IMGS = {
  guitar: ["photo-1510915361894-db8b60106cb1", "photo-1525201548942-d8732f6617a0", "photo-1550291652-6ea9114a47b1", "photo-1564186763535-ebb21ef5277f"],
  violin: ["photo-1612225330812-01a9c6b355ec", "photo-1465821185615-20b3c2fbf41b", "photo-1460036521480-ff49c08c2781"],
  cello: ["photo-1514119412350-e174d90d280e", "photo-1507838153414-b4b713384a76"],
  uke: ["photo-1541689592655-f5f52825a3b8", "photo-1585837575652-267c041d77d4"],
  mandolin: ["photo-1595069906974-f8ae7ffc3e7a", "photo-1516924962500-2b4b3b99ea02"],
};

const PRODUCTS = [
  { id: 1, name: "Guitarra Clásica Alhambra Maestro", type: "Guitarra", wood: ["Abeto", "Palisandro", "Ébano"], finish: "Goma laca", price: 3850, maker: "Elena Ruiz", imgs: IMGS.guitar,
    desc: "Guitarra de concierto con varetaje en abanico de siete varillas. Proyección amplia y bajos redondos, ideal para repertorio romántico.",
    specs: { Tapa: "Abeto alemán macizo, grado AAAA", "Aros y fondo": "Palisandro de la India macizo", Mástil: "Cedro de Honduras", Diapasón: "Ébano de Gabón", Puente: "Palisandro", Acabado: "Goma laca a muñequilla" }, base: 110, kind: "pluck" },
  { id: 2, name: "Acústica Dreadnought Roble Viejo", type: "Guitarra", wood: ["Abeto", "Caoba", "Ébano"], finish: "Nitrocelulosa", price: 2490, maker: "Tomás Varela", imgs: [IMGS.guitar[1], IMGS.guitar[3], IMGS.guitar[0]],
    desc: "Dreadnought de cuerdas de acero con medios cálidos y un sustain largo. Varetaje en X festoneado a mano.",
    specs: { Tapa: "Abeto Sitka macizo", "Aros y fondo": "Caoba de Honduras maciza", Mástil: "Caoba, alma de doble acción", Diapasón: "Ébano", Acabado: "Nitrocelulosa brillante, capa fina" }, base: 98, kind: "pluck" },
  { id: 3, name: "Violín Stradivari 1715 (copia)", type: "Violín", wood: ["Abeto", "Arce", "Ébano"], finish: "Barniz al aceite", price: 5200, maker: "Martina Ferraro", imgs: IMGS.violin,
    desc: "Réplica fiel del modelo 'Lipinski'. Fondo de arce flameado de una pieza y barniz al aceite con pigmentos naturales.",
    specs: { Tapa: "Abeto de Val di Fiemme, 12 años de curado", Fondo: "Arce balcánico flameado, una pieza", Aros: "Arce flameado", Mástil: "Arce", Diapasón: "Ébano", Acabado: "Barniz al aceite, ámbar" }, base: 196, kind: "bow" },
  { id: 4, name: "Violonchelo Taller 4/4", type: "Violonchelo", wood: ["Abeto", "Arce", "Ébano"], finish: "Satinado", price: 6900, maker: "Martina Ferraro", imgs: IMGS.cello,
    desc: "Chelo de estudio avanzado con graves profundos y respuesta rápida en registro agudo.",
    specs: { Tapa: "Abeto alpino macizo", "Fondo y aros": "Arce europeo", Mástil: "Arce", Diapasón: "Ébano", Acabado: "Barniz satinado" }, base: 65, kind: "bow" },
  { id: 5, name: "Ukelele Tenor Koa", type: "Ukelele", wood: ["Koa"], finish: "Satinado", price: 890, maker: "Tomás Varela", imgs: IMGS.uke,
    desc: "Todo koa macizo. Timbre brillante y dulce que madura con los años de uso.",
    specs: { Tapa: "Koa hawaiano macizo", "Aros y fondo": "Koa macizo", Mástil: "Caoba", Diapasón: "Palisandro", Acabado: "Satinado al aceite" }, base: 262, kind: "pluck" },
  { id: 6, name: "Mandolina Estilo A Cedro", type: "Mandolina", wood: ["Cedro", "Arce", "Ébano"], finish: "Brillante", price: 1650, maker: "Elena Ruiz", imgs: IMGS.mandolin,
    desc: "Tapa tallada a mano en cedro rojo, con un ataque cristalino y armónicos ricos.",
    specs: { Tapa: "Cedro rojo occidental tallado", "Aros y fondo": "Arce flameado", Mástil: "Arce", Diapasón: "Ébano", Acabado: "Brillante pulido a mano" }, base: 196, kind: "pluck" },
  { id: 7, name: "Guitarra Flamenca Ciprés", type: "Guitarra", wood: ["Abeto", "Ciprés", "Ébano"], finish: "Goma laca", price: 2950, maker: "Elena Ruiz", imgs: [IMGS.guitar[2], IMGS.guitar[0], IMGS.guitar[1]],
    desc: "Flamenca blanca de respuesta percusiva, acción baja y golpeador transparente.",
    specs: { Tapa: "Abeto alemán macizo", "Aros y fondo": "Ciprés español", Mástil: "Cedro", Diapasón: "Ébano", Clavijero: "Clavijas de madera", Acabado: "Goma laca" }, base: 110, kind: "pluck" },
  { id: 8, name: "Acústica Parlor Cedro & Nogal", type: "Guitarra", wood: ["Cedro", "Nogal", "Ébano"], finish: "Satinado", price: 1980, maker: "Tomás Varela", imgs: [IMGS.guitar[3], IMGS.guitar[2]],
    desc: "Cuerpo pequeño y cómodo, sonido íntimo y equilibrado, perfecto para fingerpicking.",
    specs: { Tapa: "Cedro rojo occidental macizo", "Aros y fondo": "Nogal europeo macizo", Mástil: "Caoba", Diapasón: "Ébano", Acabado: "Satinado de poro abierto" }, base: 123, kind: "pluck" },
];

const WOODS = [
  { name: "Abeto", c: "linear-gradient(90deg,#e8d7b0,#f0e2c0 20%,#dcc79c 40%,#efe0bd 60%,#e2cfa6)", d: "Rígido y ligero, la tapa armónica por excelencia.", tone: "Brillante · articulado · gran proyección" },
  { name: "Cedro", c: "linear-gradient(90deg,#b5714a,#c98559 25%,#a8643f 55%,#c27e52)", d: "Responde rápido y suena 'abierto' desde el primer día.", tone: "Cálido · dulce · inmediato" },
  { name: "Palisandro", c: "linear-gradient(90deg,#4a2c22,#6b3f2c 30%,#3e241b 55%,#5e3826)", d: "Denso y aceitoso, la madera clásica para fondos.", tone: "Bajos profundos · agudos campanudos" },
  { name: "Arce", c: "repeating-linear-gradient(90deg,#e3c08a 0 6px,#cfa56b 6px 10px,#e8c793 10px 18px)", d: "Reflectante; su flameado es una joya visual.", tone: "Claro · definido · enfocado" },
  { name: "Caoba", c: "linear-gradient(90deg,#7a3a24,#93492d 30%,#6d321f 60%,#8a4329)", d: "Estable y resonante, protagonista de mástiles.", tone: "Medios cálidos · seco · 'woody'" },
  { name: "Ébano", c: "linear-gradient(90deg,#1d1a18,#2b2724 40%,#161412)", d: "Durísimo, ideal para diapasones y puentes.", tone: "Ataque nítido · durabilidad" },
];

const MAKERS = [
  { name: "Elena Ruiz", role: "Guitarrera · Granada", img: U("photo-1452860606245-08befc0ff44b", 700),
    bio: "Aprendió el oficio en la Cuesta de Gomérez, junto a los últimos discípulos de la escuela granadina. Construye solo once guitarras al año.", quote: "La tapa te dice cuándo está lista. Solo hay que aprender a escucharla." },
  { name: "Martina Ferraro", role: "Luthier de arco · Cremona", img: U("photo-1511192336575-5a79af67a629", 700),
    bio: "Formada en la Scuola Internazionale di Liuteria, selecciona personalmente sus abetos en el bosque de Paneveggio durante la luna menguante.", quote: "Un violín no se termina: se le entrega al músico para que lo acabe." },
  { name: "Tomás Varela", role: "Taller independiente · Asturias", img: U("photo-1504198458649-3128b932f49e", 700),
    bio: "Ebanista reconvertido en lutier, trabaja con maderas recuperadas y certificadas FSC. Su firma es el festoneado a mano de cada varilla.", quote: "La mejor madera es la que ya ha esperado cien años." },
];

// ---------- Utilidades ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const eur = n => n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const toast = msg => { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2200); };

// ---------- Nav ----------
const nav = $("#nav");
addEventListener("scroll", () => nav.classList.toggle("solid", scrollY > innerHeight * 0.7), { passive: true });

// ---------- Hero sonido ----------
const video = $("#heroVideo"), soundBtn = $("#soundBtn");
soundBtn.addEventListener("click", () => {
  video.muted = !video.muted;
  if (!video.muted) video.play();
  soundBtn.setAttribute("aria-pressed", !video.muted);
  $("#soundLabel").textContent = video.muted ? "Activar sonido" : "Silenciar";
});

// ---------- Filtros ----------
const state = { type: new Set(), wood: new Set(), finish: new Set() };
const options = {
  type: [...new Set(PRODUCTS.map(p => p.type))],
  wood: [...new Set(PRODUCTS.flatMap(p => p.wood))].sort(),
  finish: [...new Set(PRODUCTS.map(p => p.finish))],
};
for (const key in options) {
  $(`[data-filter=${key}]`).innerHTML = options[key]
    .map(v => `<label><input type="checkbox" value="${v}" data-key="${key}">${v}</label>`).join("");
}
$("#filters").addEventListener("change", e => {
  const { key } = e.target.dataset; if (!key) return;
  e.target.checked ? state[key].add(e.target.value) : state[key].delete(e.target.value);
  render();
});
$("#clearFilters").addEventListener("click", () => {
  for (const k in state) state[k].clear();
  $$("#filters input").forEach(i => (i.checked = false));
  render();
});

function render() {
  const list = PRODUCTS.filter(p =>
    (!state.type.size || state.type.has(p.type)) &&
    (!state.wood.size || p.wood.some(w => state.wood.has(w))) &&
    (!state.finish.size || state.finish.has(p.finish)));
  $("#resultCount").textContent = `${list.length} instrumento${list.length === 1 ? "" : "s"}`;
  $("#grid").innerHTML = list.length ? list.map(p => `
    <article class="card" data-id="${p.id}" tabindex="0">
      <div class="img"><img loading="lazy" src="${U(p.imgs[0], 700)}" alt="${p.name}"></div>
      <h3>${p.name}</h3>
      <p class="meta">${p.wood.join(" · ")} — ${p.finish}</p>
      <p class="price">${eur(p.price)}</p>
    </article>`).join("") : `<p class="empty">Ningún instrumento coincide con esos filtros.</p>`;
}
render();
$("#grid").addEventListener("click", e => { const c = e.target.closest(".card"); if (c) openProduct(+c.dataset.id); });
$("#grid").addEventListener("keydown", e => { const c = e.target.closest(".card"); if (c && e.key === "Enter") openProduct(+c.dataset.id); });

// ---------- Maderas y artesanos ----------
$("#woods").innerHTML = WOODS.map(w => `
  <div class="wood reveal"><div class="swatch" style="background:${w.c}"></div>
  <h3>${w.name}</h3><p>${w.d}</p><p class="tone">${w.tone}</p></div>`).join("");
$("#makers").innerHTML = MAKERS.map(m => `
  <article class="maker reveal"><img loading="lazy" src="${m.img}" alt="${m.name}">
  <h3>${m.name}</h3><p class="role">${m.role}</p><p>${m.bio}</p><blockquote>“${m.quote}”</blockquote></article>`).join("");

// ---------- Modal producto ----------
const modal = $("#modal");
let current = null;
function openProduct(id) {
  current = PRODUCTS.find(p => p.id === id);
  $("#mTitle").textContent = current.name;
  $("#mMaker").textContent = `Por ${current.maker}`;
  $("#mPrice").textContent = eur(current.price);
  $("#mDesc").innerHTML = `<p>${current.desc}</p><p class="muted small" style="margin-top:1rem">Acabado: ${current.finish}. Incluye estuche rígido climatizado.</p>`;
  $("#mSpecs").innerHTML = Object.entries(current.specs).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
  setMain(0);
  $("#thumbs").innerHTML = current.imgs.map((id, i) => `<img src="${U(id, 160)}" data-i="${i}" class="${i ? "" : "active"}" alt="Vista ${i + 1}">`).join("");
  const notes = [["Nota grave", 1], ["Quinta", 1.5], ["Octava", 2], ["Acorde", 0]];
  $("#mSamples").innerHTML = notes.map(([n, r]) => `
    <button class="sample" data-r="${r}"><span class="play">▶</span><span>${n}<small>${r ? Math.round(current.base * r) + " Hz" : "Arpegio abierto"}</small></span></button>`).join("");
  switchTab("desc");
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeModal() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
function setMain(i) { $("#mainImg").src = U(current.imgs[i], 1400); $("#mainImg").alt = current.name; }
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
let cart = 0;
$("#addCart").onclick = () => { $("#cartCount").textContent = ++cart; toast(`${current.name} añadido al carrito`); };
$("#cartBtn").onclick = () => toast(cart ? `${cart} instrumento(s) en tu carrito` : "Tu carrito está vacío");

// ---------- Audio (síntesis de cuerda Karplus-Strong) ----------
// Muestras sintetizadas como demostración; sustituir por grabaciones reales (.mp3/.flac) de cada instrumento.
let ctx;
function stringBuffer(freq, kind, dur = 3) {
  const sr = ctx.sampleRate, n = Math.floor(sr * dur), buf = ctx.createBuffer(1, n, sr), out = buf.getChannelData(0);
  const N = Math.round(sr / freq), ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  const decay = kind === "bow" ? 0.9985 : 0.996;
  for (let i = 0, p = 0; i < n; i++) {
    const next = (p + 1) % N, v = decay * 0.5 * (ring[p] + ring[next]);
    if (kind === "bow") ring[p] = v + (Math.random() * 2 - 1) * 0.012 * Math.min(1, i / (sr * 0.15));
    else ring[p] = v;
    out[i] = ring[p] * (kind === "bow" ? Math.min(1, i / (sr * 0.12)) : 1);
    p = next;
  }
  return buf;
}
function play(freq, delay = 0) {
  const src = ctx.createBufferSource(), body = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = stringBuffer(freq, current.kind);
  body.type = "peaking"; body.frequency.value = current.base * 2; body.gain.value = 5; // resonancia de caja
  g.gain.value = 0.5;
  src.connect(body).connect(g).connect(ctx.destination);
  src.start(ctx.currentTime + delay);
  return src;
}
$("#mSamples").addEventListener("click", e => {
  const b = e.target.closest(".sample"); if (!b) return;
  ctx ??= new (window.AudioContext || window.webkitAudioContext)();
  const r = +b.dataset.r, f = current.base;
  const last = r ? play(f * r) : [1, 1.5, 2, 2.5, 3].map((m, i) => play(f * m, i * 0.09)).pop();
  b.classList.add("playing"); last.onended = () => b.classList.remove("playing");
});

// ---------- Animaciones de entrada ----------
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
$$(".reveal, .section-head, .steps li").forEach(el => { el.classList.add("reveal"); io.observe(el); });
