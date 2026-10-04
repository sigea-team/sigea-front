import { X } from 'lucide-react';

/**
 * @file ModalShell.jsx
 * @description Estructura común de los modales del módulo de eventos: fondo, encabezado
 * con icono y título serif, cuerpo desplazable y pie de acciones. Replica el estilo de
 * los modales de Roles para que todo el sistema se vea igual.
 * @module features/eventos/components/ModalShell
 */
export default function ModalShell({
  titulo,
  subtitulo,
  icono: Icono,
  onClose,
  pie,
  children,
  ancho = 'max-w-2xl',
  tituloId = 'modal-titulo',
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
    >
      <div className={`w-full ${ancho} bg-white rounded-[16px] shadow-2xl border border-[#e5e7ea] flex flex-col max-h-[90vh] overflow-hidden`}>
        <div className="px-6 py-5 border-b border-[#e5e7ea] flex items-center justify-between shrink-0 bg-[#f7f7f8]/50">
          <div className="flex items-center gap-3 min-w-0">
            {Icono && (
              <div className="w-10 h-10 rounded-full bg-[#fdecec] text-[#a6192e] flex items-center justify-center shrink-0">
                <Icono className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h2 id={tituloId} className="font-serif-title text-xl text-[#1f2023] leading-tight truncate">
                {titulo}
              </h2>
              {subtitulo && <p className="text-xs text-[#5b5f66] mt-0.5">{subtitulo}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#5b5f66] hover:text-[#1f2023] hover:bg-[#e5e7ea]/60 rounded-full transition-colors cursor-pointer"
            title="Cerrar"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {pie && (
          <div className="px-6 py-4 border-t border-[#e5e7ea] bg-[#f7f7f8]/50 flex items-center justify-end gap-3 shrink-0">
            {pie}
          </div>
        )}
      </div>
    </div>
  );
}
