/**
 * Siembra inicial: datos de ejemplo para poder explorar la consola
 * sin tener que cargar todo a mano. Se ejecuta una sola vez; si ya
 * hay datos guardados, no hace nada.
 */
window.App = window.App || {};

App.Seed = (function () {
  function ejecutar() {
    App.Data.sembrarSiVacio({
      clientes: [
        {
          id: 'CLI-A1',
          nombre: 'Bodega San Martín E.I.R.L.',
          documento: 'RUC 20481239876',
          telefono: '956 214 330',
          email: 'compras@bodegasanmartin.pe',
          fechaRegistro: '2026-08-04T09:12:00.000Z',
        },
        {
          id: 'CLI-A2',
          nombre: 'Minimarket Los Andes',
          documento: 'RUC 20558843201',
          telefono: '944 887 102',
          email: 'pedidos@minimarketlosandes.pe',
          fechaRegistro: '2026-08-11T14:30:00.000Z',
        },
        {
          id: 'CLI-A3',
          nombre: 'Comercial Rosa Quispe',
          documento: 'DNI 41209988',
          telefono: '921 340 776',
          email: 'rquispe.comercial@gmail.com',
          fechaRegistro: '2026-09-02T11:05:00.000Z',
        },
      ],
      productos: [
        { id: 'PROD-A1', nombre: 'Arroz Superior 5kg', sku: 'AR-0500', precio: 24.9, stockDisponible: 170, stockReservado: 0 },
        { id: 'PROD-A2', nombre: 'Aceite Vegetal 1L', sku: 'AC-0100', precio: 9.5, stockDisponible: 228, stockReservado: 0 },
        { id: 'PROD-A3', nombre: 'Azúcar Rubia 5kg', sku: 'AZ-0500', precio: 21.3, stockDisponible: 12, stockReservado: 0 },
        { id: 'PROD-A4', nombre: 'Leche Evaporada Caja x24', sku: 'LE-0024', precio: 68.0, stockDisponible: 40, stockReservado: 3 },
        { id: 'PROD-A5', nombre: 'Detergente 4kg', sku: 'DT-0400', precio: 32.8, stockDisponible: 25, stockReservado: 0 },
      ],
    });

    if (App.EventStore.all().length === 0) {
      _sembrarPedidosDeEjemplo();
    }
  }

  function _sembrarPedidosDeEjemplo() {
    const t0 = new Date('2026-09-15T15:40:00.000Z').getTime();

    // Pedido 1: pagado con Yape, confirmado por el operador.
    App.EventStore.append({
      pedidoId: 'PED-DEMO1',
      tipo: 'PedidoRegistrado',
      fecha: new Date(t0).toISOString(),
      payload: {
        clienteId: 'CLI-A1',
        items: [
          { productoId: 'PROD-A1', nombre: 'Arroz Superior 5kg', cantidad: 10, precioUnitario: 24.9 },
          { productoId: 'PROD-A2', nombre: 'Aceite Vegetal 1L', cantidad: 12, precioUnitario: 9.5 },
        ],
        total: 363.0,
      },
    });
    App.EventStore.append({ pedidoId: 'PED-DEMO1', tipo: 'StockReservado', fecha: new Date(t0 + 1000).toISOString(), payload: {} });
    App.EventStore.append({
      pedidoId: 'PED-DEMO1',
      tipo: 'PagoRegistrado',
      fecha: new Date(t0 + 40 * 60000).toISOString(),
      payload: { medio: 'YAPE', monto: 363.0, nroOperacion: null, estadoPago: 'PENDIENTE_CONFIRMACION' },
    });
    App.EventStore.append({
      pedidoId: 'PED-DEMO1',
      tipo: 'PagoConfirmado',
      fecha: new Date(t0 + 43 * 60000).toISOString(),
      payload: { medio: 'YAPE' },
    });

    // Pedido 2: transferencia pendiente de confirmación (para mostrar auditoría en curso).
    const t1 = new Date('2026-09-18T09:10:00.000Z').getTime();
    App.EventStore.append({
      pedidoId: 'PED-DEMO2',
      tipo: 'PedidoRegistrado',
      fecha: new Date(t1).toISOString(),
      payload: {
        clienteId: 'CLI-A2',
        items: [{ productoId: 'PROD-A4', nombre: 'Leche Evaporada Caja x24', cantidad: 3, precioUnitario: 68.0 }],
        total: 204.0,
      },
    });
    App.EventStore.append({ pedidoId: 'PED-DEMO2', tipo: 'StockReservado', fecha: new Date(t1 + 1000).toISOString(), payload: {} });
    App.EventStore.append({
      pedidoId: 'PED-DEMO2',
      tipo: 'PagoRegistrado',
      fecha: new Date(t1 + 20 * 60000).toISOString(),
      payload: { medio: 'TRANSFERENCIA', monto: 204.0, nroOperacion: 'OP-88213345', estadoPago: 'PENDIENTE_CONFIRMACION' },
    });

    // Pedido 3: cancelado.
    const t2 = new Date('2026-09-10T17:00:00.000Z').getTime();
    App.EventStore.append({
      pedidoId: 'PED-DEMO3',
      tipo: 'PedidoRegistrado',
      fecha: new Date(t2).toISOString(),
      payload: {
        clienteId: 'CLI-A3',
        items: [{ productoId: 'PROD-A3', nombre: 'Azúcar Rubia 5kg', cantidad: 4, precioUnitario: 21.3 }],
        total: 85.2,
      },
    });
    App.EventStore.append({ pedidoId: 'PED-DEMO3', tipo: 'StockReservado', fecha: new Date(t2 + 1000).toISOString(), payload: {} });
    App.EventStore.append({
      pedidoId: 'PED-DEMO3',
      tipo: 'PedidoCancelado',
      fecha: new Date(t2 + 3 * 3600000).toISOString(),
      payload: { motivo: 'El cliente encontró mejor precio con otro proveedor.' },
    });
  }

  return { ejecutar };
})();

App.Seed.ejecutar();
