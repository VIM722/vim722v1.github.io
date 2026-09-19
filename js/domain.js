/**
 * Dominio del Pedido
 * ------------------------------------------------------------------
 * Un Pedido no tiene una fila que se actualiza en el tiempo: es el
 * resultado de reproducir, en orden, todos sus eventos. Esta función
 * es la única que conoce la transición de estados, tal como se
 * describe en la variante B (auditoría / reconstrucción de estado).
 *
 * Estados posibles: REGISTRADO, STOCK_RESERVADO, PAGO_PENDIENTE,
 * PAGADO, CANCELADO.
 */
window.App = window.App || {};

App.Domain = (function () {
  const ETIQUETAS_ESTADO = {
    REGISTRADO: 'Registrado',
    STOCK_RESERVADO: 'Stock reservado',
    PAGO_PENDIENTE: 'Pago pendiente',
    PAGADO: 'Pagado',
    CANCELADO: 'Cancelado',
  };

  const ETIQUETAS_EVENTO = {
    PedidoRegistrado: 'Pedido registrado',
    StockReservado: 'Stock reservado',
    PagoRegistrado: 'Pago registrado',
    PagoConfirmado: 'Pago confirmado por el operador',
    TransferenciaConfirmada: 'Transferencia confirmada',
    PedidoCancelado: 'Pedido cancelado',
  };

  function reconstruir(pedidoId) {
    const eventos = App.EventStore.porPedido(pedidoId);
    if (eventos.length === 0) return null;

    const pedido = {
      id: pedidoId,
      clienteId: null,
      items: [],
      total: 0,
      pagos: [],
      estado: null,
      motivoCancelacion: null,
      creadoEn: null,
      actualizadoEn: null,
    };

    eventos.forEach((evento) => _aplicar(pedido, evento));
    return pedido;
  }

  function _aplicar(pedido, evento) {
    pedido.actualizadoEn = evento.fecha;

    switch (evento.tipo) {
      case 'PedidoRegistrado':
        pedido.clienteId = evento.payload.clienteId;
        pedido.items = evento.payload.items;
        pedido.total = evento.payload.total;
        pedido.creadoEn = evento.fecha;
        pedido.estado = 'REGISTRADO';
        break;

      case 'StockReservado':
        pedido.estado = 'STOCK_RESERVADO';
        break;

      case 'PagoRegistrado':
        pedido.pagos.push({
          medio: evento.payload.medio,
          monto: evento.payload.monto,
          nroOperacion: evento.payload.nroOperacion,
          estado: evento.payload.estadoPago,
          fecha: evento.fecha,
        });
        pedido.estado = evento.payload.estadoPago === 'CONFIRMADO' ? 'PAGADO' : 'PAGO_PENDIENTE';
        break;

      // 'TransferenciaConfirmada' es el nombre antiguo del evento (cuando
      // solo la transferencia requería confirmación). Se mantiene para
      // poder reproducir pedidos ya guardados en el navegador.
      case 'PagoConfirmado':
      case 'TransferenciaConfirmada':
        pedido.pagos.forEach((p) => {
          if (p.estado === 'PENDIENTE_CONFIRMACION') {
            p.estado = 'CONFIRMADO';
          }
        });
        pedido.estado = 'PAGADO';
        break;

      case 'PedidoCancelado':
        pedido.estado = 'CANCELADO';
        pedido.motivoCancelacion = evento.payload.motivo || null;
        break;

      default:
        break;
    }
  }

  function etiquetaEstado(estado) {
    return ETIQUETAS_ESTADO[estado] || estado;
  }

  function etiquetaEvento(tipo) {
    return ETIQUETAS_EVENTO[tipo] || tipo;
  }

  return { reconstruir, etiquetaEstado, etiquetaEvento };
})();
