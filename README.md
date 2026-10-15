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

## Tienda: carrito y Mercado Pago

El cliente arma su carrito, deja sus datos de envío y paga los productos y el envío con Mercado Pago (Checkout Pro). Al volver, el sitio muestra el comprobante, le llega un correo al cliente y otro a los dueños, y el pedido aparece en la pestaña **Pedidos** de `/admin`.

### Envío

En `/admin` → *Envíos* se pone el precio del envío para cada región (lo que cuesta mandar un pedido con un producto) y un recargo opcional por cada producto adicional del mismo pedido. El carrito muestra el costo apenas el cliente elige su región, y se cobra junto con los productos.

Cada producto (`/admin` → *Catálogo*) tiene la opción **Envío**:

- **Automático**: se cobra según la tabla de regiones. Es lo normal para las flautas y los accesorios.
- **Se calcula después del pago**: para productos grandes o pesados (kanteles, tablas). Si el pedido trae uno de estos, el envío completo queda por coordinar: el vendedor le escribe al cliente y se paga aparte.

Una región sin precio también queda por coordinar.

Funciones: `api/checkout.js` (crea el pedido y el pago), `api/mercadopago.js` (vuelta y avisos de Mercado Pago), `api/order.js` (comprobante) y `api/_lib.js` (piezas compartidas). Los precios siempre se recalculan en el servidor.

Variables de entorno en Vercel:

| Variable | Para qué |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base de datos de pedidos. Se crean solas al conectar **Upstash for Redis** desde *Storage* en Vercel. |
| `RESEND_API_KEY`, `MAIL_FROM` | Correos con Resend. `MAIL_FROM` debe usar un dominio verificado en Resend, ej.: `Dos Anillos <pedidos@dosanillos.cl>`. |
| `MERCADOPAGO_ACCESS_TOKEN` | *Access Token* de Mercado Pago. Si empieza con `TEST-` (credenciales de prueba), no cobra y el carrito muestra el aviso de «modo de prueba». |

En `/admin` → *Datos generales* se eligen los correos que reciben el aviso de cada venta.

### Mercado Pago

1. Entra a [mercadopago.cl/developers/panel](https://www.mercadopago.cl/developers/panel) con la cuenta de Mercado Pago del negocio y crea una aplicación (producto: *Checkout Pro*, pagos online).
2. En la aplicación, copia el *Access Token* de **Credenciales de prueba** (empieza con `TEST-`) y guárdalo en Vercel como `MERCADOPAGO_ACCESS_TOKEN`. Vuelve a publicar y prueba una compra con las [tarjetas de prueba de Mercado Pago](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards).
3. Cuando funcione, cambia la variable por el *Access Token* de **Credenciales de producción** (empieza con `APP_USR-`) y vuelve a publicar.

No hace falta configurar webhooks en el panel: cada pago le indica a Mercado Pago que avise a `https://dosanillos.cl/api/mercadopago`. Así el pedido queda pagado aunque el cliente cierre la ventana antes de volver a la tienda, o si el pago se aprueba más tarde.
