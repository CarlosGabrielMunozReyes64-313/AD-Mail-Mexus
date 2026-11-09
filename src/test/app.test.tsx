import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, beforeEach, describe, it, expect } from "vitest";
import { App } from "../App";
import { ProveedorSesion } from "../auth";
import { puede } from "../api";
import type { Rol } from "../api";

const solicitud = {
  id: "uno",
  ocurrido_en: "2026-11-09T15:42:00Z",
  tipo: "Diagnóstico completado",
  empresa: "Lácteos El Mirador SAS",
  municipio: "Pasto",
  origen: "Facebook",
  temperatura: "Caliente",
  estado: "Por contactar",
};
let rol: Rol = "admin";
let autenticado = true;
let llamadas: string[] = [];
const respuesta = (datos: unknown, status = 200) =>
  Promise.resolve(
    new Response(JSON.stringify(datos), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
beforeEach(() => {
  rol = "admin";
  autenticado = true;
  llamadas = [];
  vi.stubGlobal(
    "fetch",
    vi.fn((ruta: string, opciones: RequestInit = {}) => {
      llamadas.push(ruta);
      if (ruta === "/api/auth/me")
        return autenticado
          ? respuesta({
              id: "1",
              nombre: "Administrador",
              correo: "admin@example.test",
              rol,
            })
          : respuesta({ mensaje: "Sin sesión" }, 401);
      if (ruta === "/api/auth/login") {
        autenticado = true;
        return respuesta({
          id: "1",
          nombre: "Administrador",
          correo: "admin@example.test",
          rol,
        });
      }
      if (ruta === "/api/auth/logout") {
        autenticado = false;
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      if (ruta === "/api/pendientes") return respuesta({ cantidad: 3 });
      if (ruta === "/api/solicitudes/resumen")
        return respuesta({
          demo: true,
          fecha: "2026-11-09",
          indicadores: {
            solicitudes: 37,
            registros: 12,
            completados: 9,
            respuestas: 14,
            bajas: 2,
          },
          serie: [
            { fecha: "2026-10-27", cantidad: 17 },
            { fecha: "2026-11-09", cantidad: 37 },
          ],
        });
      if (ruta === "/api/solicitudes/opciones")
        return respuesta({
          tipo: ["Registro", "Diagnóstico completado"],
          origen: ["Facebook", "Google"],
          estado: ["Por contactar"],
        });
      if (ruta.startsWith("/api/solicitudes?"))
        return respuesta({
          items: ruta.includes("origen=Google") ? [] : [solicitud],
          total: ruta.includes("origen=Google") ? 0 : 1,
          pagina: 1,
          tamano: 8,
        });
      if (ruta.startsWith("/api/buscar"))
        return respuesta({ solicitudes: [solicitud], planes: [] });
      throw new Error("Ruta no esperada: " + ruta + " " + opciones.method);
    }),
  );
});
function montar(ruta = "/panel/solicitudes") {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <ProveedorSesion>
          <App />
        </ProveedorSesion>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
describe("Fase 1", () => {
  it("muestra los datos de la API y filtra por origen", async () => {
    montar();
    expect(
      await screen.findByText("Lácteos El Mirador SAS"),
    ).toBeInTheDocument();
    expect(screen.getByText("37")).toBeInTheDocument();
    expect(screen.getByText("Datos de demostración")).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText("Filtrar por origen"),
      "Google",
    );
    expect(
      await screen.findByText("No hay solicitudes con estos filtros"),
    ).toBeInTheDocument();
    expect(llamadas.some((r) => r.includes("origen=Google"))).toBe(true);
  });
  it("oculta agentes y reglas al gestor y bloquea acceso directo", async () => {
    rol = "gestor_anuncios";
    montar("/panel/reglas");
    expect(await screen.findByText("Acceso restringido")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Agentes" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Reglas" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Bandeja de aprobación" }),
    ).toBeInTheDocument();
  });
  it("redirige al login y permite iniciar sesión", async () => {
    autenticado = false;
    montar();
    await screen.findByText("Bienvenido de nuevo");
    await userEvent.type(screen.getByLabelText("Correo"), "admin@example.test");
    await userEvent.type(
      screen.getByLabelText("Contraseña"),
      "clave-de-prueba-123",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    );
    expect(
      await screen.findByText("Solicitudes recibidas"),
    ).toBeInTheDocument();
    const peticion = vi
      .mocked(fetch)
      .mock.calls.find(([ruta]) => ruta === "/api/auth/login");
    expect(peticion?.[1]?.credentials).toBe("same-origin");
    expect(JSON.parse(peticion?.[1]?.body as string).correo).toBe(
      "admin@example.test",
    );
  });
  it("cierra la sesión y vuelve al acceso", async () => {
    montar();
    await screen.findByText("Solicitudes recibidas");
    await userEvent.click(screen.getByLabelText("Cerrar sesión"));
    expect(await screen.findByText("Bienvenido de nuevo")).toBeInTheDocument();
  });
  it("busca empresas desde la barra superior", async () => {
    montar();
    await screen.findByText("Solicitudes recibidas");
    await userEvent.type(
      screen.getByLabelText("Buscar empresas, planes o solicitudes"),
      "Mirador",
    );
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Resultados de búsqueda" }),
      ).toHaveTextContent("Lácteos El Mirador SAS"),
    );
    expect(llamadas.some((r) => r.includes("/buscar?q=Mirador"))).toBe(true);
  });
  it("mantiene la matriz de permisos", () => {
    expect(puede("gestor_anuncios", "bandeja")).toBe(true);
    expect(puede("gestor_anuncios", "agentes")).toBe(false);
    expect(puede("admin", "reglas")).toBe(true);
  });
});
