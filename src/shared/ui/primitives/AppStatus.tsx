import { useState } from "react";

export default function AppStatus() {
  const [ready, setReady] = useState(false);

  return (
    <div className="rounded-xl bg-emerald-50 p-4">
      <p className="text-sm text-emerald-900">
        Estado de isla React: <strong>{ready ? "activo" : "inactivo"}</strong>
      </p>
      <button
        type="button"
        onClick={() => setReady((value) => !value)}
        className="mt-3 rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:brightness-95"
      >
        Alternar estado
      </button>
    </div>
  );
}
