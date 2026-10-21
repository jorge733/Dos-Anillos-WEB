// ---------- Qué se puede editar ----------
// Cada pestaña corresponde a una parte de content.js; los campos se dibujan a partir de esta descripción.
const MD = "Usa **negrita**, deja una línea en blanco para separar párrafos y empieza una línea con «- » para hacer una lista.";
const head = [
  { k: "eyebrow", label: "Etiqueta pequeña" },
  { k: "title", label: "Título" },
];
const TABS = [
  { key: "pedidos", title: "Pedidos", custom: () => renderOrders() },
  { key: "notas", title: "Anotaciones", custom: () => renderNotes() },
  { key: "general", title: "Datos generales", fields: [
    { k: "instagram", label: "Instagram (sin @)", hint: "Ej.: dosanillos. Se muestra en Contacto y en el menú. Déjalo vacío para no mostrarlo." },
    { k: "whatsapp", label: "Número de WhatsApp", hint: "Solo números, con el código de país (ej.: 56912345678). Es adonde llegan los botones de contacto." },
    { k: "phone", label: "Teléfono que se muestra en Contacto" },
    { k: "email", label: "Correo de contacto", hint: "Se muestra en Contacto y recibe las sugerencias. Si lo cambias, el primer mensaje que llegue a ese correo pedirá activar FormSubmit." },
    { k: "orderEmails", label: "Correos que reciben el aviso de cada venta", hint: "Puedes poner varios separados por comas." },
  ] },
  { key: "hero", title: "Inicio", fields: [
    { k: "eyebrow", label: "Etiqueta pequeña" },
    { k: "title", label: "Título (primera línea)" },
    { k: "titleEm", label: "Título (segunda línea, en cursiva)" },
    { k: "lead", label: "Bajada", type: "textarea" },
    { k: "intro", label: "Introducción", type: "textarea", hint: "Párrafo corto bajo la bajada. Usa **negrita** para destacar." },
    { k: "button", label: "Texto del botón al catálogo" },
    { k: "image", label: "Foto de fondo", type: "image" },
  ] },
  { key: "productos", title: "Catálogo", fields: [...head,
    { k: "categories", label: "Secciones del catálogo", type: "list", noun: "sección", name: c => c.name, row: true,
      hint: "El catálogo se muestra dividido en estas secciones, en este orden. Una sección sin productos no aparece.",
      blank: () => ({ id: "s" + Date.now().toString(36), name: "Nueva sección" }),
      fields: [{ k: "name", label: "Nombre de la sección" }] },
    { k: "products", label: "Productos a la venta", type: "list", noun: "producto", name: p => p.name,
      blank: () => ({ id: "p" + Date.now().toString(36), name: "Nuevo producto", category: content.productos.categories[0]?.id || "", price: 0, stock: null, shipping: "auto", imgs: [], desc: "", specs: [] }),
      fields: [
        { k: "name", label: "Nombre" },
        { k: "category", label: "Sección", type: "select", options: () => content.productos.categories.map(c => [c.id, c.name || "(sin nombre)"]) },
        { k: "price", label: "Precio (CLP)", type: "number", step: 500 },
        { k: "stock", label: "Unidades disponibles", type: "stock",
          hint: "Las que tienes ahora. Baja sola con cada venta pagada: el sitio muestra «Quedan 3» y no deja comprar más. Con 0 aparece como agotado. Déjalo vacío para no controlar el stock." },
        { k: "shipping", label: "Envío", type: "select", options: [
            ["auto", "Automático: se cobra según la región (pestaña Envíos)"],
            ["coordinar", "Se calcula después del pago (productos grandes o pesados)"]],
          hint: "Si un pedido trae algún producto con envío «después del pago», todo el envío de ese pedido queda por coordinar con el cliente." },
        { k: "imgs", label: "Fotos y videos", type: "gallery", video: true, hint: "La primera foto es la principal. Usa las flechas para ordenarlas. Los videos se ven en la ficha del producto (MP4 o MOV, hasta 200 MB)." },
        { k: "desc", label: "Descripción", type: "textarea", hint: MD },
        { k: "specs", label: "Características", type: "list", noun: "característica", name: s => s.label, row: true,
          blank: () => ({ label: "", value: "" }),
          fields: [{ k: "label", label: "Nombre (ej.: Madera)" }, { k: "value", label: "Valor (ej.: Cerezo)" }] },
      ] },
  ] },
  { key: "envios", title: "Envíos", fields: [
    { k: "regions", label: "Precio del envío por región (CLP)", type: "rates",
      hint: "Es lo que se cobra por un pedido con un producto. Deja vacía una región para coordinar el envío con el cliente después del pago; pon 0 para envío gratis." },
    { k: "extra", label: "Recargo por cada producto adicional (CLP)", type: "number", step: 100,
      hint: "Se suma por cada producto más en el mismo pedido. Ej.: con 4.000 de región y 1.000 de recargo, 3 flautas pagan 6.000 de envío." },
  ] },
  { key: "maderas", title: "Maderas", fields: [...head,
    { k: "woods", label: "Maderas", type: "list", noun: "madera", name: w => w.name,
      blank: () => ({ name: "Nueva madera", img: "", c: gradient("#a0704f"), d: "", tone: "" }),
      fields: [
        { k: "name", label: "Nombre" },
        { k: "img", label: "Foto real de la madera", type: "optimage", hint: "Si subes una foto, se muestra en lugar del color. Se recorta a una franja horizontal, así que sirve una foto de cerca de la veta." },
        { k: "c", label: "Color de la muestra (se usa si no hay foto)", type: "swatch" },
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
    { k: "media", label: "Fotos y videos", type: "list", noun: "foto o video", name: m => m.title,
      hint: "La primera se muestra grande y las demás en una grilla debajo, cada una con su título y descripción.",
      blank: () => ({ src: "", title: "", text: "" }),
      fields: [
        { k: "src", label: "Foto o video", type: "media" },
        { k: "title", label: "Título (opcional)" },
        { k: "text", label: "Descripción (opcional)", type: "textarea", rows: 3, hint: MD }] },
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

// ---------- Fotos y videos ----------
// Las fotos se guardan en el repositorio (img/); los videos, en Vercel Blob (dirección https completa).
const srcOf = path => uploads[path]?.preview || (/^https?:/.test(path) ? path : `/${path}`);
const isVideo = src => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(src));
const preview = (src, alt = "") => isVideo(src)
  ? h("video", { src: srcOf(src) + "#t=0.5", muted: true, playsInline: true, preload: "metadata", title: "Video" })
  : h("img", { src: srcOf(src), alt });

// Achica la foto en el navegador (máx. 1800 px, WebP) para que cargue rápido en el sitio.
async function compress(file) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / Math.max(img.width, img.height));
  const canvas = h("canvas", { width: Math.round(img.width * scale), height: Math.round(img.height * scale) });
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise(res => canvas.toBlob(res, "image/webp", 0.82));
}

// El video va directo del navegador a Vercel Blob (api/upload.js solo da el permiso).
const BLOB_CLIENT = "https://esm.sh/@vercel/blob@2.8.0/client";
async function uploadVideo(file, onProgress) {
  const headers = { "Content-Type": "application/json", "x-admin-password": encodeURIComponent(password) };
  const check = await fetch("/api/upload", { method: "POST", headers, body: JSON.stringify({ type: "check" }) });
  if (!check.ok) throw new Error((await check.json().catch(() => ({}))).error || `Error ${check.status} del servidor.`);
  const { upload } = await import(BLOB_CLIENT);
  const ext = (file.name.match(/\.(mp4|webm|mov|m4v)$/i)?.[1] || { "video/webm": "webm", "video/quicktime": "mov" }[file.type] || "mp4").toLowerCase();
  const r = await upload(`videos/video-${Date.now().toString(36)}.${ext}`, file, {
    access: "public", handleUploadUrl: "/api/upload", multipart: file.size > 20e6,
    headers: { "x-admin-password": headers["x-admin-password"] },
    onUploadProgress: e => onProgress?.(e.percentage),
  });
  return r.url;
}

async function upload(file, onProgress) {
  if (file.type.startsWith("video/")) {
    if (file.size > 200 * 1024 * 1024) throw new Error("el video pesa más de 200 MB. Acórtalo o bájale la calidad.");
    return uploadVideo(file, onProgress);
  }
  const blob = await compress(file);
  const data = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.readAsDataURL(blob); });
  const { sha } = await api("upload", { data });
  const path = `img/subida-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.webp`;
  uploads[path] = { sha, preview: URL.createObjectURL(blob) };
  return path;
}

function picker(text, multiple, onPaths, video = false) {
  const input = h("input", { type: "file", accept: video ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*", multiple, hidden: true });
  const btn = h("button", { type: "button", className: "pick", textContent: text, onclick: () => input.click() });
  input.onchange = async () => {
    const files = [...input.files];
    if (!files.length) return;
    btn.classList.add("busy"); btn.textContent = "Subiendo…";
    // Los videos tardan: se muestra el avance (si hay varios archivos, el del más atrasado).
    const pct = files.map(f => f.type.startsWith("video/") ? 0 : 100);
    const progress = i => p => { pct[i] = p; btn.textContent = `Subiendo… ${Math.round(Math.min(...pct))}%`; };
    try { onPaths(await Promise.all(files.map((f, i) => upload(f, progress(i))))); }
    catch (e) { alert(`No se pudo subir: ${e.message}`); btn.classList.remove("busy"); btn.textContent = text; }
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

// ---------- Stock ----------
// sold: unidades pagadas por producto desde que se fijó su stock (null si no hay base de datos).
// savedStock: el stock guardado, para avisar que al cambiarlo el contador vuelve a 0.
let sold = null, savedStock = {};
const stockNum = s => s == null || s === "" ? null : Math.max(0, Math.floor(Number(s)) || 0);
const rememberStock = () => (savedStock = Object.fromEntries(content.productos.products.map(p => [p.id, stockNum(p.stock)])));
function soldText(p) {
  const n = stockNum(p.stock), was = savedStock[p.id] ?? null;
  if (p.id in savedStock && n !== was) return n == null ? "Al guardar, deja de controlarse el stock." : "Al guardar, este será el stock y el contador de vendidas parte de 0.";
  if (n == null || !sold) return "";
  const k = sold[p.id] || 0, left = Math.max(0, n - k);
  return k ? `Vendidas desde la última vez que lo fijaste: ${k} · ${!left ? "en la tienda aparece agotado" : left === 1 ? "en la tienda queda 1" : `en la tienda quedan ${left}`}.` : "Sin ventas desde la última vez que lo fijaste.";
}

// ---------- Campos ----------
function field(f, obj, rerender) {
  const v = obj[f.k];
  const set = val => { obj[f.k] = val; touch(); };
  const hint = f.hint && h("span", { className: "hint", textContent: f.hint });

  switch (f.type) {
    case "textarea":
      return h("label", {}, f.label, h("textarea", { value: v ?? "", rows: f.rows || 4, oninput: e => set(e.target.value) }), hint);
    case "number":
      return h("label", {}, f.label, h("input", { type: "number", min: 0, step: f.step || 1, value: v ?? 0, oninput: e => set(Number(e.target.value) || 0) }), hint);
    case "select": {
      const options = typeof f.options === "function" ? f.options() : f.options;
      // Si el valor ya no existe (ej.: se borró la sección), queda elegida la primera opción, igual que en el sitio.
      const current = options.some(([value]) => value === v) ? v : options[0]?.[0];
      return h("label", {}, f.label, h("select", { onchange: e => set(e.target.value) },
        ...options.map(([value, text]) => h("option", { value, textContent: text, selected: value === current }))), hint);
    }
    // Vacío = no se controla el stock (se guarda null). Al lado, lo vendido desde que se fijó el número.
    case "stock": {
      const note = h("span", { className: "hint sold" });
      const show = () => { note.textContent = soldText(obj); };
      show();
      return h("label", {}, f.label, h("input", { type: "number", min: 0, step: 1, value: v ?? "", placeholder: "Sin indicar",
        oninput: e => { set(e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value)) || 0)); show(); } }), note, hint);
    }
    // Una fila por región; vacío = sin tarifa (el envío se coordina después).
    case "rates":
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), hint,
        h("div", { className: "rates" }, ...v.map(r => h("label", {}, r.name,
          h("input", { type: "number", min: 0, step: 100, value: r.price ?? "", placeholder: "Por coordinar",
            oninput: e => { r.price = e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0); touch(); } })))));
    case "group":
      if (!v) obj[f.k] = {};
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), hint,
        h("div", { className: "row" }, ...f.fields.map(sub => field(sub, obj[f.k], rerender))));
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
    // Foto que se puede dejar vacía (ej.: madera, que si no tiene foto usa su color).
    case "optimage":
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), hint,
        h("div", { className: "photos" },
          v ? h("div", { className: "photo wide" }, h("img", { src: srcOf(v), alt: "" }),
            h("div", { className: "tools" }, h("button", { type: "button", className: "icon del", textContent: "✕ Quitar foto", title: "Quitar foto",
              onclick: () => { if (confirm("¿Quitar esta foto? Se volverá a mostrar el color.")) { set(""); rerender(); } } }))) : null,
          picker(v ? "Cambiar foto" : "+ Subir foto", false, ([p]) => { set(p); rerender(); })));
    // Una foto o un video (ej.: Quiénes somos).
    case "media":
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), hint,
        h("div", { className: "photos" },
          v ? h("div", { className: "photo single" }, preview(v), isVideo(v) ? h("span", { className: "kind", textContent: "▶ Video" }) : null) : null,
          picker(v ? "Cambiar foto o video" : "+ Subir foto o video", false, ([p]) => { set(p); rerender(); }, true)));
    case "gallery": {
      const move = (i, d) => { v.splice(i + d, 0, v.splice(i, 1)[0]); touch(); rerender(); };
      return h("div", { className: "list" }, h("span", { className: "list-title", textContent: f.label }), hint,
        h("div", { className: "photos" },
          v.map((p, i) => h("div", { className: "photo" }, preview(p, `Foto ${i + 1}`), isVideo(p) ? h("span", { className: "kind", textContent: "▶ Video" }) : null,
            h("div", { className: "tools" },
              h("button", { type: "button", className: "icon", textContent: "←", title: "Mover antes", disabled: i === 0, onclick: () => move(i, -1) }),
              h("button", { type: "button", className: "icon del", textContent: "✕", title: "Quitar", onclick: () => { if (confirm(isVideo(p) ? "¿Quitar este video?" : "¿Quitar esta foto?")) { v.splice(i, 1); touch(); rerender(); } } }),
              h("button", { type: "button", className: "icon", textContent: "→", title: "Mover después", disabled: i === v.length - 1, onclick: () => move(i, 1) })))),
          picker(f.video ? "+ Agregar fotos o videos" : "+ Agregar fotos", true, ps => { v.push(...ps); touch(); rerender(); }, f.video)));
    }
    case "list": {
      const box = h("div", { className: "list" });
      const draw = () => box.replaceChildren(
        h("span", { className: "list-title", textContent: f.label }), hint,
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
  if (t.custom) return t.custom();
  const draw = () => $("#editor").replaceChildren(h("h2", { textContent: t.title }), ...t.fields.map(f => field(f, content[t.key], draw)));
  draw();
}

// ---------- Pedidos ----------
const PAID = ["pagado", "enviado", "entregado"];
const STATUS = { pendiente: "Pago sin terminar", rechazado: "Pago rechazado", anulado: "Pago anulado", pagado: "Pagado · por enviar", enviado: "Enviado", entregado: "Entregado" };
const MP_TYPES = { credit_card: "Tarjeta de crédito", debit_card: "Tarjeta de débito", prepaid_card: "Tarjeta prepago", account_money: "Saldo de Mercado Pago", bank_transfer: "Transferencia", ticket: "Efectivo", digital_currency: "Mercado Crédito" };
const payText = p => ["Mercado Pago", `${MP_TYPES[p.paymentType] || p.paymentType}${p.installments > 1 ? ` · ${p.installments} cuotas` : ""}${p.cardNumber ? ` · tarjeta **** ${p.cardNumber}` : ""} · operación ${p.operation}`];
const clp = n => "$" + Math.round(n).toLocaleString("es-CL");
const when = t => new Date(t).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" });
// Número de WhatsApp a partir de lo que escribió el cliente (9 1234 5678 → 56912345678), igual que en los correos.
const waNumber = phone => { const d = String(phone).replace(/\D/g, ""); return d.length === 9 && d[0] === "9" ? "56" + d : d; };
let showAll = false;

async function renderOrders() {
  const ed = $("#editor");
  const list = h("div", { className: "list" }, h("p", { className: "hint", textContent: "Cargando pedidos…" }));
  const filter = h("label", { className: "check" }, h("input", { type: "checkbox", checked: showAll, onchange: e => { showAll = e.target.checked; renderOrders(); } }), "Mostrar también los pagos rechazados, anulados o sin terminar");
  ed.replaceChildren(h("div", { className: "orders-head" }, h("h2", { textContent: "Pedidos" }), h("button", { type: "button", className: "ghost", textContent: "Actualizar", onclick: renderOrders })), filter, list);
  let all;
  try { ({ orders: all } = await api("orders")); }
  catch (e) { return list.replaceChildren(h("p", { className: "error", textContent: e.message })); }
  if (tab !== "pedidos") return;
  const paid = all.filter(o => PAID.includes(o.status));
  const shown = showAll ? all : paid;
  const toSend = paid.filter(o => o.status === "pagado").length;
  list.replaceChildren(
    h("p", { className: "summary" }, `${paid.length} ${paid.length === 1 ? "venta" : "ventas"} · ${clp(paid.reduce((s, o) => s + o.total, 0))} en total`, toSend ? h("strong", { textContent: ` · ${toSend} por enviar` }) : null),
    ...(shown.length ? shown.map(orderCard) : [h("p", { className: "hint", textContent: "Todavía no hay pedidos." })]));
}

function orderCard(o) {
  const c = o.customer, p = o.payment || {};
  const dl = (...pairs) => h("dl", { className: "facts" }, ...pairs.filter(([, v]) => v).flatMap(([k, v]) => [h("dt", { textContent: k }), h("dd", {}, v)]));
  const link = (href, text) => h("a", { href, textContent: text, target: "_blank", rel: "noopener" });
  const card = h("details", { className: `item order st-${o.status}`, open: o.status === "pagado" },
    h("summary", { className: "item-head" },
      h("strong", { textContent: `${c.name} · ${clp(o.total)}` }),
      h("span", { className: `badge st-${o.status}`, textContent: STATUS[o.status] || o.status })),
    h("p", { className: "hint", textContent: `Pedido ${o.id} · ${when(o.paidAt || o.createdAt)}` }),
    dl(["Correo", link(`mailto:${c.email}`, c.email)],
       ["Teléfono", link(`https://wa.me/${waNumber(c.phone)}`, c.phone)],
       ["Dirección", `${c.address}, ${c.comuna}, ${c.region}`],
       ["Notas", c.notes]),
    h("ul", { className: "lines" },
      ...o.lines.map(l => h("li", {}, h("span", { textContent: `${l.qty} × ${l.name}` }), h("span", { textContent: clp(l.price * l.qty) }))),
      h("li", {}, h("span", { textContent: o.shipping?.code === "region" ? o.shipping.name : "Envío" }),
        h("span", { textContent: o.shipping?.code === "region" ? (o.shipping.price ? clp(o.shipping.price) : "Gratis") : "Por coordinar con el cliente" })),
      h("li", { className: "sum" }, h("span", { textContent: "Total" }), h("span", { textContent: clp(o.total) }))),
    p.operation ? dl(payText(p)) : null);

  if (PAID.includes(o.status)) {
    const status = h("select", {}, ...PAID.map(s => h("option", { value: s, textContent: STATUS[s], selected: s === o.status })));
    const carrier = h("input", { value: o.carrier || "", placeholder: "Ej.: Starken" });
    carrier.setAttribute("list", "carriers");
    const tracking = h("input", { value: o.tracking || "", placeholder: "Nº de seguimiento (opcional)" });
    // La primera vez que el pedido queda "Enviado", el cliente recibe un correo con estos datos.
    const notice = h("p", { className: "hint", textContent: o.shippedMailAt
      ? `Correo de envío mandado al cliente: ${when(o.shippedMailAt)}`
      : "Al guardarlo como «Enviado», le llega un correo al cliente avisando que su pedido va en camino, con la empresa y el número de seguimiento." });
    const save = h("button", { type: "button", className: "btn", textContent: "Guardar estado", onclick: async () => {
      const willMail = status.value === "enviado" && !o.shippedMailAt;
      if (willMail && !confirm(`Se le enviará un correo a ${c.email} avisando que su pedido va en camino${tracking.value.trim() ? "" : " (sin número de seguimiento)"}. ¿Continuar?`)) return;
      save.disabled = true; save.textContent = "Guardando…";
      try {
        const r = await api("orderStatus", { id: o.id, status: status.value, carrier: carrier.value, tracking: tracking.value });
        if (willMail && !r.mailed) alert("El estado se guardó, pero no se pudo enviar el correo al cliente. Avísale por WhatsApp.");
        renderOrders();
      }
      catch (e) { alert(e.message); save.disabled = false; save.textContent = "Guardar estado"; }
    } });
    card.append(h("div", { className: "row status-row" }, h("label", {}, "Estado", status), h("label", {}, "Empresa de envío", carrier), h("label", {}, "Seguimiento", tracking)), notice, save);
  }
  return card;
}

// ---------- Anotaciones ----------
// Notas privadas del panel. Se guardan solas en la base de datos (no en content.js, que es público).
let notes = null, notesTimer = null, notesPending = false;
async function renderNotes() {
  const ed = $("#editor");
  const state = h("span", { className: "hint" });
  const list = h("div", { className: "list" }, h("p", { className: "hint", textContent: "Cargando anotaciones…" }));
  const text = h("textarea", { rows: 3, placeholder: "Escribe aquí una anotación: pendientes, encargos, ideas…" });
  const add = h("button", { type: "button", className: "btn", textContent: "Agregar anotación", onclick: () => {
    if (!text.value.trim() || !notes) return;
    notes.unshift({ id: Date.now().toString(36), text: text.value.trim(), at: Date.now() });
    text.value = ""; draw(); persist(0);
  } });
  ed.replaceChildren(
    h("div", { className: "orders-head" }, h("h2", { textContent: "Anotaciones" }), state),
    h("p", { className: "hint", textContent: "Solo se ven aquí en el panel, nunca en el sitio. Se guardan solas mientras escribes." }),
    h("div", { className: "item" }, text, add), list);

  async function persist(delay = 800) {
    clearTimeout(notesTimer); notesPending = true;
    state.textContent = "Guardando…"; state.className = "hint";
    notesTimer = setTimeout(async () => {
      try { await api("saveNotes", { notes }); notesPending = false; state.textContent = "Guardado"; state.className = "hint ok"; }
      catch (e) { state.textContent = `No se pudo guardar: ${e.message}`; state.className = "hint error"; }
    }, delay);
  }
  function draw() {
    list.replaceChildren(...(notes.length ? notes.map(n => h("div", { className: "item note" },
      h("div", { className: "item-head" }, h("span", { className: "hint", textContent: when(n.at) }),
        h("button", { type: "button", className: "icon del", textContent: "✕", title: "Borrar anotación",
          onclick: () => { if (confirm("¿Borrar esta anotación?")) { notes = notes.filter(x => x !== n); draw(); persist(0); } } })),
      h("textarea", { value: n.text, rows: Math.min(12, Math.max(2, n.text.split("\n").length + 1)), oninput: e => { n.text = e.target.value; persist(); } })))
      : [h("p", { className: "hint", textContent: "Todavía no hay anotaciones." })]));
  }

  if (!notes) {
    try { ({ notes } = await api("notes")); }
    catch (e) { return list.replaceChildren(h("p", { className: "error", textContent: e.message })); }
  }
  if (tab === "notas") draw();
}

// ---------- Entrar, guardar, salir ----------
async function open(pw) {
  password = pw;
  const data = await api("load");
  content = data.content; baseSha = data.sha; sold = data.sold; rememberStock();
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
    const r = await api("save", { content, baseSha, images });
    baseSha = r.sha; sold = r.sold; rememberStock();
    dirty = false;
    setStatus(r.stockError || "Guardado. El sitio se actualiza en 1 o 2 minutos.", r.stockError ? "bad" : "ok");
    if (tab === "productos") render();
  } catch (e) { setStatus(e.message, "bad"); btn.disabled = false; }
};

$("#logout").onclick = () => {
  if (dirty && !confirm("Tienes cambios sin guardar. ¿Salir igual?")) return;
  dirty = false; sessionStorage.removeItem("adminPw"); location.reload();
};

addEventListener("beforeunload", e => { if (dirty || notesPending) e.preventDefault(); });

// Si ya entraste en esta pestaña, no vuelve a pedir la contraseña.
const saved = sessionStorage.getItem("adminPw");
if (saved) open(saved).catch(() => sessionStorage.removeItem("adminPw"));
