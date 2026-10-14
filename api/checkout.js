// GET  /api/checkout                          → { testMode }: si Mercado Pago usa credenciales de prueba
// POST /api/checkout { items, customer }      → crea el pedido y la preferencia de pago en Mercado Pago.
// El navegador recibe { url } y lleva al cliente a pagar ahí. El envío no se cobra: se coordina después con el vendedor.
// Los precios se vuelven a calcular aquí: nunca se usa lo que diga el navegador.
const { fail, handle, content, priceCart, orders, newOrderId, newKey, mercadopago, MP_TEST } = require("./_lib");

const clean = (s, max) => String(s ?? "").trim().slice(0, max);

module.exports = handle(async (req, res) => {
  if (req.method === "GET") return res.json({ testMode: MP_TEST });
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  const { items, customer: raw = {} } = req.body || {};
  const customer = {
    name: clean(raw.name, 100), email: clean(raw.email, 120), phone: clean(raw.phone, 30),
    address: clean(raw.address, 200), comuna: clean(raw.comuna, 60), region: clean(raw.region, 60), notes: clean(raw.notes, 500),
  };
  if (!customer.name || !customer.phone || !customer.address || !customer.comuna || !customer.region) throw fail(400, "Completa nombre, teléfono, región, comuna y dirección.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw fail(400, "Revisa tu correo.");

  const cart = priceCart(items, content());
  const order = {
    id: newOrderId(), key: newKey(), status: "pendiente", method: "mercadopago", createdAt: Date.now(),
    customer, lines: cart.lines, subtotal: cart.subtotal, shipping: { code: "coordinar", name: "Por coordinar con el vendedor", price: 0 }, total: cart.subtotal,
  };
  const proto = req.headers["x-forwarded-proto"] || (/^(localhost|127.0.0.1)(:|$)/.test(req.headers.host) ? "http" : "https");
  const back = `${proto}://${req.headers.host}/api/mercadopago`;
  const pref = await mercadopago("POST", "/checkout/preferences", {
    items: order.lines.map(l => ({ id: l.id, title: l.name, quantity: l.qty, unit_price: l.price, currency_id: "CLP" })),
    payer: { name: customer.name, email: customer.email },
    external_reference: order.id,
    back_urls: { success: back, failure: back, pending: back },
    statement_descriptor: "DOS ANILLOS",
    // Mercado Pago solo acepta estas dos opciones con direcciones https (no en localhost).
    ...(proto === "https" && { auto_return: "approved", notification_url: back }),
  });
  order.preferenceId = pref.id;
  await orders.save(order);
  res.json({ url: (MP_TEST && pref.sandbox_init_point) || pref.init_point });
});
