"use client";

import { useState } from "react";

export function PrintButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function print() {
    setBusy(true); setError("");
    try {
      await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>("[data-print-card] img")).map(image => image.decode()));
      window.print();
    } catch { setError("Uma imagem não carregou. Recarrega a página antes de imprimir."); }
    finally { setBusy(false); }
  }
  return <div data-print-hidden><button className="button" type="button" disabled={busy} onClick={print}>{busy ? "A preparar imagens…" : "Imprimir ou guardar PDF"}</button>{error && <p role="alert">{error}</p>}</div>;
}
