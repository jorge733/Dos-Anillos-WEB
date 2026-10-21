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

### Qué más tiene el panel

- **Catálogo → Secciones del catálogo**: el catálogo se muestra dividido en secciones (por ahora *Lutería* y *Artesanías y otros*). Cada producto elige su sección.
- **Unidades disponibles** (cada producto): las que hay en el taller. Baja sola con cada venta pagada (ver *Stock* más abajo); el sitio muestra «Quedan 3 unidades» y no deja comprar más que eso; con 0 el producto aparece agotado. Vacío = no se controla ni se muestra nada. Debajo del número, el panel muestra cuántas se vendieron desde la última vez que se cambió.
- **Anotaciones**: notas privadas que solo se ven en el panel. Se guardan solas en la base de datos (Upstash), no en `content.js`, que es público.
- **Quiénes somos**: fotos y videos, cada uno con título y descripción.
- **Datos generales → Instagram**: se muestra en Contacto y en el menú.

### Videos (Vercel Blob)

Las fotos se guardan en el repositorio, pero los videos pesan demasiado: el navegador los sube directo a **Vercel Blob** (`api/upload.js` solo revisa la contraseña y da el permiso). Se pueden poner en las fotos de cada producto y en Quiénes somos (MP4, MOV o WebM, hasta 200 MB).

Configuración (una sola vez): en Vercel, en el proyecto, *Storage → Create → Blob*, con acceso **público**, y conéctalo al proyecto. Eso crea la variable `BLOB_READ_WRITE_TOKEN`. Vuelve a publicar. El plan gratis de Vercel incluye 1 GB.

## Tienda: carrito y Mercado Pago

El cliente arma su carrito, deja sus datos de envío y paga los productos y el envío con Mercado Pago (Checkout Pro). Al volver, el sitio muestra el comprobante, le llega un correo al cliente y otro a los dueños, y el pedido aparece en la pestaña **Pedidos** de `/admin`.

### Envío

En `/admin` → *Envíos* se pone el precio del envío para cada región (lo que cuesta mandar un pedido con un producto) y un recargo opcional por cada producto adicional del mismo pedido. El carrito muestra el costo apenas el cliente elige su región, y se cobra junto con los productos.

Cada producto (`/admin` → *Catálogo*) tiene la opción **Envío**:

- **Automático**: se cobra según la tabla de regiones. Es lo normal para las flautas y los accesorios.
- **Se calcula después del pago**: para productos grandes o pesados (kanteles, tablas). Si el pedido trae uno de estos, el envío completo queda por coordinar: el vendedor le escribe al cliente y se paga aparte.

Una región sin precio también queda por coordinar.

### Stock

El dueño fija las unidades en `/admin` → *Catálogo* (se guardan en `content.js`). Las ventas no tocan `content.js` (sería un commit por venta): se cuentan en la base de datos (Upstash).

- Hash `stock`: el número que fijó el dueño, guardado también ahí al apretar *Guardar y publicar*, así vale al tiro aunque Vercel tarde en publicar el `content.js` nuevo. Si un producto no aparece, se usa el de `content.js`.
- Hash `sold`: unidades pagadas desde entonces. Sube cuando un pedido queda pagado (una sola vez por pedido) y vuelve a 0 cuando el dueño cambia el número del producto.
- Disponible = stock − vendidas. `GET /api/stock` lo entrega (`{ stock: { id: unidades } }`, solo los productos que controlan stock); el sitio lo usa en el catálogo, la ficha y el carrito, y el carrito se ajusta si quedan menos. Al pagar, `api/checkout.js` vuelve a revisar contra la base de datos.

Por eso el stock se cambia siempre desde el panel: si se edita `content.js` a mano, manda el número guardado en la base de datos. Si dos personas pagan la última unidad casi al mismo tiempo, las dos ventas quedan hechas y el panel muestra el producto agotado.

Funciones: `api/upload.js` (permiso para subir videos), `api/checkout.js` (crea el pedido y el pago), `api/mercadopago.js` (vuelta y avisos de Mercado Pago), `api/order.js` (comprobante), `api/stock.js` (stock disponible) y `api/_lib.js` (piezas compartidas). Los precios y el stock siempre se recalculan en el servidor.

Variables de entorno en Vercel:

| Variable | Para qué |
| --- | --- |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Base de datos de pedidos, anotaciones y ventas por producto (stock). Se crean solas al conectar **Upstash for Redis** desde *Storage* en Vercel. |
| `RESEND_API_KEY`, `MAIL_FROM` | Correos con Resend. `MAIL_FROM` debe usar un dominio verificado en Resend, ej.: `Dos Anillos <pedidos@dosanillos.cl>`. |
| `MERCADOPAGO_ACCESS_TOKEN` | *Access Token* de Mercado Pago. Si empieza con `TEST-` (credenciales de prueba), no cobra y el carrito muestra el aviso de «modo de prueba». |

En `/admin` → *Datos generales* se eligen los correos que reciben el aviso de cada venta.

### Mercado Pago

1. Entra a [mercadopago.cl/developers/panel](https://www.mercadopago.cl/developers/panel) con la cuenta de Mercado Pago del negocio y crea una aplicación (producto: *Checkout Pro*, pagos online).
2. En la aplicación, copia el *Access Token* de **Credenciales de prueba** (empieza con `TEST-`) y guárdalo en Vercel como `MERCADOPAGO_ACCESS_TOKEN`. Vuelve a publicar y prueba una compra con las [tarjetas de prueba de Mercado Pago](https://www.mercadopago.cl/developers/es/docs/checkout-pro/additional-content/your-integrations/test/cards).
3. Cuando funcione, cambia la variable por el *Access Token* de **Credenciales de producción** (empieza con `APP_USR-`) y vuelve a publicar.

No hace falta configurar webhooks en el panel: cada pago le indica a Mercado Pago que avise a `https://dosanillos.cl/api/mercadopago`. Así el pedido queda pagado aunque el cliente cierre la ventana antes de volver a la tienda, o si el pago se aprueba más tarde.
