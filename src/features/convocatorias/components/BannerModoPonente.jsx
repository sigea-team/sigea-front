/**
 * @file BannerModoPonente.jsx
 * @description Banner destacado institucional que notifica al usuario cuando su sesión
 * se encuentra en modo Ponente/Autor, invitándolo a consultar las convocatorias abiertas
 * y postular ponencias.
 * @module features/convocatorias/components/BannerModoPonente
 */

/**
 * @param {Object} props
 * @param {string} [props.enlaceConvocatorias='#/convocatorias'] - Ruta o hash hacia la vista de convocatorias abiertas.
 * @returns {JSX.Element}
 */
export default function BannerModoPonente({
  enlaceConvocatorias = '#/convocatorias',
}) {
  return (
    <div className="bg-[#fdecec] border border-[#a6192e]/30 rounded-[16px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
      <div>
        <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#a6192e] text-white rounded-full mb-1">
          Modo Ponente Activo
        </span>
        <h2 className="text-base font-bold text-[#1f2023]">
          Convocatorias Abiertas para Envío de Propuestas
        </h2>
        <p className="text-xs text-[#5b5f66] mt-1 max-w-xl">
          Como ponente o autor tienes habilitada la recepción de ponencias. Puedes registrar los datos de tus autores y enviar propuestas a las convocatorias vigentes.
        </p>
      </div>
      <a
        href={enlaceConvocatorias}
        className="inline-flex items-center justify-center px-4 py-2.5 bg-[#a6192e] hover:bg-[#7a0c1e] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 shadow-xs"
      >
        Explorar Convocatorias Abiertas
      </a>
    </div>
  );
}
