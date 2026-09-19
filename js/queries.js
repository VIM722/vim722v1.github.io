/**
 * Consultas
 * ------------------------------------------------------------------
 * Solo lectura. Reconstruye pedidos a partir del Event Store para
 * responder preguntas del negocio sin tocar el historial. Mantener
 * esto separado de commands.js es lo que permite que los reportes no
 * interfieran con el registro de pedidos.
 */
window.App = window.App || {};

App.Queries = (function () {
  function listarPedidos() {
    return App.EventStore.idsDePedidos()
      .map((id) => App.Domain.reconstruir(id))
      .filter(Boolean)
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
  }

  function obtenerPedido(pedidoId) {
    return App.Domain.reconstruir(pedidoId);
  }

  function listarPedidosPorCliente(clienteId) {
    return listarPedidos().filter((p) => p.clienteId === clienteId);
  }

  function historialDePedido(pedidoId) {
    return App.EventStore.porPedido(pedidoId);
  }

  function historialCompleto() {
    return App.EventStore.all();
  }

  function kpis() {
    const pedidos = listarPedidos();
    const ingresosConfirmados = pedidos
      .filter((p) => p.estado === 'PAGADO')
      .reduce((acc, p) => acc + p.total, 0);
    return {
      totalPedidos: pedidos.length,
      pendientesPago: pedidos.filter((p) => p.estado === 'PAGO_PENDIENTE').length,
      ingresosConfirmados,
      totalClientes: App.Data.listarClientes().length,
    };
  }

  return {
    listarPedidos,
    obtenerPedido,
    listarPedidosPorCliente,
    historialDePedido,
    historialCompleto,
    kpis,
  };
})();
