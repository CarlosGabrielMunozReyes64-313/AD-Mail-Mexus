import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Usuario } from "../api";
import { useSesion } from "../auth";

export function Login() {
  const { usuario, cargando } = useSesion();
  const cliente = useQueryClient();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  if (usuario) return <Navigate to="/panel/solicitudes" replace />;
  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const datos = await api<Usuario>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena }),
      });
      cliente.removeQueries({ predicate: (q) => q.queryKey[0] !== "sesion" });
      cliente.setQueryData(["sesion"], datos);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }
  return (
    <div className="login">
      <a className="marca" href="/panel/login">
        {import.meta.env.VITE_NOMBRE_PRODUCTO || "AD mail nexus manager"}
      </a>
      <form className="tarjeta login-form" onSubmit={enviar}>
        <span className="etiqueta">CENTRO DE MANDO</span>
        <h1>Bienvenido de nuevo</h1>
        <p>Ingrese para revisar las solicitudes de su empresa.</p>
        <label htmlFor="correo">Correo</label>
        <input
          id="correo"
          type="email"
          autoComplete="username"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          placeholder="su.correo@empresa.co"
        />
        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          type="password"
          autoComplete="current-password"
          required
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        {error && (
          <p role="alert" className="error-form">
            {error}
          </p>
        )}
        <button className="primario" disabled={enviando || cargando}>
          {enviando ? "Ingresando…" : "Iniciar sesión"}
        </button>
        <small>
          Acceso exclusivo para el administrador y el gestor de anuncios.
        </small>
      </form>
      <p className="login-pie">Nariño y Valle del Cauca · Colombia</p>
    </div>
  );
}
