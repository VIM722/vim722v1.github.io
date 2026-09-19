window.App = window.App || {};

App.UI = (function () {
  function formatoMoneda(valor) {
    return 'S/ ' + Number(valor).toFixed(2);
  }

  function formatoFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function badgeEstado(estado) {
    const etiqueta = App.Domain.etiquetaEstado(estado);
    return `<span class="badge st-${estado}">${etiqueta}</span>`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function toast(mensaje, tipo) {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      document.body.appendChild(region);
    }
    const el = document.createElement('div');
    el.className = 'toast' + (tipo === 'error' ? ' is-error' : '');
    el.textContent = mensaje;
    region.appendChild(el);
    setTimeout(() => el.remove(), 4200);
  }

  function manejarError(err) {
    console.error(err);
    toast(err.message || 'Ocurrió un error inesperado.', 'error');
  }

  return { formatoMoneda, formatoFecha, badgeEstado, escapeHtml, toast, manejarError };
})();
