// GET /api/stock → { stock: { id: unidades } }: lo que queda de cada producto que controla stock
// (lo que fijó el dueño menos lo vendido desde entonces). Los productos sin control de stock no aparecen.
const { handle, content, stock } = require("./_lib");

module.exports = handle(async (req, res) => {
  const all = await stock.available(content());
  // 10 segundos de caché solo en Vercel (el navegador no guarda nada), para no consultar la base de datos
  // en cada visita. Al pagar se vuelve a revisar contra la base de datos.
  res.setHeader("Vercel-CDN-Cache-Control", "max-age=10");
  res.json({ stock: Object.fromEntries(Object.entries(all).filter(([, n]) => n != null)) });
});
