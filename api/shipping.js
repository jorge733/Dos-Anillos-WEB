// GET  /api/shipping                      → comunas con cobertura de Chilexpress, para el formulario de compra
// POST /api/shipping { county, items }    → opciones y precios de envío para ese carrito
const { handle, priceCart, communes, quote, TBK_PROD } = require("./_lib");

module.exports = handle(async (req, res) => {
  if (req.method === "GET") return res.json({ communes: await communes(), testMode: !TBK_PROD });
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  const { county, items } = req.body || {};
  res.json({ options: await quote(county, priceCart(items)) });
});
