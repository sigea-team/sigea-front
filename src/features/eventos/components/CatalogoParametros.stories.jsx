import { useState } from 'react';
import CatalogoParametros from './CatalogoParametros';
import { CATALOGOS } from '../parametroUtils';
import { crearApiParametrosMock } from '../mocks/parametrosMock';

export default {
  title: 'Features/Eventos/CatalogoParametros',
  component: CatalogoParametros,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-3xl p-6 bg-white">
        <Story />
      </div>
    ),
  ],
};

const TIPOS = [
  { id: 1, eventoId: 3, nombre: 'Conferencia', descripcion: 'Charla magistral de un invitado, 45 a 60 minutos.' },
  { id: 2, eventoId: 3, nombre: 'Panel', descripcion: 'Conversación moderada entre tres o cuatro invitados.' },
  { id: 4, eventoId: 3, nombre: 'Taller', descripcion: 'Sesión práctica de 2 a 4 horas con cupo limitado.' },
];

/** Envuelve el componente con estado propio, como lo hace ParametrosEventoModal. */
function ConEstado({ catalogo = 'tipos', itemsIniciales, modificable = true }) {
  const [items, setItems] = useState(itemsIniciales);
  const [api] = useState(() => crearApiParametrosMock());
  const acciones = {
    crear: (datos) => api.crear(catalogo, 3, datos),
    actualizar: (id, datos) => api.actualizar(catalogo, 3, id, datos),
    consultarUso: (id) => api.consultarUso(catalogo, 3, id),
    eliminar: (id) => api.eliminar(catalogo, 3, id),
  };
  return (
    <CatalogoParametros
      config={CATALOGOS[catalogo]}
      items={items}
      modificable={modificable}
      motivoBloqueo="El evento está «Cerrado». Los tipos de actividad y las líneas temáticas solo se pueden modificar mientras está en configuración o habilitado."
      acciones={acciones}
      onCambio={setItems}
    />
  );
}

export const TiposDeActividad = { render: () => <ConEstado itemsIniciales={TIPOS} /> };

export const Vacio = { render: () => <ConEstado itemsIniciales={[]} /> };

export const SoloLectura = { render: () => <ConEstado itemsIniciales={TIPOS} modificable={false} /> };
