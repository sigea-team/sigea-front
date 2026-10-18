import { describe, expect, it } from 'vitest';
import {
  estadoRecepcion,
  listarCamposFaltantes,
  puedeModificarFechaCierre,
  validarNuevaFechaCierre,
} from './convocatoriaUtils';

/** Fecha relativa a ahora en el formato del input datetime-local (YYYY-MM-DDTHH:mm). */
const DIA = 86400000;
const enMs = (ms) => {
  const d = new Date(Date.now() + ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const publicada = () => ({ estado: 'publicada', fechaApertura: enMs(-10 * DIA), fechaCierre: enMs(5 * DIA) });

describe('validarNuevaFechaCierre (HU-11, Criterio 2)', () => {
  it('exige una fecha', () => {
    expect(validarNuevaFechaCierre('', publicada())).toBe('Selecciona la nueva fecha y hora límite.');
  });

  it('rechaza una fecha igual a la actual', () => {
    const conv = publicada();
    expect(validarNuevaFechaCierre(conv.fechaCierre, conv)).toBe('La nueva fecha límite es igual a la actual.');
  });

  it('rechaza una fecha pasada', () => {
    expect(validarNuevaFechaCierre(enMs(-3600000), publicada())).toMatch(/fecha y hora actual/);
  });

  it('rechaza una fecha anterior a la apertura', () => {
    const conv = { ...publicada(), fechaApertura: enMs(3 * DIA) };
    expect(validarNuevaFechaCierre(enMs(2 * DIA), conv)).toMatch(/fecha de apertura/);
  });

  it('acepta una fecha futura, distinta y posterior a la apertura', () => {
    expect(validarNuevaFechaCierre(enMs(10 * DIA), publicada())).toBeNull();
  });
});

describe('puedeModificarFechaCierre (HU-11, Criterio 2)', () => {
  it('permite una convocatoria publicada y vigente', () => {
    expect(puedeModificarFechaCierre(publicada()).permitido).toBe(true);
  });

  it('no permite una convocatoria expirada', () => {
    expect(puedeModificarFechaCierre({ ...publicada(), fechaCierre: enMs(-DIA) }).permitido).toBe(false);
  });

  it('no permite una convocatoria en borrador', () => {
    expect(puedeModificarFechaCierre({ ...publicada(), estado: 'borrador' }).permitido).toBe(false);
  });
});

describe('estadoRecepcion (HU-11, Criterio 1)', () => {
  it('distingue próxima, abierta y cerrada', () => {
    expect(estadoRecepcion({ fechaApertura: enMs(DIA), fechaCierre: enMs(5 * DIA) })).toBe('proxima');
    expect(estadoRecepcion(publicada())).toBe('abierta');
    expect(estadoRecepcion({ fechaApertura: enMs(-5 * DIA), fechaCierre: enMs(-DIA) })).toBe('cerrada');
  });
});

describe('listarCamposFaltantes (HU-11, Criterio 3)', () => {
  it('lee el formato del backend: objeto { campo: mensaje }', () => {
    const data = {
      codigo: 'CONVOCATORIA_INCOMPLETA',
      erroresValidacion: { fechaCierre: 'La fecha límite de recepción de propuestas es obligatoria para publicarla.' },
    };
    expect(listarCamposFaltantes(data)).toEqual([
      {
        campo: 'fechaCierre',
        etiqueta: 'Fecha límite de recepción de propuestas',
        mensaje: 'La fecha límite de recepción de propuestas es obligatoria para publicarla.',
      },
    ]);
  });

  it('tolera una lista de textos o de objetos', () => {
    expect(listarCamposFaltantes({ erroresValidacion: ['Falta la fecha límite'] })[0].mensaje).toBe(
      'Falta la fecha límite'
    );
    expect(listarCamposFaltantes({ erroresValidacion: [{ campo: 'titulo', mensaje: 'Falta' }] })[0].etiqueta).toBe(
      'Título'
    );
  });

  it('devuelve una lista vacía si no hay detalle', () => {
    expect(listarCamposFaltantes({})).toEqual([]);
    expect(listarCamposFaltantes(undefined)).toEqual([]);
  });

  it('no interpreta HTML: el texto se devuelve tal cual para que React lo escape', () => {
    const [item] = listarCamposFaltantes({ erroresValidacion: { titulo: '<img src=x onerror=alert(1)>' } });
    expect(item.mensaje).toBe('<img src=x onerror=alert(1)>');
  });
});
