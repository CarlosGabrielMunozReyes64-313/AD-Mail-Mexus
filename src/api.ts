export type Rol = "admin" | "gestor_anuncios";
export type Usuario = { id: string; nombre: string; correo: string; rol: Rol };
export type Solicitud = {
  id: string;
  ocurrido_en: string;
  tipo: string;
  empresa: string;
  municipio: string;
  origen: string;
  temperatura: "Caliente" | "Tibio" | "Frío";
  estado: string;
};
export type Resumen = {
  demo: boolean;
  fecha: string;
  indicadores: Record<string, number>;
  serie: { fecha: string; cantidad: number }[];
};
export type Listado = {
  items: Solicitud[];
  total: number;
  pagina: number;
  tamano: number;
};
export type Opciones = { tipo: string[]; origen: string[]; estado: string[] };
export type ResultadoBusqueda = {
  solicitudes: Pick<Solicitud, "id" | "empresa" | "tipo" | "municipio">[];
  planes: unknown[];
};

export class ErrorAPI extends Error {
  estado: number;
  constructor(mensaje: string, estado: number) {
    super(mensaje);
    this.estado = estado;
  }
}
export async function api<T>(
  ruta: string,
  opciones: RequestInit = {},
): Promise<T> {
  const respuesta = await fetch("/api" + ruta, {
    ...opciones,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-Nexus-Request": "1",
      ...opciones.headers,
    },
  });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401 && !ruta.startsWith("/auth/"))
      window.dispatchEvent(new Event("sesion-expirada"));
    throw new ErrorAPI(
      error.mensaje || "No fue posible conectar con el servidor.",
      respuesta.status,
    );
  }
  return respuesta.status === 204 ? (undefined as T) : respuesta.json();
}
export const permisos: Record<Rol, string[]> = {
  admin: ["solicitudes", "bandeja", "agentes", "graficas", "reglas"],
  gestor_anuncios: ["solicitudes", "bandeja", "graficas"],
};
export const puede = (rol: Rol, recurso: string) =>
  permisos[rol]?.includes(recurso) ?? false;
