"use client";

import { useEffect } from "react";

/** iOS Safari only applies `:active` styles once a touch listener exists on the page. */
export function TouchFeedback() {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener("touchstart", noop, { passive: true });
    return () => document.removeEventListener("touchstart", noop);
  }, []);
  return null;
}
