/**
 * Event Store
 * ------------------------------------------------------------------
 * Fuente única de verdad para el ciclo de vida de un pedido. Nada se
 * sobrescribe: cada cambio (registro, reserva de stock, pago,
 * conciliación, cancelación) se añade como un evento inmutable con
 * fecha. El estado actual de un pedido nunca se guarda directamente;
 * se obtiene reproduciendo sus eventos en orden (ver domain.js).
 *
 * Esto es lo que permite reconstruir, en cualquier momento, cómo y
 * cuándo un pedido llegó a su estado actual para fines de auditoría.
 */
window.App = window.App || {};

App.EventStore = (function () {
  const KEY = 'da_eventos';

  function _readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function _writeAll(events) {
    localStorage.setItem(KEY, JSON.stringify(events));
  }

  /**
   * Añade un evento al Event Store. Un evento nunca se modifica ni se
   * elimina una vez guardado.
   * @param {{pedidoId: string, tipo: string, fecha: string, payload: object}} evento
   */
  function append(evento) {
    const events = _readAll();
    const registrado = Object.assign({}, evento, {
      id: 'evt-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
    });
    events.push(registrado);
    _writeAll(events);
    return registrado;
  }

  // El orden de aparición en el arreglo ES el orden causal real (los
  // eventos siempre se añaden con `append`, nunca se insertan fuera de
  // orden), así que la lectura no debe reordenar por fecha: la fecha es
  // solo para mostrarla, y su resolución de milisegundo no alcanza para
  // desempatar eventos que ocurren muy seguidos.
  function all() {
    return _readAll().slice();
  }

  function porPedido(pedidoId) {
    return _readAll().filter((e) => e.pedidoId === pedidoId);
  }

  function idsDePedidos() {
    const ids = new Set(_readAll().map((e) => e.pedidoId));
    return Array.from(ids);
  }

  function limpiarTodo() {
    _writeAll([]);
  }

  return { append, all, porPedido, idsDePedidos, limpiarTodo };
})();
