/**
 * Datos maestros
 * ------------------------------------------------------------------
 * Clientes y productos no forman parte del historial de eventos: son
 * registros que se pueden actualizar directamente, a diferencia del
 * pedido (cuyo estado siempre se reconstruye). Cada módulo -Clientes,
 * Catálogo/Inventario- mantiene su propia información.
 */
window.App = window.App || {};

App.Data = (function () {
  const CLIENTES_KEY = 'da_clientes';
  const PRODUCTOS_KEY = 'da_productos';

  function _get(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
      return [];
    }
  }
  function _set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // ---------- Clientes ----------
  function listarClientes() {
    return _get(CLIENTES_KEY).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  function obtenerCliente(id) {
    return _get(CLIENTES_KEY).find((c) => c.id === id) || null;
  }
  function registrarCliente(datos) {
    const clientes = _get(CLIENTES_KEY);
    const cliente = Object.assign(
      { id: 'CLI-' + Date.now().toString(36).toUpperCase(), fechaRegistro: new Date().toISOString() },
      datos
    );
    clientes.push(cliente);
    _set(CLIENTES_KEY, clientes);
    return cliente;
  }

  // ---------- Productos ----------
  function listarProductos() {
    return _get(PRODUCTOS_KEY).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  function obtenerProducto(id) {
    return _get(PRODUCTOS_KEY).find((p) => p.id === id) || null;
  }
  function registrarProducto(datos) {
    const productos = _get(PRODUCTOS_KEY);
    const producto = Object.assign(
      { id: 'PROD-' + Date.now().toString(36).toUpperCase(), stockReservado: 0 },
      datos
    );
    productos.push(producto);
    _set(PRODUCTOS_KEY, productos);
    return producto;
  }
  function actualizarProducto(id, cambios) {
    const productos = _get(PRODUCTOS_KEY);
    const idx = productos.findIndex((p) => p.id === id);
    if (idx > -1) {
      productos[idx] = Object.assign({}, productos[idx], cambios);
      _set(PRODUCTOS_KEY, productos);
    }
  }
  function stockDisponible(producto) {
    return producto.stockDisponible - (producto.stockReservado || 0);
  }

  function sembrarSiVacio(seed) {
    if (_get(CLIENTES_KEY).length === 0 && seed.clientes) _set(CLIENTES_KEY, seed.clientes);
    if (_get(PRODUCTOS_KEY).length === 0 && seed.productos) _set(PRODUCTOS_KEY, seed.productos);
  }

  return {
    listarClientes,
    obtenerCliente,
    registrarCliente,
    listarProductos,
    obtenerProducto,
    registrarProducto,
    actualizarProducto,
    stockDisponible,
    sembrarSiVacio,
  };
})();
