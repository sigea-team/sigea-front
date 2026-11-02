import { useState } from 'react';
import DocumentosUploader from './DocumentosUploader';

export default {
  title: 'Features/Propuestas/DocumentosUploader',
  component: DocumentosUploader,
  tags: ['autodocs'],
};

const pdf = (nombre, kb) => new File([new Uint8Array(kb * 1024)], nombre, { type: 'application/pdf' });

function Controlado(args) {
  const [archivos, setArchivos] = useState(args.archivos || []);
  return (
    <div className="max-w-xl p-6 bg-white">
      <DocumentosUploader {...args} archivos={archivos} onChange={setArchivos} />
    </div>
  );
}

/** Sin archivos: el autor elige o arrastra los documentos. */
export const Vacio = {
  render: (args) => <Controlado {...args} />,
  args: { archivos: [], obligatorio: true },
};

/** Con documentos elegidos; el primero será el documento principal. */
export const ConArchivos = {
  render: (args) => <Controlado {...args} />,
  args: { archivos: [pdf('ponencia-final.pdf', 820), pdf('anexo-datos.pdf', 140)], obligatorio: true },
};

/** Criterio 2: el formulario exige al menos un documento. */
export const ConError = {
  render: (args) => <Controlado {...args} />,
  args: { archivos: [], obligatorio: true, error: 'Debe adjuntar al menos un documento de la propuesta.' },
};

/** Nueva versión que ya conserva 5 documentos: no se pueden agregar más. */
export const CupoAgotado = {
  render: (args) => <Controlado {...args} />,
  args: { archivos: [], yaIncluidos: 5, etiqueta: 'Documentos nuevos' },
};
