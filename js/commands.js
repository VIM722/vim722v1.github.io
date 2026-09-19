/**
 * Comandos
 * ------------------------------------------------------------------
 * Las cuatro operaciones que cambian el estado del negocio. Cada una
 * valida contra el estado actual (reconstruido desde el Event Store),
 * hace su trabajo, y termina anexando uno o más eventos: nunca
 * sobrescribe nada. Separar comandos de consultas (queries.js) evita
 * que leer el estado de un pedido interfiera con registrarlo.
 */
window.App = window.App || {};

App.Commands = (function () {
  /**
   * RF1 + RF2: registra el pedido verificando disponibilidad de stock
   * y calculando el total antes de confirmarlo.
   * @param {string} clienteId
   * @param {{productoId: string, cantidad: number}[]} itemsSolicitados
   * @returns {string} pedidoId
   */
  function registrarPedido(clienteId, itemsSolicitados) {
    if (!clienteId) throw new Error('Selecciona un cliente.');
    if (!itemsSolicitados || itemsSolicitados.length === 0) {
      throw new Error('Agrega al menos un producto al pedido.');
    }

    // Verificar disponibilidad de stock (Inventario)
    const items = itemsSolicitados.map((sol) => {
      const producto = App.Data.obtenerProducto(sol.productoId);
      if (!producto) throw new Error('Uno de los productos ya no existe en el catálogo.');
      const disponible = App.Data.stockDisponible(producto);
      if (sol.cantidad < 1) throw new Error(`Cantidad inválida para ${producto.nombre}.`);
      if (sol.cantidad > disponible) {
        throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${disponible}.`);
      }
      return {
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: sol.cantidad,
        precioUnitario: producto.precio,
      };
    });

    // Calcular el total del pedido
    const total = items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);

    // Reservar stock (no se descuenta del disponible hasta que se confirme el pago)
    items.forEach((i) => {
      const producto = App.Data.obtenerProducto(i.productoId);
      App.Data.actualizarProducto(producto.id, {
        stockReservado: (producto.stockReservado || 0) + i.cantidad,
      });
    });

    const pedidoId = 'PED-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    const ahora = new Date();

    App.EventStore.append({
      pedidoId,
      tipo: 'PedidoRegistrado',
      fecha: ahora.toISOString(),
      payload: { clienteId, items, total },
    });
    App.EventStore.append({
      pedidoId,
      tipo: 'StockReservado',
      fecha: new Date(ahora.getTime() + 1).toISOString(),
      payload: { items: items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })) },
    });

    return pedidoId;
  }

  /**
   * RF3: procesa el pago de un pedido con el medio indicado.
   * Reconstruye el pedido, valida, delega en la estrategia de pago
   * correspondiente y guarda el evento resultante.
   */
  function registrarPago(pedidoId, medioTipo, monto, nroOperacion) {
    const pedido = App.Domain.reconstruir(pedidoId);
    if (!pedido) throw new Error('El pedido no existe.');
    if (pedido.estado === 'CANCELADO') throw new Error('El pedido está cancelado.');
    if (pedido.estado === 'PAGADO') throw new Error('El pedido ya fue pagado.');
    if (pedido.estado === 'PAGO_PENDIENTE') {
      throw new Error('Este pedido ya tiene un pago en espera de confirmación del operador.');
    }
    if (Math.abs(monto - pedido.total) > 0.01) {
      throw new Error(`El monto (S/ ${monto.toFixed(2)}) no coincide con el total del pedido (S/ ${pedido.total.toFixed(2)}).`);
    }

    const resultado = App.Payments.procesarPago(medioTipo, monto, { nroOperacion });

    App.EventStore.append({
      pedidoId,
      tipo: 'PagoRegistrado',
      fecha: new Date().toISOString(),
      payload: {
        medio: medioTipo,
        monto,
        nroOperacion: nroOperacion || null,
        estadoPago: resultado.estado,
      },
    });

    if (resultado.estado === 'CONFIRMADO') {
      _descontarStockDefinitivo(pedido);
    }

    return resultado;
  }

  /**
   * El operador confirma que el dinero llegó (Yape o transferencia
   * bancaria) y el pedido pasa a PAGADO.
   */
  function confirmarPago(pedidoId) {
    const pedido = App.Domain.reconstruir(pedidoId);
    if (!pedido) throw new Error('El pedido no existe.');
    if (pedido.estado !== 'PAGO_PENDIENTE') {
      throw new Error('Este pedido no tiene un pago pendiente de confirmación.');
    }

    const pendiente = pedido.pagos.filter((p) => p.estado === 'PENDIENTE_CONFIRMACION').pop();

    App.EventStore.append({
      pedidoId,
      tipo: 'PagoConfirmado',
      fecha: new Date().toISOString(),
      payload: { medio: pendiente ? pendiente.medio : null },
    });

    _descontarStockDefinitivo(pedido);
  }

  /** Cancela un pedido que aún no fue pagado, liberando el stock reservado. */
  function cancelarPedido(pedidoId, motivo) {
    const pedido = App.Domain.reconstruir(pedidoId);
    if (!pedido) throw new Error('El pedido no existe.');
    if (pedido.estado === 'CANCELADO') throw new Error('El pedido ya está cancelado.');
    if (pedido.estado === 'PAGADO') throw new Error('No se puede cancelar un pedido ya pagado.');

    pedido.items.forEach((i) => {
      const producto = App.Data.obtenerProducto(i.productoId);
      if (producto) {
        App.Data.actualizarProducto(producto.id, {
          stockReservado: Math.max(0, (producto.stockReservado || 0) - i.cantidad),
        });
      }
    });

    App.EventStore.append({
      pedidoId,
      tipo: 'PedidoCancelado',
      fecha: new Date().toISOString(),
      payload: { motivo: motivo || 'Sin motivo especificado' },
    });
  }

  function _descontarStockDefinitivo(pedido) {
    pedido.items.forEach((i) => {
      const producto = App.Data.obtenerProducto(i.productoId);
      if (producto) {
        App.Data.actualizarProducto(producto.id, {
          stockDisponible: producto.stockDisponible - i.cantidad,
          stockReservado: Math.max(0, (producto.stockReservado || 0) - i.cantidad),
        });
      }
    });
  }

  return { registrarPedido, registrarPago, confirmarPago, cancelarPedido };
})();
