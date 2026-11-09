import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, puede } from "../api";
import type { ResultadoBusqueda, Resumen } from "../api";
import { useSesion } from "../auth";
import { Icono } from "./Icono";

const secciones = [
  ["solicitudes", "Solicitudes"],
  ["bandeja", "Bandeja de aprobación"],
  ["agentes", "Agentes"],
  ["graficas", "Gráficas"],
  ["reglas", "Reglas"],
];
export function Layout() {
  const { usuario } = useSesion();
  const navegar = useNavigate();
  const cliente = useQueryClient();
  const [texto, setTexto] = useState("");
  const [consulta, setConsulta] = useState("");
  const [errorSalida, setErrorSalida] = useState("");
  const [cerrando, setCerrando] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setConsulta(texto.trim()), 300);
    return () => clearTimeout(timer);
  }, [texto]);
  const pendientes = useQuery({
    queryKey: ["pendientes"],
    queryFn: () => api<{ cantidad: number }>("/pendientes"),
  });
  const resumen = useQuery({
    queryKey: ["resumen"],
    queryFn: () => api<Resumen>("/solicitudes/resumen"),
  });
  const busqueda = useQuery({
    queryKey: ["buscar", consulta],
    queryFn: () =>
      api<ResultadoBusqueda>("/buscar?q=" + encodeURIComponent(consulta)),
    enabled: consulta.length >= 2,
  });
  if (!usuario) return null;
  async function salir() {
    setCerrando(true);
    setErrorSalida("");
    try {
      await api("/auth/logout", { method: "POST" });
      await cliente.cancelQueries();
      cliente.setQueryData(["sesion"], null);
      cliente.removeQueries({ predicate: (q) => q.queryKey[0] !== "sesion" });
      navegar("/panel/login");
    } catch (error) {
      setErrorSalida((error as Error).message);
    } finally {
      setCerrando(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="marca" href="/panel/solicitudes">
          {import.meta.env.VITE_NOMBRE_PRODUCTO || "AD mail nexus manager"}
        </a>
        <p className="submarca">Centro de mando</p>
        <nav aria-label="Navegación principal">
          {secciones
            .filter(([ruta]) => puede(usuario.rol, ruta))
            .map(([ruta, nombre]) => (
              <NavLink key={ruta} to={"/panel/" + ruta}>
                <span className="icono-caja">
                  <Icono nombre={ruta} />
                </span>
                <span>{nombre}</span>
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-pie">
          <p>Nariño y Valle del Cauca</p>
          {resumen.data?.demo && <p>Datos de demostración</p>}
          <span>Fase 1 · Base</span>
        </div>
      </aside>
      <header className="topbar">
        <div className="buscador">
          <Icono nombre="buscar" />
          <input
            aria-label="Buscar empresas, planes o solicitudes"
            placeholder="Buscar empresas, planes o solicitudes"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          {consulta.length >= 2 && (
            <div
              className="resultados-busqueda"
              role="region"
              aria-label="Resultados de búsqueda"
            >
              {busqueda.isPending ? (
                <p>Buscando…</p>
              ) : busqueda.error ? (
                <p role="alert">{busqueda.error.message}</p>
              ) : busqueda.data?.solicitudes.length === 0 ? (
                <p>No hay coincidencias.</p>
              ) : (
                busqueda.data?.solicitudes.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navegar("/panel/solicitudes?destacada=" + s.id);
                      setTexto("");
                      setConsulta("");
                    }}
                  >
                    <strong>{s.empresa}</strong>
                    <span>
                      {s.tipo} · {s.municipio}
                    </span>
                  </button>
                ))
              )}
              <small>
                La búsqueda de planes estará disponible en la fase 3.
              </small>
            </div>
          )}
        </div>
        <NavLink to="/panel/bandeja" className="pendientes">
          <span className="icono-caja">
            <Icono nombre="aviso" />
          </span>
          {pendientes.data
            ? `${pendientes.data.cantidad} planes por aprobar`
            : "Planes: sin información"}
        </NavLink>
        <div className="usuario">
          <span className="avatar">
            {usuario.nombre.charAt(0).toUpperCase()}
          </span>
          <span>
            {usuario.rol === "admin" ? "Administrador" : "Gestor de anuncios"}
          </span>
          <button
            className="salir"
            onClick={salir}
            disabled={cerrando}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <Icono nombre="salir" />
          </button>
        </div>
      </header>
      <main className="contenido">
        {errorSalida && (
          <p role="alert" className="error-form">
            {errorSalida}
          </p>
        )}
        <Outlet />
      </main>
    </div>
  );
}
