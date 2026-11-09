export function Estado({
  error,
  reintentar,
}: {
  error?: Error | null;
  reintentar?: () => void;
}) {
  return (
    <div className="tarjeta estado" role={error ? "alert" : "status"}>
      <p>{error ? error.message : "Cargando información…"}</p>
      {error && reintentar && (
        <button onClick={reintentar}>Volver a intentar</button>
      )}
    </div>
  );
}
