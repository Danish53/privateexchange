/**
 * Opens the browser calendar / time UI for a native date, time, week, month, or datetime-local input.
 * Uses showPicker() when available so a click anywhere on the field (not only the icon) works.
 * @param {HTMLInputElement | null | undefined} input
 */
export function openDateInputPicker(input) {
  if (!input || typeof window === 'undefined') return;
  try {
    input.focus({ preventScroll: true });
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  } catch {
    // Some browsers restrict showPicker; focus still helps.
  }
}
