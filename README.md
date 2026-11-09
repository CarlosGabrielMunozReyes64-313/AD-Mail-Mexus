# AD mail nexus manager — frontend, fase 1

React + TypeScript + Vite, con React Compiler, React Router, TanStack Query,
Tailwind CSS, Recharts y tipografía Inter local. Las versiones se fijan en
`package-lock.json`. La pantalla implementada es **Solicitudes recibidas (01)**,
con la barra lateral y superior, inicio/cierre de sesión, filtros, búsqueda,
paginación, detalle de solicitud y estados de carga, error y lista vacía.

## Instalar y ejecutar

Requiere Node.js **22.12+ o 24**. Primero prepare y arranque el backend siguiendo
el README de `AD-Mail-Nexus-Backend-main`; el frontend no incluye contraseñas ni
un servidor simulado en la entrega.

```bash
npm ci
cp .env.example .env
npm run dev
```

Abra **http://localhost:5173/panel/login**. Ingrese con el usuario que creó en el
backend. Vite reenvía `/api` a `http://127.0.0.1:8000`; toda la información de la
pantalla proviene de esa API, incluidos los indicadores y el contador superior.

## Probar y compilar

```bash
npm test
npm run build
```

Resultado verificado: **6 pruebas aprobadas** y compilación TypeScript/Vite
correcta. Las pruebas cubren visualización de datos, filtros, acceso por rol,
inicio y cierre de sesión, búsqueda y matriz de permisos. Las pruebas de
componentes usan respuestas HTTP controladas; las pruebas PostgreSQL y de
autenticación real están en el backend.

Se revisó visualmente el login y la pantalla 01 con datos ficticios en un montaje
aislado; la integración completa de inicio de sesión se comprobó mediante
pruebas, no mediante un login completo en navegador. No se incluyó ese montaje
visual temporal en los archivos entregados.

`npm run build` genera `dist/`. Para producción, sirva ese directorio con fallback
SPA a `index.html` y un reverse proxy `/api` hacia FastAPI, bajo el **mismo origen**.
`npm run preview` por sí solo no sustituye ese proxy de producción.

## Rutas

| Ruta | Estado |
|---|---|
| `/panel/login` | Inicio de sesión funcional |
| `/panel/solicitudes` | Pantalla 01 funcional |
| `/panel/bandeja` | Aviso de implementación en fase 3 |
| `/panel/agentes` | Aviso de fase 5; solo admin |
| `/panel/graficas` | Aviso de fase 5 |
| `/panel/reglas` | Aviso de fase 5; solo admin |
| `/` | Redirige al panel durante esta fase; página pública en fase 6 |

El gestor no ve Agentes ni Reglas y sus rutas están bloqueadas. El backend tiene
su propio control de permisos; ocultar enlaces no se usa como única protección.
La creación de cuentas y los resultados del cliente pertenecen a NEXUS 360° y
no se construyeron aquí.

## Variables

| Variable | Propósito |
|---|---|
| `VITE_NOMBRE_PRODUCTO` | Nombre interno; AD mail nexus manager por defecto |
| `VITE_MARCA_PUBLICA` | Marca independiente reservada para fase 6 |
| `VITE_NEXUS_REGISTRO_URL` | Registro externo; se usará en fase 6 |
| `VITE_WHATSAPP_NUMERO` | Número público; se usará en fase 6 |
| `API_PROXY_TARGET` | Solo desarrollo: destino del proxy `/api` |

Nunca ponga claves privadas en variables `VITE_*`: forman parte del código que
recibe el navegador. La sesión se guarda en cookie HttpOnly del backend.

## Decisiones y archivos nuevos

El repositorio original solo contenía el README. Se añadieron `package.json`,
`package-lock.json`, `tsconfig.json`, `vite.config.ts` e `index.html` para crear la
plantilla ejecutable. `src/main.tsx` y `src/App.tsx` inicializan proveedores y rutas;
`src/api.ts` centraliza las peticiones y tipos; `src/auth.tsx` gestiona la sesión;
`components/` contiene el marco visual y estados reutilizables; `pages/` contiene
login y solicitudes; `styles.css` define los tokens y ajustes responsive; `test/`
verifica los flujos de la fase. `.env.example` documenta variables y `.gitignore`
excluye secretos y archivos generados.

Se mantuvieron la distribución, el morado de IA, el coral de acciones humanas,
las temperaturas y los textos del mockup. La tabla ancha se desplaza dentro de su
tarjeta. Se añadieron fecha, paginación y detalle accesible para hacer operativa
la pantalla. Las métricas demo reproducen los totales del mockup; las ocho filas
se identifican como muestra y no como las 37 solicitudes completas.

La búsqueda de planes, la bandeja, React Flow, los agentes, reglas y gráficas de
análisis se implementarán en sus fases correspondientes. No hay envíos reales,
servicios de terceros ni cambios en NEXUS 360° en esta entrega.
