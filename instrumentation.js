/**
 * Runs once when the Node.js server starts (dev + production).
 * Eager MongoDB connect so the terminal shows connection status immediately.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { connectDB } = await import('./lib/db.js');
    await connectDB();
  } catch {
    // Errors are already logged in lib/db.js (including hints for Atlas/DNS issues).
  }
}
