// Marca decorativa de la UTN FRBA. TODO: reemplazar `d` por el trazado del SVG institucional
// (viewBox 595.3 × 699.4); este es un marcador geométrico, no el logo oficial.
export default function UtnLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 595.3 699.4" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M0 0h595.3v420c0 150-120 230-297.6 279.4C120 650 0 570 0 420zM150 130v260c0 70 60 120 147.6 150 87.7-30 147.7-80 147.7-150V130h-90v250c0 30-20 50-57.7 65-37.6-15-57.6-35-57.6-65V130z" fillRule="evenodd" />
    </svg>
  )
}
