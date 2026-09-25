#!/usr/bin/env node
/**
 * SOLO DESARROLLO LOCAL: crea cuentas de agente de prueba en el emulador de
 * Firebase Auth (proyecto demo, nunca el real). El arnés del backend
 * (tests/e2e/crm_backend_harness.py) mapea cada correo al agent_uid real.
 * Contraseña de todas: agente-local-123
 */
const AUTH = "http://127.0.0.1:9099";
const PASSWORD = "agente-local-123";
const EMAILS = ["admin@tres65.test", "damara@tres65.test", "guillermo@tres65.test", "moises@tres65.test", "cliente@tres65.test"];

for (const email of EMAILS) {
  const res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
  });
  const data = await res.json();
  if (!res.ok && data?.error?.message !== "EMAIL_EXISTS") throw new Error(JSON.stringify(data));
}
console.log(`Cuentas de prueba listas (${EMAILS.join(", ")}) / ${PASSWORD}`);
