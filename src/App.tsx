import { Navigate, Route, Routes, Link } from "react-router-dom";
import { Protegida } from "./auth";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Solicitudes } from "./pages/Solicitudes";

function Pendiente({ titulo, fase }: { titulo: string; fase: number }) {
  return (
    <div className="tarjeta aviso">
      <span className="etiqueta">PRÓXIMA ETAPA</span>
      <h1>{titulo}</h1>
      <p>
        Esta sección se implementará en la fase {fase}, según el plan de
        trabajo.
      </p>
      <Link className="boton" to="/panel/solicitudes">
        Volver a solicitudes
      </Link>
    </div>
  );
}
export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/panel/solicitudes" replace />} />
      <Route path="/panel/login" element={<Login />} />
      <Route element={<Protegida />}>
        <Route path="/panel" element={<Layout />}>
          <Route index element={<Navigate to="solicitudes" replace />} />
          <Route path="solicitudes" element={<Solicitudes />} />
          {(
            [
              ["bandeja", "Bandeja de aprobación", 3],
              ["agentes", "Agentes", 5],
              ["graficas", "Gráficas de análisis", 5],
              ["reglas", "Reglas y equipo", 5],
            ] as const
          ).map(([ruta, titulo, fase]) => (
            <Route key={ruta} element={<Protegida recurso={ruta} />}>
              <Route
                path={ruta}
                element={<Pendiente titulo={titulo} fase={fase} />}
              />
            </Route>
          ))}
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <div className="pantalla-estado">
            <h1>Página no encontrada</h1>
            <Link to="/panel/solicitudes">Ir a solicitudes</Link>
          </div>
        }
      />
    </Routes>
  );
}
