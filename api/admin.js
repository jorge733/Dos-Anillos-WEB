// Función de Vercel para el panel /admin: lee y guarda content.js (y fotos nuevas) directo en el repositorio de GitHub.
// Cada guardado es un commit en la rama y Vercel vuelve a publicar el sitio solo.
//
// Variables de entorno (Vercel → Settings → Environment Variables):
//   ADMIN_PASSWORD  contraseña del panel
//   GITHUB_TOKEN    token "fine-grained" con permiso Contents: Read and write sobre el repositorio
//   GITHUB_REPO     opcional, por defecto jorge733/Dos-Anillos-WEB
//   GITHUB_BRANCH   opcional, por defecto main
const crypto = require("crypto");
const { orders, notes, notifyShipped, passwordOk } = require("./_lib");

const REPO = process.env.GITHUB_REPO || "jorge733/Dos-Anillos-WEB";
const BRANCH = process.env.GITHUB_BRANCH || "main";
const FILE = "content.js";
const HEADER = "// Contenido del sitio. Se edita desde /admin (o a mano: lo que sigue al signo igual debe ser JSON válido).\nwindow.CONTENT = ";
const IMG_PATH = /^img\/[a-z0-9-]+\.webp$/;

const fail = (status, msg) => Object.assign(new Error(msg), { status });
// sha que git le asigna a un archivo, para saber cuál quedó guardado sin volver a consultarlo.
const blobSha = text => { const b = Buffer.from(text, "utf8"); return crypto.createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex"); };

async function gh(path, init = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    body: init.body && JSON.stringify(init.body),
  });
  if (!r.ok) throw fail(502, `GitHub ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// Se usa la API de objetos de git (no /contents) porque responde al instante después de un commit.
async function head() {
  const ref = await gh(`/git/ref/heads/${BRANCH}`);
  const commit = await gh(`/git/commits/${ref.object.sha}`);
  const tree = await gh(`/git/trees/${commit.tree.sha}`);
  return { commit: ref.object.sha, tree: commit.tree.sha, file: tree.tree.find(e => e.path === FILE)?.sha };
}

const actions = {
  async load() {
    const { file } = await head();
    const text = Buffer.from((await gh(`/git/blobs/${file}`)).content, "base64").toString("utf8");
    return { sha: file, content: JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1)) };
  },

  // Pedidos de la tienda (los más nuevos primero).
  async orders() {
    return { orders: (await orders.list()).map(({ key, token, ...o }) => o) };
  },

  // Cambia el estado de un pedido pagado (pagado → enviado → entregado) y anota la empresa y el número de seguimiento.
  // La primera vez que queda "enviado", le llega un correo al cliente (una sola vez por pedido).
  async orderStatus({ id, status, carrier = "", tracking = "" }) {
    if (!["pagado", "enviado", "entregado"].includes(status)) throw fail(400, "Estado inválido.");
    const o = await orders.get(String(id));
    if (!o || !["pagado", "enviado", "entregado"].includes(o.status)) throw fail(404, "Pedido no encontrado.");
    Object.assign(o, { status, carrier: String(carrier).trim().slice(0, 40), tracking: String(tracking).trim().slice(0, 60) });
    let mailed = null;
    if (status === "enviado" && !o.shippedMailAt) {
      mailed = await notifyShipped(o).catch(e => (console.error("Correo de envío", e), false));
      if (mailed) o.shippedMailAt = Date.now();
    }
    await orders.save(o);
    return { ok: true, mailed };
  },

  // Anotaciones privadas del panel: viven en la base de datos, nunca en el sitio público.
  async notes() {
    return { notes: await notes.get() };
  },
  async saveNotes({ notes: list }) {
    if (!Array.isArray(list) || list.length > 500) throw fail(400, "Anotaciones inválidas.");
    return { notes: await notes.save(list.map(n => ({ id: String(n.id).slice(0, 24), text: String(n.text ?? "").slice(0, 10000), at: Number(n.at) || Date.now() }))) };
  },

  // Sube una foto como blob suelto (no crea commit); queda incluida en el próximo guardado.
  async upload({ data }) {
    const bytes = Buffer.from(String(data || ""), "base64");
    if (!bytes.length || bytes.length > 3e6) throw fail(400, "La foto está vacía o pesa más de 3 MB.");
    const { sha } = await gh("/git/blobs", { method: "POST", body: { content: bytes.toString("base64"), encoding: "base64" } });
    return { sha };
  },

  // Crea un único commit con content.js y las fotos nuevas.
  async save({ content, baseSha, images = [] }) {
    if (!content || typeof content !== "object" || !content.general) throw fail(400, "Contenido inválido.");
    if (!Array.isArray(images) || !images.every(i => IMG_PATH.test(i.path) && /^[0-9a-f]{40}$/.test(i.sha))) throw fail(400, "Foto inválida.");
    const current = await head();
    if (current.file !== baseSha) throw fail(409, "El contenido cambió desde que abriste el panel. Recarga la página y vuelve a hacer tus cambios.");
    const text = HEADER + JSON.stringify(content, null, 2) + ";\n";
    const tree = await gh("/git/trees", { method: "POST", body: {
      base_tree: current.tree,
      tree: [
        { path: FILE, mode: "100644", type: "blob", content: text },
        ...images.map(i => ({ path: i.path, mode: "100644", type: "blob", sha: i.sha })),
      ],
    } });
    const commit = await gh("/git/commits", { method: "POST", body: { message: "Actualizar contenido desde el panel", tree: tree.sha, parents: [current.commit] } });
    await gh(`/git/refs/heads/${BRANCH}`, { method: "PATCH", body: { sha: commit.sha } });
    return { sha: blobSha(text) };
  },
};

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido." });
  if (!process.env.ADMIN_PASSWORD || !process.env.GITHUB_TOKEN) return res.status(500).json({ error: "Falta configurar ADMIN_PASSWORD o GITHUB_TOKEN en Vercel." });
  const { action, password, ...args } = req.body || {};
  if (!passwordOk(password || "")) {
    await new Promise(r => setTimeout(r, 1000)); // frena los intentos de adivinar la contraseña
    return res.status(401).json({ error: "Contraseña incorrecta." });
  }
  if (!Object.hasOwn(actions, action)) return res.status(400).json({ error: "Acción desconocida." });
  try { res.json(await actions[action](args)); }
  catch (e) { res.status(e.status || 500).json({ error: e.message }); }
};
