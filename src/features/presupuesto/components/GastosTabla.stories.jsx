import GastosTabla from './GastosTabla';

export default {
  title: 'Features/Presupuesto/GastosTabla',
  component: GastosTabla,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
};

const GASTOS = [
  { id: 3, eventoId: 3, rubroId: 1, rubroNombre: 'Transporte de conferencistas', descripcion: 'Transporte terrestre aeropuerto – hotel', valor: 300000, fechaGasto: '2026-10-08', soporteUrl: null, registradoPorId: 2, registradoPorNombre: 'Cristian Rodríguez' },
  { id: 2, eventoId: 3, rubroId: 2, rubroNombre: 'Refrigerios', descripcion: 'Refrigerios primer día', valor: 400000, fechaGasto: '2026-10-05', soporteUrl: 'Factura física 1187 — archivo de la dirección', registradoPorId: 2, registradoPorNombre: 'Cristian Rodríguez' },
  { id: 1, eventoId: 3, rubroId: 1, rubroNombre: 'Transporte de conferencistas', descripcion: 'Tiquetes aéreos del conferencista invitado', valor: 450000, fechaGasto: '2026-10-02', soporteUrl: 'https://drive.ufps.edu.co/gastos/factura-0451.pdf', registradoPorId: 2, registradoPorNombre: 'Cristian Rodríguez' },
];

/** Soporte como enlace, como texto o sin soporte (es opcional). */
export const ConGastos = {
  args: { gastos: GASTOS },
};

/** Filtrada por un rubro: no se repite la columna del rubro. */
export const DeUnRubro = {
  args: { gastos: GASTOS.filter((g) => g.rubroId === 1), mostrarRubro: false },
};

/** Criterio 4: sin gastos. */
export const SinGastos = {
  args: { gastos: [] },
};
