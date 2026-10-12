// ---------- Qué se puede editar ----------
// Cada pestaña corresponde a una parte de content.js; los campos se dibujan a partir de esta descripción.
const MD = "Usa **negrita**, deja una línea en blanco para separar párrafos y empieza una línea con «- » para hacer una lista.";
const head = [
  { k: "eyebrow", label: "Etiqueta pequeña" },
  { k: "title", label: "Título" },
];
const TABS = [
  { key: "general", title: "Datos generales", fields: [
    { k: "whatsapp", label: "Número de WhatsApp", hint: "Solo números, con el código de país (ej.: 56912345678). Es adonde llegan los botones de compra." },
    { k: "phone", label: "Teléfono que se muestra en Contacto" },
    { k: "email", label: "Correo de contacto", hint: "Se muestra en Inicio y en Contacto, y recibe las sugerencias. Si lo cambias, el primer mensaje que llegue a ese correo pedirá activar FormSubmit." },
  ] },
  { key: "hero", title: "Inicio", fields: [
    { k: "eyebrow", label: "Etiqueta pequeña" },
    { k: "title", label: "Título (primera línea)" },
    { k: "titleEm", label: "Título (segunda línea, en cursiva)" },
    { k: "lead", label: "Bajada", type: "textarea" },
    { k: "image", label: "Foto de fondo", type: "image" },
  ] },
  { key: "productos", title: "Catálogo", fields: [...head,
    { k: "products", label: "Productos a la venta", type: "list", noun: "producto", name: p => p.name,
      blank: () => ({ name: "Nuevo producto", price: 0, imgs: [], desc: "", specs: [] }),
      fields: [
        { k: "name", label: "Nombre" },
        { k: "price", label: "Precio (CLP)", type: "number" },
        { k: "imgs", label: "Fotos", type: "gallery", hint: "La primera es la principal. Usa las flechas para ordenarlas." },
        { k: "desc", label: "Descripción", type: "textarea", hint: MD },
        { k: "specs", label: "Características", type: "list", noun: "característica", name: s => s.label, row: true,
          blank: () => ({ label: "", value: "" }),
          fields: [{ k: "label", label: "Nombre (ej.: Madera)" }, { k: "value", label: "Valor (ej.: Cerezo)" }] },
      ] },
  ] },
  { key: "maderas", title: "Maderas", fields: [...head,
    { k: "woods", label: "Maderas", type: "list", noun: "madera", name: w => w.name,
      blank: () => ({ name: "Nueva madera", c: gradient("#a0704f"), d: "", tone: "" }),
      fields: [
        { k: "name", label: "Nombre" },
        { k: "c", label: "Color de la muestra", type: "swatch" },
        { k: "d", label: "Descripción", type: "textarea" },
        { k: "tone", label: "Carácter (ej.: Cálido · equilibrado)" },
      ] },
  ] },
  { key: "cuidado", title: "Cuidado", fields: [...head,
    { k: "intro", label: "Introducción", type: "textarea" },
    { k: "steps", label: "Pasos", type: "list", noun: "paso", name: s => s.title,
      blank: () => ({ title: "Nuevo paso", text: "" }),
      fields: [{ k: "title", label: "Título" }, { k: "text", label: "Texto", type: "textarea", hint: MD, rows: 7 }] },
  ] },
  { key: "historia", title: "Historia", fields: [...head,
    { k: "blocks", label: "Bloques de texto", type: "list", noun: "bloque", name: b => b.title,
      blank: () => ({ title: "Nuevo bloque", text: "" }),
      fields: [{ k: "title", label: "Título" }, { k: "text", label: "Texto", type: "textarea", hint: MD, rows: 9 }] },
  ] },
  { key: "equipo", title: "Quiénes somos", fields: [...head,
    { k: "image", label: "Foto del taller", type: "image" },
    { k: "caption", label: "Pie de foto" },
    { k: "teamTitle", label: "Título de la lista" },
    { k: "makers", label: "Lutieres", type: "list", noun: "persona", name: m => m.name,
      blank: () => ({ name: "" }), fields: [{ k: "name", label: "Nombre" }] },
  ] },
  { key: "contacto", title: "Contacto", fields: [...head,
    { k: "intro", label: "Texto", type: "textarea" },
    { k: "button", label: "Texto del botón de WhatsApp" },
    { k: "emailButton", label: "Texto del botón de correo" },
    { k: "others", label: "Otros contactos (WhatsApp)", type: "list", noun: "contacto", name: o => o.name, row: true,
      blank: () => ({ name: "", whatsapp: "" }),
      fields: [{ k: "name", label: "Nombre" }, { k: "whatsapp", label: "WhatsApp (ej.: 56912345678)", hint: "Si lo dejas vacío, no se muestra." }] },
  ] },
  { key: "sugerencias", title: "Sugerencias", fields: [...head, { k: "intro", label: "Texto", type: "textarea" }] },
];

// ---------- Estado ----------
const $ = s => document.querySelector(s);
let password = "", content = null, baseSha = "", dirty = false, tab = TABS[0].key;
const uploads = {}; // ruta → { sha, preview } de fotos subidas que aún no se guardan

const h = (tag, props = {}, ...kids) => {
  const el = Object.assign(document.createElement(tag), props);
  el.append(...kids.flat().filter(k => k != null && k !== false));
  return el;
};

async function api(action, args = {}) {
  const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, password, ...args }) });
  const data = await r.json().catch(() => ({ error: `Error ${r.status} del servidor.` }));
  if (!r.ok) throw Object.assign(new Error(data.error || `Error ${r.status}`), { status: r.status });
  return data;
}

function setStatus(msg, kind = "") { const s = $("#status"); s.textContent = msg; s.className = `status ${kind}`; }
function touch() { dirty = true; $("#save").disabled = false; setStatus("Cambios sin guardar"); }

// ---------- Fotos ----------
const srcOf = path => uploads[path]?.preview || `/${path}`;

// Achica la foto en el navegador (máx. 1800 px, WebP) para que cargue rápido en el sitio.
async function compress(file) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
  const canvas = h("canvas", { width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(res, "image/webp", 0.82));
}

async function upload(file) {
  const blob = await compress(file);
  const data = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(blob); });
  const { sha } = await api("upload", { data });
  const path = `img/subida-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.webp`;
  uploads[path] = { sha, preview: URL.createObjectURL(blob) };
  return path;
}

function picker(text, multiple, onPaths) {
  const input = h("input", { type: "file", accept: "image/*", multiple, hidden: true });
  const btn = h("button", { type: "button", className: "pick", textContent: text, onclick: () => input.click() });
  input.onchange = async () => {
    const files = [...input.files];
    if (!files.length) return;
    btn.classList.add("busy"); btn.textContent = "Subiendo…";
    try { onPaths(await Promise.all(files.map(upload))); }
    catch (e) { alert(`No se pudo subir la foto: ${e.message}`); btn.classList.remove("busy"); btn.textContent = text; }
  };
  return [btn, input];
}

// ---------- Color de las maderas ----------
const shade = (hex, f) => "#" + [1, 3, 5].map(i => {
  const c = parseInt(hex.slice(i, i + 2), 16);
  return Math.round(f > 0 ? c + (255 - c) * f : c * (1 + f)).toString(16).padStart(2, "0");
}).join("");
const gradient = hex => `linear-gradient(90deg,${hex},${shade(hex, .12)} 30%,${shade(hex, -.12)} 60%,${shade(hex, .06)})`;
const baseColor = g => (String(g).match(/#[0-9a-f]{6}/i) || ["#a0704f"])[0];

// ---------- Campos ----------
function field(f, obj, rerender) {
  const v = obj[f.k];
  const set = val => { obj[f.k] = val; touch(); };
  const hint = f.hint && h("span", { className: "hint", textContent: f.hint });

  switch (f.type) {
    case "textarea":
      return h("label", {}, f.label, h("textarea", { value: v ?? "", rows: f.rows || 4, oninput: e => set(e.target.value) }), hint);
    case "number":
      return h("label", {}, f.label, h("input", { type: "number", min: 0, step: 500, value: v ?? 0, oninput: e => set(Number(e.target.value) || 0) }), hint);
    case "swatch": {
      const sw = h("div", { className: "swatch" }); sw.style.background = v;
      const color = h("input", { type: "color", value: baseColor(v), oninput: e => { set(gradient(e.target.value)); sw.style.background = obj[f.k]; } });
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), h("div", { className: "swatch-field" }, sw, color));
    }
    case "image":
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }),
        h("div", { className: "photos" },
          h("div", { className: "photo single" }, h("img", { src: srcOf(v), alt: "" })),
          picker("Cambiar foto", false, ([p]) => { set(p); rerender(); })));
    case "gallery": {
      const move = (i, d) => { v.splice(i + d, 0, v.splice(i, 1)[0]); touch(); rerender(); };
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), hint,
        h("div", { className: "photos" },
          v.map((p, i) => h("div", { className: "photo" }, h("img", { src: srcOf(p), alt: `Foto ${i + 1}` }),
            h("div", { className: "tools" },
              h("button", { type: "button", className: "icon", textContent: "←", title: "Mover antes", disabled: i === 0, onclick: () => move(i, -1) }),
              h("button", { type: "button", className: "icon del", textContent: "✕", title: "Quitar foto", onclick: () => { if (confirm("¿Quitar esta foto?")) { v.splice(i, 1); touch(); rerender(); } } }),
              h("button", { type: "button", className: "icon", textContent: "→", title: "Mover después", disabled: i === v.length - 1, onclick: () => move(i, 1) })))),
          picker("+ Agregar fotos", true, ps => { v.push(...ps); touch(); rerender(); })));
    }
    case "list": {
      const box = h("div", { className: "list" });
      const draw = () => box.replaceChildren(
        h("span", { className: "list-title", textContent: f.label }),
        ...v.map((item, i) => {
          const move = d => { v.splice(i + d, 0, v.splice(i, 1)[0]); touch(); draw(); };
          const title = h("strong", { textContent: f.name(item) || `(sin ${f.k === "specs" ? "nombre" : "título"})` });
          const body = h("div", { className: f.row ? "row" : "list" });
          const drawBody = () => body.replaceChildren(...f.fields.map(sub => field(sub, item, drawBody)));
          drawBody();
          body.addEventListener("input", () => (title.textContent = f.name(item) || "…"));
          return h("div", { className: "item" },
            h("div", { className: "item-head" }, title,
              h("button", { type: "button", className: "icon", textContent: "↑", title: "Subir", disabled: i === 0, onclick: () => move(-1) }),
              h("button", { type: "button", className: "icon", textContent: "↓", title: "Bajar", disabled: i === v.length - 1, onclick: () => move(1) }),
              h("button", { type: "button", className: "icon del", textContent: "✕", title: `Eliminar ${f.noun}`,
                onclick: () => { if (confirm(`¿Eliminar ${f.noun} «${f.name(item) || "sin nombre"}»?`)) { v.splice(i, 1); touch(); draw(); } } })),
            body);
        }),
        h("button", { type: "button", className: "add", textContent: `+ Agregar ${f.noun}`, onclick: () => { v.push(f.blank()); touch(); draw(); } }));
      draw();
      return box;
    }
    default:
      return h("label", {}, f.label, h("input", { value: v ?? "", oninput: e => set(e.target.value) }), hint);
  }
}

function render() {
  $("#tabs").replaceChildren(...TABS.map(t => h("button", { type: "button", role: "tab", textContent: t.title, ariaSelected: String(t.key === tab),
    onclick: () => { tab = t.key; render(); scrollTo(0, 0); } })));
  const t = TABS.find(t => t.key === tab);
  const draw = () => $("#editor").replaceChildren(h("h2", { textContent: t.title }), ...t.fields.map(f => field(f, content[t.key], draw)));
  draw();
}

// ---------- Entrar, guardar, salir ----------
async function open(pw) {
  password = pw;
  const data = await api("load");
  content = data.content; baseSha = data.sha;
  sessionStorage.setItem("adminPw", pw);
  $("#login").hidden = true; $("#app").hidden = false;
  render();
}

$("#login").onsubmit = async e => {
  e.preventDefault();
  const btn = $("#login button"); btn.disabled = true; $("#loginError").textContent = "";
  try { await open(e.target.password.value); }
  catch (err) { $("#loginError").textContent = err.message; }
  btn.disabled = false;
};

$("#save").onclick = async () => {
  const btn = $("#save"); btn.disabled = true; setStatus("Guardando…");
  const json = JSON.stringify(content);
  const images = Object.entries(uploads).filter(([p]) => json.includes(p)).map(([path, u]) => ({ path, sha: u.sha }));
  try {
    ({ sha: baseSha } = await api("save", { content, baseSha, images }));
    dirty = false;
    setStatus("Guardado. El sitio se actualiza en 1 o 2 minutos.", "ok");
  } catch (e) { setStatus(e.message, "bad"); btn.disabled = false; }
};

$("#logout").onclick = () => {
  if (dirty && !confirm("Tienes cambios sin guardar. ¿Salir igual?")) return;
  dirty = false; sessionStorage.removeItem("adminPw"); location.reload();
};

addEventListener("beforeunload", e => { if (dirty) e.preventDefault(); });

// Si ya entraste en esta pestaña, no vuelve a pedir la contraseña.
const saved = sessionStorage.getItem("adminPw");
if (saved) open(saved).catch(() => sessionStorage.removeItem("adminPw"));
