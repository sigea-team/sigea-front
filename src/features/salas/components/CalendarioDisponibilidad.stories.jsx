import { useState } from 'react';
import CalendarioDisponibilidad from './CalendarioDisponibilidad';

export default {
  title: 'Features/Salas/CalendarioDisponibilidad',
  component: CalendarioDisponibilidad,
  parameters: {
    layout: 'padded',
  },
};

export const Vacio = () => {
  const [franjas, setFranjas] = useState([]);
  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-[16px] shadow-sm border border-[#e5e7ea]">
      <CalendarioDisponibilidad
        franjas={franjas}
        ocupaciones={[]}
        onChange={setFranjas}
        editable={true}
        fechaSugerida="2026-11-10"
      />
    </div>
  );
};

export const ConDisponibilidadYOcupaciones = () => {
  const [franjas, setFranjas] = useState([
    { id: 1, fecha: '2026-11-10', horaInicio: '08:00', horaFin: '18:00' },
    { id: 2, fecha: '2026-11-11', horaInicio: '08:00', horaFin: '14:00' },
    { id: 3, fecha: '2026-11-12', horaInicio: '08:00', horaFin: '18:00' },
  ]);

  const ocupaciones = [
    {
      actividadId: 101,
      actividadNombre: 'Taller de Arquitectura Limpia',
      eventoId: 1,
      eventoNombre: 'Semana de la Ingeniería 2026',
      fecha: '2026-11-10',
      horaInicio: '09:00',
      horaFin: '11:00',
    },
    {
      actividadId: 102,
      actividadNombre: 'Conferencia Inaugural',
      eventoId: 2,
      eventoNombre: 'Congreso Internacional de Software',
      fecha: '2026-11-12',
      horaInicio: '14:00',
      horaFin: '16:00',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white rounded-[16px] shadow-sm border border-[#e5e7ea]">
      <CalendarioDisponibilidad
        franjas={franjas}
        ocupaciones={ocupaciones}
        onChange={setFranjas}
        editable={true}
        fechaSugerida="2026-11-10"
      />
    </div>
  );
};
