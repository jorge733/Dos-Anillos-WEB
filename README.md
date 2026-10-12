# Dos Anillos WEB

Tienda de instrumentos de madera artesanales. Sitio estático (HTML/CSS/JS) publicado en Vercel.

Todos los textos, precios, fotos y datos de contacto están en `content.js`.

## Panel de edición (`/admin`)

En `https://dosanillos.cl/admin` el dueño del sitio entra con una contraseña y edita el contenido sin tocar código. Al apretar **Guardar y publicar**, la función `api/admin.js` guarda `content.js` (y las fotos nuevas, en `img/`) como un commit en GitHub, y Vercel vuelve a publicar el sitio en 1 o 2 minutos.

Configuración (una sola vez):

1. En GitHub, crea un token en *Settings → Developer settings → Personal access tokens → Fine-grained tokens*, con acceso solo al repositorio `Dos-Anillos-WEB` y el permiso **Contents: Read and write**.
2. En Vercel, en el proyecto: *Settings → Environment Variables*, agrega:
   - `ADMIN_PASSWORD`: la contraseña del panel (usa una larga).
   - `GITHUB_TOKEN`: el token del paso 1.
   - Opcionales: `GITHUB_REPO` (por defecto `jorge733/Dos-Anillos-WEB`) y `GITHUB_BRANCH` (por defecto `main`).
3. Vuelve a publicar (*Deployments → Redeploy*) para que tome las variables.

## Tienda: carrito, Webpay y envíos con Chilexpress

El cliente arma su carrito, elige región y comuna, y Chilexpress cotiza el envío según el peso y las medidas del paquete (se configuran por producto en `/admin`). Paga con Webpay Plus. Al volver, el sitio muestra el comprobante, le llega un correo al cliente y otro a los dueños, y el pedido aparece en la pestaña **Pedidos** de `/admin`.

Funciones: `api/shipping.js` (comunas y cotización), `api/checkout.js` (crea el pedido y el pago), `api/webpay.js` (vuelta desde Webpay), `api/order.js` (comprobante) y `api/_lib.js` (piezas compartidas). Los precios y el envío siempre se recalculan en el servidor.

Variables de entorno en Vercel:

| Variable | Para qué |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base de datos de pedidos. Se crean solas al conectar **Upstash for Redis** desde *Storage* en Vercel. |
| `CHILEXPRESS_COVERAGE_KEY`, `CHILEXPRESS_RATING_KEY` | Llaves de las APIs *Cobertura* y *Cotizador* del portal developers.wschilexpress.com. |
| `CHILEXPRESS_ENV` | `production` para usar el ambiente real de Chilexpress (por defecto, el de pruebas). |
| `RESEND_API_KEY`, `MAIL_FROM` | Correos con Resend. `MAIL_FROM` debe usar un dominio verificado en Resend, ej.: `Dos Anillos <pedidos@dosanillos.cl>`. |
| `TRANSBANK_ENV`, `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY` | Webpay en producción. Sin `TRANSBANK_ENV=production` se usa el ambiente de integración de Transbank, que no cobra y muestra un aviso de «modo de prueba» en el carrito. |

En `/admin` → *Datos generales* hay que elegir la comuna desde donde se despacha y los correos que reciben el aviso de cada venta.

Tarjeta de prueba de Transbank (ambiente de integración): VISA 4051 8856 0044 6623, CVV 123, cualquier fecha futura; en el banco de prueba, RUT 11.111.111-1 y clave 123.
