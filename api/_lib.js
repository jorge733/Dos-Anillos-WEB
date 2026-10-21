// Piezas compartidas por las funciones de la tienda: contenido, base de datos, Mercado Pago y correos.
// Los archivos de api/ que empiezan con "_" no son direcciones públicas: solo se importan desde las otras funciones.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   KV_REST_API_URL / KV_REST_API_TOKEN      base de datos Upstash Redis (Vercel las crea al conectar Upstash desde Storage)
//   MERCADOPAGO_ACCESS_TOKEN                 Access Token de Mercado Pago (de producción para cobrar de verdad)
//   RESEND_API_KEY                           llave de Resend para enviar correos
//   MAIL_FROM                                remitente verificado en Resend, ej.: Dos Anillos <pedidos@dosanillos.cl>
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const fail = (status, msg) => Object.assign(new Error(msg), { status });
const env = k => process.env[k] || "";
const hash = s => crypto.createHash("sha256").update(String(s)).digest();
// Contraseña del panel /admin (variable ADMIN_PASSWORD).
const passwordOk = p => !!env("ADMIN_PASSWORD") && crypto.timingSafeEqual(hash(p), hash(env("ADMIN_PASSWORD")));

// Envuelve una función para que los errores lleguen al navegador como { error } con su código.
const handle = fn => async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try { await fn(req, res); }
  catch (e) {
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ error: e.status ? e.message : "Ocurrió un error inesperado. Intenta de nuevo en unos minutos." });
  }
};

// ---------- Contenido (precios) ----------
// Se lee el content.js publicado junto con la función, así los precios nunca vienen del navegador.
function content() {
  const text = fs.readFileSync(path.join(process.cwd(), "content.js"), "utf8");
  return JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
}

// Unidades disponibles de un producto (/admin → Catálogo → Unidades disponibles). Vacío = no se controla.
const stockOf = p => p.stock == null || p.stock === "" ? Infinity : Math.max(0, Math.floor(Number(p.stock)) || 0);
// Las galerías pueden traer videos; donde hace falta una foto (correos) se usa la primera foto.
const isVideo = src => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(String(src));
const coverOf = p => (p?.imgs || []).find(s => !isVideo(s));

// Convierte el carrito del navegador ([{ id, qty }]) en líneas con el precio y las medidas reales.
// «avail» es el stock real (stock.available); sin él se usa el número de content.js.
function priceCart(items, c = content(), avail = {}) {
  if (!Array.isArray(items) || !items.length || items.length > 20) throw fail(400, "El carrito está vacío.");
  // Un mismo producto repetido en varias líneas se junta en una, así no se salta el límite de stock.
  const qtys = new Map();
  for (const it of items) {
    const n = Math.floor(Number(it?.qty));
    if (!(n >= 1 && n <= 20)) throw fail(400, "Cantidad inválida.");
    qtys.set(it.id, (qtys.get(it.id) || 0) + n);
  }
  const lines = [...qtys].map(([id, n]) => {
    const p = c.productos.products.find(p => p.id === id);
    if (!p) throw fail(400, "Un producto del carrito ya no está disponible. Revisa el carrito.");
    if (n > 20) throw fail(400, "Puedes llevar hasta 20 unidades de cada producto por pedido.");
    if (!(Number(p.price) > 0)) throw fail(400, `«${p.name}» no se puede comprar en línea todavía. Escríbenos por WhatsApp.`);
    const left = p.id in avail ? avail[p.id] ?? Infinity : stockOf(p);
    if (!left) throw fail(400, `«${p.name}» se agotó. Quítalo del carrito para seguir.`);
    if (n > left) throw fail(400, `Solo ${left === 1 ? "queda 1 unidad" : `quedan ${left} unidades`} de «${p.name}». Ajusta la cantidad en el carrito.`);
    return { id, name: p.name, price: Number(p.price), qty: n };
  });
  return { lines, subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0) };
}

// Costo del envío según la región (tabla de /admin → Envíos). Es el mismo cálculo que muestra el carrito (app.js).
// Queda «por coordinar» si algún producto tiene envío especial o si la región todavía no tiene precio.
function quoteShipping(lines, region, c = content()) {
  const env = c.envios || {};
  const rate = (env.regions || []).find(r => r.name === region)?.price;
  const special = lines.some(l => c.productos.products.find(p => p.id === l.id)?.shipping === "coordinar");
  if (special || rate == null || rate === "") return { code: "coordinar", name: "Por coordinar con el vendedor", price: 0 };
  const units = lines.reduce((s, l) => s + l.qty, 0);
  return { code: "region", name: `Envío a ${region}`, price: Math.max(0, Math.round((Number(rate) || 0) + (Number(env.extra) || 0) * (units - 1))) };
}

// ---------- Base de datos (Upstash Redis por REST) ----------
async function redis(...cmd) {
  const url = env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL");
  const token = env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) throw fail(500, "Falta conectar la base de datos (Upstash) en Vercel.");
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd), signal: AbortSignal.timeout(10000) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(`Redis: ${data.error || r.status}`);
  return data.result;
}

const orders = {
  async get(id) { const s = await redis("GET", `order:${id}`); return s && JSON.parse(s); },
  async save(o) { await redis("SET", `order:${o.id}`, JSON.stringify(o)); await redis("ZADD", "orders", o.createdAt, o.id); return o; },
  async list(limit = 300) {
    const ids = await redis("ZREVRANGE", "orders", 0, limit - 1);
    if (!ids.length) return [];
    return (await redis("MGET", ...ids.map(id => `order:${id}`))).filter(Boolean).map(s => JSON.parse(s));
  },
  // La vuelta del cliente y el aviso de Mercado Pago pueden llegar al mismo tiempo: solo el primero manda los correos.
  claimPaid: async id => (await redis("SET", `paid:${id}`, "1", "NX", "EX", 90 * 24 * 3600)) === "OK",
};

// Stock que baja solo: content.js guarda lo que fijó el dueño y aquí se cuentan las ventas pagadas.
// Hash "stock": número que fijó el dueño desde el panel (JSON: número o null). Se escribe al guardar, así sirve
//   aunque Vercel todavía no publique el content.js nuevo. Si un producto no está, vale el de content.js.
// Hash "sold": unidades pagadas desde esa vez. Vuelve a 0 cada vez que el dueño cambia el número.
// HGETALL responde [campo, valor, campo, valor…].
const fields = (flat, f) => { const o = {}; for (let i = 0; i < (flat || []).length; i += 2) o[flat[i]] = f(flat[i + 1]); return o; };
const stock = {
  async get() {
    const [base, sold] = await Promise.all([redis("HGETALL", "stock"), redis("HGETALL", "sold")]);
    return { base: fields(base, JSON.parse), sold: fields(sold, v => Number(v) || 0) };
  },
  // Disponible por producto: { id: número } o null si no se controla.
  async available(c = content(), s) {
    const { base, sold } = s || await stock.get();
    return Object.fromEntries(c.productos.products.map(p => {
      const n = stockOf(p.id in base ? { stock: base[p.id] } : p);
      return [p.id, n === Infinity ? null : Math.max(0, n - (sold[p.id] || 0))];
    }));
  },
  // Se llama una sola vez por pedido, cuando queda pagado.
  async sell(lines) { for (const l of lines) await redis("HINCRBY", "sold", l.id, l.qty); },
  // El dueño fijó un número nuevo: { id: número | null }.
  async reset(changes) {
    const ids = Object.keys(changes);
    if (!ids.length) return;
    await redis("HSET", "stock", ...ids.flatMap(id => [id, JSON.stringify(changes[id])]));
    await redis("HSET", "sold", ...ids.flatMap(id => [id, 0]));
  },
};

// Anotaciones privadas del panel (no van en content.js, que cualquiera puede ver).
const notes = {
  async get() { const s = await redis("GET", "notes"); return s ? JSON.parse(s) : []; },
  async save(list) { await redis("SET", "notes", JSON.stringify(list)); return list; },
};

// Número de pedido corto y sin símbolos raros (va a Mercado Pago como referencia).
const newOrderId = () => "DA" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
const newKey = () => crypto.randomBytes(16).toString("hex");
// La clave «k» del pedido solo la conoce quien hizo la compra (va en la vuelta de Mercado Pago y en el comprobante).
const keyOk = (k, o) => {
  const a = Buffer.from(String(k ?? "")), b = Buffer.from(String(o?.key ?? ""));
  return b.length > 0 && a.length === b.length && crypto.timingSafeEqual(a, b);
};

// ---------- Mercado Pago (Checkout Pro) ----------
// Las credenciales de prueba de Mercado Pago empiezan con "TEST-"; con ellas no se cobra de verdad.
const MP_TOKEN = env("MERCADOPAGO_ACCESS_TOKEN");
const MP_TEST = MP_TOKEN.startsWith("TEST-");
const PAID = ["pagado", "enviado", "entregado"];

async function mercadopago(method, pathname, body) {
  if (!MP_TOKEN) throw fail(500, "Falta configurar MERCADOPAGO_ACCESS_TOKEN en Vercel.");
  const r = await fetch("https://api.mercadopago.com" + pathname, {
    method,
    headers: { Authorization: `Bearer ${MP_TOKEN}`, "Content-Type": "application/json" },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(502, `Mercado Pago respondió ${r.status}${data.message ? `: ${data.message}` : ""}.`);
  return data;
}

// Aplica a su pedido lo que dice Mercado Pago de un pago. Se usa al volver el cliente y en cada aviso (webhook).
// Siempre se consulta el pago a Mercado Pago, así un aviso falso no puede marcar nada como pagado.
// Un pedido pagado nunca retrocede; uno rechazado o anulado sí puede quedar pagado, porque en Mercado Pago
// el cliente puede reintentar con otro medio de pago.
async function applyMercadoPago(paymentId) {
  const r = await mercadopago("GET", `/v1/payments/${encodeURIComponent(paymentId)}`);
  const order = r.external_reference && await orders.get(r.external_reference);
  if (!order || PAID.includes(order.status)) return order;
  const ok = r.status === "approved" && r.currency_id === "CLP" && Number(r.transaction_amount) === order.total;
  const next = ok ? "pagado" : { rejected: "rechazado", cancelled: "anulado" }[r.status];
  order.payment = {
    status: r.status, statusDetail: r.status_detail, operation: String(r.id),
    method: r.payment_method_id, paymentType: r.payment_type_id, installments: r.installments || 0,
    cardNumber: r.card?.last_four_digits, transactionDate: r.date_approved || r.date_created, amount: r.transaction_amount,
  };
  if (ok || (next && order.status === "pendiente")) order.status = next;
  if (ok) order.paidAt = Date.now();
  await orders.save(order);
  if (ok && await orders.claimPaid(order.id)) {
    await stock.sell(order.lines).catch(e => console.error("Stock", e));
    await notifyPaid(order).catch(e => console.error("Correos", e));
  }
  return order;
}

// ---------- Correos (Resend) ----------
// Devuelve true si Resend aceptó el correo.
async function mail(to, subject, html, replyTo) {
  if (!env("RESEND_API_KEY") || !env("MAIL_FROM")) { console.warn("Correo no enviado: falta RESEND_API_KEY o MAIL_FROM."); return false; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("MAIL_FROM"), to, subject, html, reply_to: replyTo || undefined }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) console.error("Resend", r.status, await r.text());
  return r.ok;
}

const clp = n => "$" + Math.round(n).toLocaleString("es-CL");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// ---------- Diseño de los correos ----------
// Correos con tablas y estilos en línea: es lo único que Gmail, Outlook y Apple Mail muestran igual.
// Colores y letras del sitio (styles.css). Las imágenes se cargan desde el sitio publicado.
const SITE = "https://dosanillos.cl";
const K = { cream: "#f4efe6", bone: "#ebe4d7", paper: "#faf7f1", charcoal: "#2b2a27", ink: "#3d3a34", muted: "#7a7366", sage: "#5c6a4c", wood: "#8a5a3b", line: "#d9d0bf" };
const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif", SANS = "Helvetica,Arial,sans-serif";
const absUrl = src => /^https?:/.test(src) ? src : `${SITE}/${String(src).replace(/^\//, "")}`;
// Número de WhatsApp a partir de lo que escribió el cliente (9 1234 5678 → 56912345678).
const waNumber = phone => { const d = String(phone).replace(/\D/g, ""); return d.length === 9 && d[0] === "9" ? "56" + d : d; };
const waUrl = (phone, text) => `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;

const btn = (href, text, dark = true) => `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 10px 0;padding:13px 24px;background:${dark ? K.charcoal : "transparent"};border:1px solid ${K.charcoal};color:${dark ? K.paper : K.charcoal};font-family:${SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none">${text}</a>`;
const label = text => `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${K.muted}">${text}</p>`;

// Envío ya cobrado en la tienda, o que se coordina y paga aparte (pedidos antiguos o con productos de envío especial).
const shipPaid = o => o.shipping?.code === "region";
const shipText = (o, pending = "Por coordinar") => shipPaid(o) ? (o.shipping.price ? clp(o.shipping.price) : "Gratis") : pending;

function orderHtml(o, { preheader, eyebrow, title, intro, callout, actions = "", shipLabel = shipText(o) }) {
  const c = o.customer, products = content().productos.products;
  const when = new Date(o.paidAt || o.createdAt).toLocaleString("es-CL", { timeZone: "America/Santiago", dateStyle: "long", timeStyle: "short" });
  const line = l => {
    const img = coverOf(products.find(p => p.id === l.id));
    return `<tr>
      <td width="64" style="padding:14px 14px 14px 0;border-bottom:1px solid ${K.line};vertical-align:middle">${img ? `<img src="${esc(absUrl(img))}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:cover;background:${K.bone}">` : ""}</td>
      <td style="padding:14px 0;border-bottom:1px solid ${K.line};vertical-align:middle;font-family:${SERIF};font-size:19px;line-height:1.25;color:${K.charcoal}">${esc(l.name)}<br><span style="font-family:${SANS};font-size:13px;color:${K.muted}">Cantidad: ${l.qty}</span></td>
      <td align="right" style="padding:14px 0 14px 12px;border-bottom:1px solid ${K.line};vertical-align:middle;font-family:${SANS};font-size:15px;color:${K.charcoal};white-space:nowrap">${clp(l.price * l.qty)}</td>
    </tr>`;
  };
  const sum = (a, b, big) => `<tr><td style="padding:${big ? "12px 0 0" : "4px 0"};font-family:${big ? SERIF : SANS};font-size:${big ? 22 : 14}px;color:${big ? K.charcoal : K.muted}">${a}</td><td align="right" style="padding:${big ? "12px 0 0" : "4px 0"};font-family:${big ? SERIF : SANS};font-size:${big ? 22 : 14}px;color:${K.charcoal}">${b}</td></tr>`;
  const p = o.payment;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:${K.cream}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${K.cream}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${K.paper}">
  <tr><td align="center" style="background:${K.charcoal};padding:30px 24px">
    <a href="${SITE}"><img src="${SITE}/logo-blanco-h.png" width="170" alt="Dos Anillos" style="display:block;width:170px;height:auto;border:0"></a>
  </td></tr>
  <tr><td style="padding:40px 36px 8px">
    <p style="margin:0 0 12px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${K.sage}">${eyebrow}</p>
    <h1 style="margin:0 0 16px;font-family:${SERIF};font-size:34px;font-weight:500;line-height:1.1;color:${K.charcoal}">${title}</h1>
    <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.65;color:${K.ink}">${intro}</p>
  </td></tr>
  ${callout ? `<tr><td style="padding:24px 36px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:${K.bone};border-left:3px solid ${K.wood};padding:16px 18px;font-family:${SANS};font-size:14px;line-height:1.6;color:${K.ink}">${callout}</td></tr></table>
  </td></tr>` : ""}
  ${actions ? `<tr><td style="padding:24px 36px 0">${actions}</td></tr>` : ""}
  <tr><td style="padding:34px 36px 0">
    ${label(`Pedido ${esc(o.id)} · ${esc(when)}`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${K.line}">${o.lines.map(line).join("")}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
      ${sum("Subtotal", clp(o.subtotal ?? o.total))}${sum("Envío", shipLabel)}${sum("Total pagado", clp(o.total), true)}
    </table>
  </td></tr>
  <tr><td style="padding:34px 36px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="50%" style="vertical-align:top;padding-right:12px">
        ${label("Envío a")}
        <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${K.ink}">${esc(c.name)}<br>${esc(c.address)}<br>${esc(c.comuna)}, ${esc(c.region)}<br>${esc(c.phone)}<br>${esc(c.email)}${c.notes ? `<br><em style="color:${K.muted}">«${esc(c.notes)}»</em>` : ""}</p>
      </td>
      <td width="50%" style="vertical-align:top;padding-left:12px">
        ${p ? `${label("Pago")}
        <p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.6;color:${K.ink}">Mercado Pago<br>Operación ${esc(p.operation)}${p.cardNumber ? `<br>Tarjeta terminada en ${esc(p.cardNumber)}` : ""}${p.installments > 1 ? `<br>${p.installments} cuotas` : ""}</p>` : ""}
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:40px 36px 34px"><div style="border-top:1px solid ${K.line}"></div></td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px"><tr><td align="center" style="padding:22px 24px 8px;font-family:${SANS};font-size:12px;line-height:1.7;color:${K.muted}">
  <span style="font-family:${SERIF};font-size:16px;color:${K.charcoal}">Dos Anillos</span><br>Instrumentos de madera hechos a mano<br>
  <a href="${SITE}" style="color:${K.muted}">dosanillos.cl</a>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

// Avisa al cliente y a los dueños cuando un pedido queda pagado.
async function notifyPaid(o) {
  const c = content();
  const owners = String(c.general.orderEmails || c.general.email).split(/[,;\s]+/).filter(Boolean);
  const first = esc(o.customer.name.split(" ")[0]);
  await Promise.all([
    mail([o.customer.email], `Recibimos tu pago · pedido ${o.id}`, orderHtml(o, {
      preheader: `Pagaste ${clp(o.total)}. ${shipPaid(o) ? "Te avisaremos cuando despachemos tu pedido." : "Te escribiremos para coordinar el envío."}`,
      eyebrow: "Pago aprobado",
      title: `¡Gracias por tu compra, ${first}!`,
      intro: "Recibimos tu pago y ya estamos preparando tu pedido. Cada pieza está hecha a mano en nuestro taller.",
      callout: shipPaid(o)
        ? `<strong>El envío ya está pagado.</strong> Cuando despachemos tu pedido te llegará un correo con la empresa y el número de seguimiento.`
        : `<strong>El envío se coordina aparte.</strong> Te escribiremos por WhatsApp o por correo para acordar el costo del envío, que se paga por separado.`,
      actions: c.general.whatsapp ? btn(waUrl(c.general.whatsapp, `Hola, tengo una consulta sobre mi pedido ${o.id}`), "Escríbenos por WhatsApp") : "",
    }), c.general.email),
    owners.length && mail(owners, `Nueva venta: ${clp(o.total)} · ${o.customer.name}`, orderHtml(o, {
      preheader: `${o.customer.name} pagó ${clp(o.total)} con Mercado Pago.`,
      eyebrow: "Nueva venta",
      title: `${clp(o.total)} · ${esc(o.customer.name)}`,
      intro: "Llegó un pedido pagado con Mercado Pago. Si respondes este correo, le escribes directamente al cliente.",
      callout: shipPaid(o)
        ? `<strong>Envío cobrado en la tienda: ${shipText(o)}.</strong> Despacha el pedido y márcalo como «Enviado» en el panel con la empresa y el número de seguimiento.`
        : `<strong>Falta coordinar el envío.</strong> Escríbele al cliente para acordar el costo y la forma de despacho.`,
      actions: btn(waUrl(o.customer.phone, `Hola ${o.customer.name.split(" ")[0]}, te escribimos de Dos Anillos por tu pedido ${o.id}.${shipPaid(o) ? "" : " Coordinemos el envío:"}`), "WhatsApp al cliente") + btn(`${SITE}/admin`, "Ver en el panel", false),
    }), o.customer.email),
  ]);
}

// Avisa al cliente que su pedido fue despachado, con la empresa y el número de seguimiento si los hay.
// Devuelve true si el correo salió.
async function notifyShipped(o) {
  const c = content();
  const first = esc(o.customer.name.split(" ")[0]);
  const data = [o.carrier && `Empresa: <strong>${esc(o.carrier)}</strong>`, o.tracking && `Número de seguimiento: <strong style="letter-spacing:1px">${esc(o.tracking)}</strong>`].filter(Boolean);
  return mail([o.customer.email], `Tu pedido ${o.id} va en camino`, orderHtml(o, {
    preheader: data.length ? `Despachamos tu pedido${o.carrier ? ` por ${o.carrier}` : ""}${o.tracking ? `. Seguimiento: ${o.tracking}` : ""}.` : "Despachamos tu pedido.",
    eyebrow: "Pedido enviado",
    title: `¡Tu pedido va en camino, ${first}!`,
    intro: "Ya despachamos tu pedido. Esperamos que lo disfrutes tanto como disfrutamos haciéndolo.",
    callout: data.length ? `<strong>Datos del envío</strong><br>${data.join("<br>")}` : "Si tienes dudas sobre la entrega, escríbenos y te ayudamos.",
    actions: c.general.whatsapp ? btn(waUrl(c.general.whatsapp, `Hola, tengo una consulta sobre el envío de mi pedido ${o.id}`), "¿Dudas? Escríbenos") : "",
    shipLabel: shipText(o, "Coordinado aparte"),
  }), c.general.email);
}

module.exports = { fail, handle, passwordOk, notes, stock, stockOf, content, priceCart, quoteShipping, orders, newOrderId, newKey, keyOk, mercadopago, applyMercadoPago, notifyPaid, notifyShipped, MP_TEST };
