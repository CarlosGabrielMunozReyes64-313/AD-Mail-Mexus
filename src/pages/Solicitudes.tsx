import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api";
import type { Listado, Opciones, Resumen, Solicitud } from "../api";
import { Estado } from "../components/Estado";

const nombres = [
  ["solicitudes", "Solicitudes hoy"],
  ["registros", "Registros nuevos"],
  ["completados", "Diagnósticos completados"],
  ["respuestas", "Respuestas a anuncios"],
  ["bajas", "Bajas"],
];
const fechaCorta = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(fecha + "T12:00:00Z"));
const hora = (fecha: string) =>
  new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Bogota",
  }).format(new Date(fecha));
export function Solicitudes() {
  const [parametros] = useSearchParams();
  const [filtros, setFiltros] = useState({
    fecha: "hoy",
    tipo: "",
    origen: "",
    estado: "",
  });
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState<Solicitud | null>(null);
  const resumen = useQuery({
    queryKey: ["resumen"],
    queryFn: () => api<Resumen>("/solicitudes/resumen"),
  });
  const opciones = useQuery({
    queryKey: ["opciones"],
    queryFn: () => api<Opciones>("/solicitudes/opciones"),
  });
  const fecha = filtros.fecha === "hoy" ? resumen.data?.fecha : filtros.fecha;
  const consulta = new URLSearchParams({ pagina: String(pagina), tamano: "8" });
  if (fecha) consulta.set("fecha", fecha);
  for (const campo of ["tipo", "origen", "estado"] as const)
    if (filtros[campo]) consulta.set(campo, filtros[campo]);
  const lista = useQuery({
    queryKey: ["solicitudes", consulta.toString()],
    queryFn: () => api<Listado>("/solicitudes?" + consulta),
    enabled: !!resumen.data,
  });
  const destacada = parametros.get("destacada");
  useEffect(() => {
    if (destacada) {
      setFiltros({ fecha: "", tipo: "", origen: "", estado: "" });
      setPagina(1);
    }
  }, [destacada]);
  function filtrar(campo: string, valor: string) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPagina(1);
  }
  return (
    <>
      <div className="titulo-pagina">
        <h1>Solicitudes recibidas</h1>
        <span className="fecha-actual">
          {resumen.data &&
            new Intl.DateTimeFormat("es-CO", {
              dateStyle: "long",
              timeZone: "UTC",
            }).format(new Date(resumen.data.fecha + "T12:00:00Z"))}
        </span>
      </div>
      {resumen.isPending || resumen.error ? (
        <Estado error={resumen.error} reintentar={() => resumen.refetch()} />
      ) : (
        <>
          <section className="indicadores" aria-label="Indicadores de hoy">
            {nombres.map(([clave, nombre]) => (
              <article className="tarjeta indicador" key={clave}>
                <p>{nombre}</p>
                <strong>
                  {resumen.data.indicadores[clave].toLocaleString("es-CO")}
                </strong>
              </article>
            ))}
          </section>
          <section className="tarjeta grafica-solicitudes">
            <h2>Solicitudes de los últimos 14 días</h2>
            <div
              className="grafica"
              role="img"
              aria-label={
                "Solicitudes diarias: " +
                resumen.data.serie
                  .map((p) => `${p.fecha}: ${p.cantidad}`)
                  .join(", ")
              }
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={resumen.data.serie}
                  margin={{ top: 12, right: 15, bottom: 0, left: 15 }}
                >
                  <CartesianGrid vertical={false} stroke="#dfe1eb" />
                  <XAxis
                    dataKey="fecha"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fechaCorta}
                    ticks={[
                      resumen.data.serie[0]?.fecha,
                      resumen.data.serie.at(-1)?.fecha,
                    ].filter((f): f is string => !!f)}
                    tick={{ fontSize: 11, fill: "#77798b" }}
                    dy={10}
                  />
                  <YAxis hide domain={[0, 40]} ticks={[0, 10, 20, 30, 40]} />
                  <Tooltip
                    labelFormatter={(v) => fechaCorta(String(v))}
                    formatter={(v) => [v, "Solicitudes"]}
                  />
                  <Line
                    type="linear"
                    dataKey="cantidad"
                    stroke="#534AB7"
                    strokeWidth={2}
                    dot={{ fill: "#534AB7", r: 3, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
      <section className="tarjeta tabla-tarjeta">
        <div className="tabla-cabecera">
          <h2>Todas las solicitudes</h2>
          <div className="filtros">
            <label className="sr-only" htmlFor="fecha-filtro">
              Fecha
            </label>
            <select
              id="fecha-filtro"
              value={
                filtros.fecha === "hoy" || filtros.fecha === ""
                  ? filtros.fecha
                  : "otra"
              }
              onChange={(e) =>
                filtrar(
                  "fecha",
                  e.target.value === "otra"
                    ? resumen.data?.fecha || ""
                    : e.target.value,
                )
              }
            >
              <option value="hoy">Hoy</option>
              <option value="">Todas las fechas</option>
              <option value="otra">Elegir fecha</option>
            </select>
            {filtros.fecha !== "" && filtros.fecha !== "hoy" && (
              <input
                aria-label="Fecha específica"
                type="date"
                value={filtros.fecha}
                onChange={(e) => filtrar("fecha", e.target.value)}
              />
            )}
            {(["tipo", "origen", "estado"] as const).map((campo) => (
              <select
                key={campo}
                aria-label={"Filtrar por " + campo}
                value={filtros[campo]}
                onChange={(e) => filtrar(campo, e.target.value)}
              >
                <option value="">
                  {campo.charAt(0).toUpperCase() + campo.slice(1)}: todos
                </option>
                {opciones.data?.[campo].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            ))}
          </div>
        </div>
        {opciones.error && (
          <p role="alert">
            No se cargaron las opciones de filtros.{" "}
            <button onClick={() => opciones.refetch()}>Reintentar</button>
          </p>
        )}
        {lista.isPending || lista.error ? (
          <Estado error={lista.error} reintentar={() => lista.refetch()} />
        ) : (
          <>
            <div className="tabla-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Hora",
                      "Tipo",
                      "Empresa",
                      "Municipio",
                      "Origen",
                      "Temperatura IA",
                      "Estado",
                    ].map((c) => (
                      <th key={c} scope="col">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lista.data.items.map((s) => (
                    <tr
                      key={s.id}
                      className={s.id === destacada ? "destacada" : ""}
                    >
                      <td>{hora(s.ocurrido_en)}</td>
                      <td>
                        <button
                          className="enlace-tabla"
                          onClick={() => setSeleccion(s)}
                        >
                          {s.tipo}
                        </button>
                      </td>
                      <td>{s.empresa}</td>
                      <td>{s.municipio}</td>
                      <td>{s.origen}</td>
                      <td>
                        <span
                          className={
                            "temperatura " +
                            (s.temperatura === "Frío"
                              ? "frio"
                              : s.temperatura.toLowerCase())
                          }
                        >
                          {s.temperatura}
                        </span>
                      </td>
                      <td>{s.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lista.data.total === 0 && (
              <div className="sin-resultados">
                <h3>No hay solicitudes con estos filtros</h3>
                <p>Pruebe con otra fecha, tipo u origen.</p>
                <button
                  onClick={() => {
                    setFiltros({ fecha: "", tipo: "", origen: "", estado: "" });
                    setPagina(1);
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            )}
            <div className="paginacion">
              <span>
                {lista.data.total} solicitudes
                {resumen.data?.demo ? " · Muestra de demostración" : ""}
              </span>
              <div>
                <button
                  disabled={pagina <= 1}
                  onClick={() => setPagina((p) => p - 1)}
                >
                  Anterior
                </button>
                <span>
                  Página {pagina} de{" "}
                  {Math.max(1, Math.ceil(lista.data.total / 8))}
                </span>
                <button
                  disabled={pagina * 8 >= lista.data.total}
                  onClick={() => setPagina((p) => p + 1)}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
      {seleccion && (
        <div className="modal-fondo" onClick={() => setSeleccion(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalle-titulo"
            className="tarjeta modal"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSeleccion(null);
            }}
          >
            <h2 id="detalle-titulo">{seleccion.empresa}</h2>
            <dl>
              {[
                ["Tipo", seleccion.tipo],
                ["Municipio", seleccion.municipio],
                ["Origen", seleccion.origen],
                ["Temperatura IA", seleccion.temperatura],
                ["Estado", seleccion.estado],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <button autoFocus onClick={() => setSeleccion(null)}>
              Cerrar detalle
            </button>
          </section>
        </div>
      )}
      <footer className="pagina-pie">01</footer>
    </>
  );
}
