// GET /api/order?id=…&k=… → comprobante del pedido para la página de resultado.
// La clave "k" solo la conoce quien hizo la compra, así nadie puede mirar pedidos ajenos cambiando el número.
const { fail, handle, orders, keyOk } = require("./_lib");

module.exports = handle(async (req, res) => {
  const { id = "", k = "" } = req.query;
  const o = typeof id === "string" && /^DA[0-9A-Z]{4,24}$/.test(id) && (await orders.get(id));
  if (!o || !keyOk(k, o)) throw fail(404, "No encontramos ese pedido.");
  res.json({
    id: o.id, status: o.status, createdAt: o.createdAt, lines: o.lines, shipping: o.shipping, total: o.total,
    customer: { name: o.customer.name, email: o.customer.email },
    payment: o.payment && { status: o.payment.status, operation: o.payment.operation, cardNumber: o.payment.cardNumber, paymentType: o.payment.paymentType, installments: o.payment.installments, transactionDate: o.payment.transactionDate },
  });
});
