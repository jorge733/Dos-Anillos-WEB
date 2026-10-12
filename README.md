# Dos Anillos WEB

Tienda de instrumentos de madera artesanales. Sitio estático (HTML/CSS/JS) publicado en Vercel.

Todos los textos, precios, fotos y datos de contacto están en `content.js`.

## Panel de edición (`/admin`)

En `https://webdosanillos.vercel.app/admin/` el dueño del sitio entra con una contraseña y edita el contenido sin tocar código. Al apretar **Guardar y publicar**, la función `api/admin.js` guarda `content.js` (y las fotos nuevas, en `img/`) como un commit en GitHub, y Vercel vuelve a publicar el sitio en 1 o 2 minutos.

Configuración (una sola vez):

1. En GitHub, crea un token en *Settings → Developer settings → Personal access tokens → Fine-grained tokens*, con acceso solo al repositorio `Dos-Anillos-WEB` y el permiso **Contents: Read and write**.
2. En Vercel, en el proyecto: *Settings → Environment Variables*, agrega:
   - `ADMIN_PASSWORD`: la contraseña del panel (usa una larga).
   - `GITHUB_TOKEN`: el token del paso 1.
   - Opcionales: `GITHUB_REPO` (por defecto `jorge733/Dos-Anillos-WEB`) y `GITHUB_BRANCH` (por defecto `main`).
3. Vuelve a publicar (*Deployments → Redeploy*) para que tome las variables.
