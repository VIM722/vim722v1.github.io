# Distribuidora Andina — Sistema de Gestión de Pedidos

Prototipo de página web para el caso de Distribuidora Andina, construido
siguiendo la arquitectura de la Variante B (Monolito modular con
**Event Sourcing + CQRS**, transferencia bancaria y auditoría de pedidos).

## Cómo abrirlo

No requiere instalación ni servidor: abre `index.html` en el navegador
(doble clic o "Abrir con..."). Los datos se guardan en el almacenamiento
local del navegador (`localStorage`), así que persisten entre visitas en
el mismo equipo. El sitio incluye datos de ejemplo (3 clientes, 5
productos y 3 pedidos en distintos estados) para poder explorarlo de
inmediato.

## Estructura del proyecto

```
index.html          Panel general (KPIs, pedidos recientes)
clientes.html        Registrar y listar clientes                → RF1
productos.html        Catálogo e inventario                     → RF1 / RF2
pedidos.html          Registrar pedido y listar pedidos          → RF1 / RF2
pedido.html            Detalle: estado, pago y auditoría         → RF3 + Variante B
auditoria.html       Registro completo de eventos                → Variante B

css/styles.css       Sistema de diseño de la consola

js/eventstore.js     Event Store: registro inmutable de eventos
js/domain.js         Reconstrucción del Pedido a partir de sus eventos
js/payments.js       Medios de pago + datos bancarios y QR de Yape
assets/yape-qr.jpg   Código QR de Yape de la empresa
js/data.js           Datos maestros: clientes y productos
js/commands.js       Comandos (lado de escritura de CQRS)
js/queries.js        Consultas (lado de lectura de CQRS)
js/ui-common.js      Utilidades de interfaz (formato, badges, notificaciones)
js/seed.js           Datos de ejemplo
```

## Cómo se refleja la arquitectura del documento

- **Event Sourcing:** un pedido nunca se sobrescribe. `commands.js` solo
  añade eventos (`PedidoRegistrado`, `StockReservado`, `PagoRegistrado`,
  `PagoConfirmado`, `PedidoCancelado`) a `eventstore.js`.
  `domain.js` reconstruye el estado actual reproduciendo esos eventos en
  orden — exactamente lo que pide la variante B para la auditoría.
- **CQRS:** `commands.js` (escritura) y `queries.js` (lectura) están
  separados; las consultas nunca modifican el Event Store.
- **Extensibilidad (Open/Closed):** `payments.js` registra cada medio de
  pago (Yape, Tarjeta, Transferencia bancaria) como una estrategia
  independiente.

## Pagos por Yape y transferencia (confirmados por el operador)

El sistema lo opera un trabajador. Al registrar el pago de un pedido
(`pedido.html`):

- **Yape:** se muestra el QR de la empresa (con opción de ampliarlo) y el
  monto a pagar. El número de operación es opcional.
- **Transferencia bancaria:** se muestran los datos de la cuenta (banco,
  titular, cuenta corriente, CCI y moneda, con botón para copiar cuenta y
  CCI) y el monto. El número de operación es obligatorio.
- En ambos casos el pago queda **Pago pendiente** hasta que el operador
  presiona *Confirmar que recibí el pago*; recién ahí el pedido pasa a
  **Pagado** y se descuenta el stock definitivamente. Mientras está
  pendiente, el operador puede seguir viendo los datos de cobro o cancelar
  el pedido (se libera el stock reservado).
- **Tarjeta** sigue confirmándose al instante.

Para cambiar los datos de cobro, edita `DATOS_BANCARIOS` en
`js/payments.js` o reemplaza `assets/yape-qr.jpg` por otra imagen.

Compatibilidad: los eventos antiguos `TransferenciaConfirmada` se siguen
interpretando correctamente, así que los pedidos ya guardados en el
navegador no se rompen.
- **Auditoría:** `pedido.html` muestra la línea de tiempo de eventos de
  un pedido puntual; `auditoria.html` muestra el registro completo de
  eventos del sistema, filtrable por pedido o tipo de evento.

## Notas

- El sitio es un frontend autocontenido (HTML/CSS/JS sin dependencias de
  build). Los "eventos" viven en el navegador, lo que basta para
  demostrar el comportamiento del modelo; en producción el Event Store
  estaría en un backend con persistencia real.
- Tipografías: Fraunces (títulos) e Inter (interfaz), vía Google Fonts.
  Si se abre sin conexión a internet, el navegador usa las tipografías
  de reemplazo indicadas en el CSS.
