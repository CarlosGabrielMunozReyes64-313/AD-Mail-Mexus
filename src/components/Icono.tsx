export function Icono({ nombre }: { nombre: string }) {
  const formas: Record<string, string> = {
    solicitudes: "M5 19L19 5M8 5h11v11",
    bandeja: "M5 12l4 4L19 6",
    agentes: "M12 3l3 6 6 3-6 3-3 6-3-6-6-3 6-3z",
    graficas: "M4 20V10m5 10V4m6 16V8m5 12V2",
    reglas: "M5 6h14M5 12h14M5 18h14",
    buscar: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    aviso: "M6 8a6 6 0 0 1 12 0v6l2 3H4l2-3zM10 21h4",
    salir: "M9 4H4v16h5M13 8l4 4-4 4M8 12h12",
  };
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={formas[nombre] || formas.solicitudes} />
    </svg>
  );
}
