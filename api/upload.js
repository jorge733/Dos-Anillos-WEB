// Videos del panel /admin: el navegador los sube directo a Vercel Blob, porque pesan demasiado para pasar por
// una función (Vercel corta a los 4,5 MB). Esta función solo revisa la contraseña y entrega el permiso de subida.
//
// Variable de entorno: BLOB_READ_WRITE_TOKEN (Vercel la crea sola al conectar un Blob store desde Storage).
const { handleUpload } = require("@vercel/blob/client");
const { fail, handle, passwordOk } = require("./_lib");

const TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

module.exports = handle(async (req, res) => {
  if (req.method !== "POST") throw fail(405, "Método no permitido.");
  if (!passwordOk(decodeURIComponent(req.headers["x-admin-password"] || ""))) {
    await new Promise(r => setTimeout(r, 1000)); // frena los intentos de adivinar la contraseña
    throw fail(401, "Contraseña incorrecta.");
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw fail(500, "Para subir videos falta conectar Vercel Blob (Storage → Blob) en Vercel.");
  // El panel pregunta primero si se puede subir, así muestra el motivo exacto si algo falta.
  if (req.body?.type === "check") return res.json({ ok: true });
  res.json(await handleUpload({
    request: req,
    body: req.body,
    onBeforeGenerateToken: async pathname => {
      if (!/^videos\/[a-z0-9-]+\.(mp4|webm|mov|m4v)$/.test(pathname)) throw fail(400, "Formato de video no permitido. Usa MP4, MOV o WebM.");
      return { allowedContentTypes: TYPES, maximumSizeInBytes: 200 * 1024 * 1024, addRandomSuffix: true };
    },
  }));
});
