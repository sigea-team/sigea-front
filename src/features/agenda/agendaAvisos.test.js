import { describe, it, expect } from 'vitest';
import { htmlConflictosProgramacion, htmlConfirmacionAdvertencias } from './agendaAvisos';

const CODIGO = '<img src=x onerror="alert(1)">';
const ESCAPADO = '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;';

describe('HU-21: alertas de las respuestas 409 de la agenda', () => {
  it('escapa el mensaje y los conflictos para que un nombre con código no se ejecute', () => {
    const html = htmlConflictosProgramacion({
      message: CODIGO,
      conflictos: [{ tipo: CODIGO, mensaje: `La sala ya está ocupada por «${CODIGO}».` }],
    });

    expect(html).not.toContain('<img');
    expect(html.match(/&lt;img/g)).toHaveLength(3);
    expect(html).toContain(ESCAPADO);
  });

  it('escapa el mensaje y las advertencias de disponibilidad', () => {
    const html = htmlConfirmacionAdvertencias({
      message: CODIGO,
      advertencias: [{ mensaje: `Fuera de la disponibilidad de ${CODIGO}.` }],
    });

    expect(html).not.toContain('<img');
    expect(html.match(/&lt;img/g)).toHaveLength(2);
  });

  it('conserva el texto normal y su estructura de lista', () => {
    const html = htmlConflictosProgramacion({
      message: 'La actividad se cruza con otras de la agenda.',
      conflictos: [{ tipo: 'SALA', mensaje: 'La sala «Auditorio» ya está ocupada.' }],
    });

    expect(html).toContain('<li><strong>SALA:</strong> La sala «Auditorio» ya está ocupada.</li>');
    expect(html).toContain('La actividad se cruza con otras de la agenda.');
  });

  it('no falla si el backend no envía listas', () => {
    expect(htmlConflictosProgramacion({ message: 'Cruce' })).toContain('Cruce');
    expect(htmlConfirmacionAdvertencias({ message: 'Aviso' })).toContain('Aviso');
  });
});
