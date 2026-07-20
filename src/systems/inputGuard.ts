const BLOCKED_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  " ",
  "Space",
  "Spacebar",
]);

/** Prevent gameplay keys from scrolling the page. */
export function installInputGuard(): () => void {
  const onKeyDown = (event: KeyboardEvent): void => {
    if (BLOCKED_KEYS.has(event.key) || isWasd(event.key)) {
      event.preventDefault();
    }
  };
  window.addEventListener("keydown", onKeyDown, { passive: false });
  return () => window.removeEventListener("keydown", onKeyDown);
}

function isWasd(key: string): boolean {
  const k = key.toLowerCase();
  return k === "w" || k === "a" || k === "s" || k === "d";
}
