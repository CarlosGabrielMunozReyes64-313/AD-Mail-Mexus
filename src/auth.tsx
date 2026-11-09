import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router-dom";
import { api, puede } from "./api";
import type { Usuario } from "./api";

const Sesion = createContext<{ usuario: Usuario | null; cargando: boolean }>({
  usuario: null,
  cargando: true,
});
export const useSesion = () => useContext(Sesion);
export function ProveedorSesion({ children }: { children: ReactNode }) {
  const cliente = useQueryClient();
  const consulta = useQuery({
    queryKey: ["sesion"],
    queryFn: () => api<Usuario>("/auth/me"),
    retry: false,
    staleTime: 60000,
  });
  useEffect(() => {
    const limpiar = () => {
      cliente.setQueryData(["sesion"], null);
    };
    window.addEventListener("sesion-expirada", limpiar);
    return () => window.removeEventListener("sesion-expirada", limpiar);
  }, [cliente]);
  return (
    <Sesion.Provider
      value={{ usuario: consulta.data ?? null, cargando: consulta.isPending }}
    >
      {children}
    </Sesion.Provider>
  );
}
export function Protegida({ recurso }: { recurso?: string }) {
  const { usuario, cargando } = useSesion();
  if (cargando)
    return (
      <div className="pantalla-estado" role="status">
        Comprobando su sesión…
      </div>
    );
  if (!usuario) return <Navigate to="/panel/login" replace />;
  if (recurso && !puede(usuario.rol, recurso))
    return (
      <div className="tarjeta aviso" role="alert">
        <h1>Acceso restringido</h1>
        <p>Su rol no tiene acceso a esta sección.</p>
        <a href="/panel/solicitudes">Volver a solicitudes</a>
      </div>
    );
  return <Outlet />;
}
