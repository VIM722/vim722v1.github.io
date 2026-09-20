/**
 * Medios de pago
 * ------------------------------------------------------------------
 * Cada medio de pago se resuelve de forma independiente (principio
 * abierto/cerrado): agregar un medio nuevo solo requiere sumar una
 * entrada al registro, sin tocar la lógica de los demás.
 *
 *  - Tarjeta: confirma al instante (pasarela de pago).
 *  - Yape y Transferencia bancaria: el cliente paga por su cuenta y el
 *    pago queda PENDIENTE hasta que el operador verifica que el dinero
 *    llegó y lo confirma (comando `confirmarPago`).
 *
 * Los datos que el operador le muestra al cliente (cuenta bancaria y
 * QR de Yape) viven aquí, en un solo lugar: si cambian, se editan en
 * `DATOS_BANCARIOS` o `YAPE`.
 */
window.App = window.App || {};

App.Payments = (function () {
  const CUENTAS_BANCARIAS = [
    {
      banco: 'BCP',
      titular: 'Distribuidora Andina.',
      tipoCuenta: 'Cuenta corriente',
      cuenta: '191-4567890123',
      cci: '00219100456789012345',
      moneda: 'Soles (PEN)',
    },
    {
      banco: 'BBVA',
      titular: 'Distribuidora Andina.',
      tipoCuenta: 'Cuenta corriente',
      cuenta: '0011-0123-0100123456',
      cci: '01112300010012345678',
      moneda: 'Soles (PEN)',
    },
  ];

  const YAPE = {
    qr: 'assets/yape-qr.jpg',
  };

  const MEDIOS = {
    YAPE: {
      tipo: 'YAPE',
      label: 'Yape',
      descripcion: 'El cliente escanea el QR y el operador confirma la recepción.',
      requiereConfirmacionOperador: true,
      requiereNroOperacion: false,
      procesar: function () {
        return { estado: 'PENDIENTE_CONFIRMACION' };
      },
    },
    TARJETA: {
      tipo: 'TARJETA',
      label: 'Tarjeta',
      descripcion: 'Confirmación inmediata vía pasarela de pago.',
      requiereConfirmacionOperador: false,
      requiereNroOperacion: false,
      procesar: function () {
        return { estado: 'CONFIRMADO' };
      },
    },
    TRANSFERENCIA: {
      tipo: 'TRANSFERENCIA',
      label: 'Transferencia bancaria',
      descripcion: 'El cliente transfiere a la cuenta de la empresa y el operador confirma el depósito.',
      requiereConfirmacionOperador: true,
      requiereNroOperacion: true,
      procesar: function () {
        return { estado: 'PENDIENTE_CONFIRMACION' };
      },
    },
  };

  function procesarPago(tipo, monto, datos) {
    const medio = MEDIOS[tipo];
    if (!medio) throw new Error('Medio de pago no soportado: ' + tipo);
    if (medio.requiereNroOperacion && !datos.nroOperacion) {
      throw new Error('Ingresa el número de operación de la transferencia.');
    }
    return medio.procesar(monto, datos);
  }

  function listar() {
    return Object.values(MEDIOS);
  }

  function obtener(tipo) {
    return MEDIOS[tipo];
  }

  return { procesarPago, listar, obtener, CUENTAS_BANCARIAS, YAPE };
})();
