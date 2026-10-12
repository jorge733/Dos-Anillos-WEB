// Dirección de retorno de Webpay: confirma el pago y lleva al cliente a ver el resultado de su pedido.
// Transbank vuelve con distintos datos según lo que pasó (en GET o POST):
//   token_ws                      pago terminado (aprobado o rechazado) → hay que confirmarlo
//   TBK_TOKEN                     el cliente anuló el pago en el formulario
//   token_ws + TBK_TOKEN          error en el formulario de pago
//   solo TBK_ORDEN_COMPRA         se acabó el tiempo para pagar
const { orders, webpay, notifyPaid } = require("./_lib");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const p = { ...req.query, ...(typeof req.body === "object" ? req.body : {}) };
  const token = p.token_ws, aborted = p.TBK_TOKEN;
  let order = null;
  try {
    order = (await orders.byToken(token || aborted)) || (p.TBK_ORDEN_COMPRA && (await orders.get(p.TBK_ORDEN_COMPRA)));
    if (order && order.status === "pendiente") {
      if (token && !aborted) {
        const r = await webpay("PUT", `/${token}`);
        const ok = r.response_code === 0 && r.status === "AUTHORIZED" && r.buy_order === order.id && Number(r.amount) === order.total;
        order.payment = {
          status: r.status, responseCode: r.response_code, authorizationCode: r.authorization_code, cardNumber: r.card_detail?.card_number,
          paymentType: r.payment_type_code, installments: r.installments_number || 0, transactionDate: r.transaction_date, amount: r.amount,
        };
        order.status = ok ? "pagado" : "rechazado";
        if (ok) order.paidAt = Date.now();
      } else order.status = "anulado";
      await orders.save(order);
      if (order.status === "pagado") await notifyPaid(order).catch(e => console.error("Correos", e));
    }
  } catch (e) { console.error("Retorno de Webpay", e); }
  res.statusCode = 303;
  res.setHeader("Location", order ? `/?pedido=${order.id}&k=${order.key}#pedido` : "/?pedido=error#pedido");
  res.end();
};
