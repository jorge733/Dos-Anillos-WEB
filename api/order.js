// GET /api/order?id=…&k=… → comprobante del pedido para la página de resultado.
// La clave "k" solo la conoce quien hizo la compra, así nadie puede mirar pedidos ajenos cambiando el número.
const crypto = require("crypto");
const { fail, handle, orders } = require("./_lib");

const same = (a, b) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

module.exports = handle(async (req, res) => {
  const { id = "", k = "" } = req.query;
  const o = /^DA[0-9A-Z]{4,24}$/.test(id) && (await orders.get(id));
  if (!o || !same(String(k), o.key)) throw fail(404, "No encontramos ese pedido.");
  res.json({
    id: o.id, status: o.status, createdAt: o.createdAt, lines: o.lines, shipping: o.shipping, total: o.total,
    customer: { name: o.customer.name, email: o.customer.email },
    payment: o.payment && { authorizationCode: o.payment.authorizationCode, cardNumber: o.payment.cardNumber, paymentType: o.payment.paymentType, installments: o.payment.installments, transactionDate: o.payment.transactionDate },
  });
});
