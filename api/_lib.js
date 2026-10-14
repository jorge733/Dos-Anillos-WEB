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

// Convierte el carrito del navegador ([{ id, qty }]) en líneas con el precio y las medidas reales.
function priceCart(items, c = content()) {
  if (!Array.isArray(items) || !items.length || items.length > 20) throw fail(400, "El carrito está vacío.");
  const lines = items.map(({ id, qty }) => {
    const p = c.productos.products.find(p => p.id === id);
    const n = Math.floor(Number(qty));
    if (!p) throw fail(400, "Un producto del carrito ya no está disponible. Revisa el carrito.");
    if (!(n >= 1 && n <= 20)) throw fail(400, "Cantidad inválida.");
    return { id, name: p.name, price: Number(p.price), qty: n };
  });
  return { lines, subtotal: lines.reduce((s, l) => s + l.price * l.qty, 0) };
}

// ---------- Base de datos (Upstash Redis por REST) ----------
async function redis(...cmd) {
  const url = env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL");
  const token = env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) throw fail(500, "Falta conectar la base de datos (Upstash) en Vercel.");
  const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
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

// Número de pedido corto y sin símbolos raros (va a Mercado Pago como referencia).
const newOrderId = () => "DA" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString("hex").toUpperCase();
const newKey = () => crypto.randomBytes(16).toString("hex");

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
  if (ok && await orders.claimPaid(order.id)) await notifyPaid(order).catch(e => console.error("Correos", e));
  return order;
}

// ---------- Correos (Resend) ----------
async function mail(to, subject, html, replyTo) {
  if (!env("RESEND_API_KEY") || !env("MAIL_FROM")) { console.warn("Correo no enviado: falta RESEND_API_KEY o MAIL_FROM."); return; }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env("RESEND_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env("MAIL_FROM"), to, subject, html, reply_to: replyTo || undefined }),
  });
  if (!r.ok) console.error("Resend", r.status, await r.text());
}

const clp = n => "$" + Math.round(n).toLocaleString("es-CL");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function orderHtml(o, intro) {
  const row = (a, b, bold) => `<tr><td style="padding:6px 0;color:#7a7366">${a}</td><td style="padding:6px 0;text-align:right;${bold ? "font-weight:600;color:#2b2a27" : ""}">${b}</td></tr>`;
  const c = o.customer;
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#3d3a34">
    <h2 style="font-family:Georgia,serif;font-weight:normal;color:#2b2a27">Dos Anillos</h2>
    <p>${intro}</p>
    <p><strong>Pedido ${esc(o.id)}</strong> · ${new Date(o.paidAt || o.createdAt).toLocaleString("es-CL", { timeZone: "America/Santiago" })}</p>
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #d9d0bf;border-bottom:1px solid #d9d0bf">
      ${o.lines.map(l => row(`${l.qty} × ${esc(l.name)}`, clp(l.price * l.qty))).join("")}
      ${row("Envío", "Por coordinar")}
      ${row("Total pagado", clp(o.total), true)}
    </table>
    <p style="margin-top:18px"><strong>Envío a:</strong><br>${esc(c.name)}<br>${esc(c.address)}<br>${esc(c.comuna)}, ${esc(c.region)}<br>${esc(c.phone)} · ${esc(c.email)}${c.notes ? `<br><em>${esc(c.notes)}</em>` : ""}</p>
    ${o.payment ? `<p style="color:#7a7366;font-size:13px">Mercado Pago · operación ${esc(o.payment.operation)}${o.payment.cardNumber ? ` · tarjeta terminada en ${esc(o.payment.cardNumber)}` : ""}</p>` : ""}
  </div>`;
}

// Avisa al cliente y a los dueños cuando un pedido queda pagado.
async function notifyPaid(o) {
  const c = content();
  const owners = String(c.general.orderEmails || c.general.email).split(/[,;\s]+/).filter(Boolean);
  await Promise.all([
    mail([o.customer.email], `Recibimos tu pago · pedido ${o.id}`, orderHtml(o, `Hola ${esc(o.customer.name)}, ¡gracias por tu compra! Te escribiremos para acordar el costo del envío, que se paga aparte.`), c.general.email),
    owners.length && mail(owners, `Nueva venta: ${clp(o.total)} · ${o.customer.name}`, orderHtml(o, `Llegó un pedido pagado por Mercado Pago. Los datos también están en dosanillos.cl/admin. Si respondes este correo, le escribes al cliente. <strong>Escríbele al cliente para acordar el costo del envío.</strong>`), o.customer.email),
  ]);
}

module.exports = { fail, handle, content, priceCart, orders, newOrderId, newKey, mercadopago, applyMercadoPago, notifyPaid, MP_TEST };
