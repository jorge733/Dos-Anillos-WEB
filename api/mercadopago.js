// Dirección de Mercado Pago, con dos usos:
//   GET  vuelta del cliente desde Checkout Pro: ?payment_id=…&status=…&external_reference=<pedido>
//        Se confirma el pago y se lleva al cliente a ver el resultado de su pedido.
//   POST aviso (webhook) de Mercado Pago cuando un pago cambia: { type: "payment", data: { id } }
//        Sirve cuando el cliente cierra la ventana antes de volver o cuando un pago queda aprobado más tarde.
// En los dos casos el pago se consulta directo a Mercado Pago antes de cambiar el pedido.
const { orders, keyOk, applyMercadoPago } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const q = req.query, b = typeof req.body === "object" && req.body || {};

  if (req.method === "POST") {
    const type = b.type || q.type || q.topic;
    const id = b.data?.id || q["data.id"] || q.id;
    if (type === "payment" && id) {
      try { await applyMercadoPago(id); }
      catch (e) { console.error("Aviso de Mercado Pago", e); return res.status(500).end(); } // Mercado Pago lo reintenta
    }
    return res.status(200).end();
  }

  let order = null;
  try {
    const pay = q.payment_id || q.collection_id;
    const paid = pay && pay !== "null";
    // Si Mercado Pago no responde, igual se muestra el pedido (el aviso de Mercado Pago lo actualizará después).
    if (paid) order = await applyMercadoPago(pay).catch(e => (console.error("Retorno de Mercado Pago", e), null));
    if (!order && q.external_reference) order = await orders.get(String(q.external_reference));
    // Solo quien trae la clave del pedido (va en la dirección de vuelta) puede verlo o anularlo.
    if (order && !keyOk(q.k, order)) order = null;
    // Volvió sin pagar (apretó "volver a la tienda").
    if (order && !paid && order.status === "pendiente" && !order.payment) { order.status = "anulado"; await orders.save(order); }
  } catch (e) { console.error("Retorno de Mercado Pago", e); }
  res.statusCode = 303;
  res.setHeader("Location", order ? `/?pedido=${order.id}&k=${order.key}#pedido` : "/?pedido=error#pedido");
  res.end();
};
