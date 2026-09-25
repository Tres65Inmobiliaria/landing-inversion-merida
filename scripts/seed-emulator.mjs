#!/usr/bin/env node
/**
 * SOLO PARA DESARROLLO LOCAL: crea un admin de prueba en los emuladores.
 * No toca ningún proyecto real (usa el proyecto demo "demo-tres65-landing").
 *
 *   npm run emulators          # en otra terminal
 *   npm run seed:emulator
 *
 * Usuario: admin@tres65.test / contraseña: admin-local-123
 */
const PROJECT = "demo-tres65-landing";
const AUTH = "http://127.0.0.1:9099";
const FS = "http://127.0.0.1:8181";
const EMAIL = "admin@tres65.test";
const PASSWORD = "admin-local-123";

async function main() {
  let res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
  });
  let data = await res.json();
  if (!res.ok && data?.error?.message === "EMAIL_EXISTS") {
    res = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    });
    data = await res.json();
  }
  if (!res.ok) throw new Error(JSON.stringify(data));
  const uid = data.localId;

  // "Bearer owner" salta las reglas, solo existe en el emulador.
  const put = await fetch(`${FS}/v1/projects/${PROJECT}/databases/(default)/documents/admins/${uid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({ fields: { email: { stringValue: EMAIL }, role: { stringValue: "admin" } } }),
  });
  if (!put.ok) throw new Error(await put.text());

  // Un usuario autenticado que NO es admin, para probar el rechazo.
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "no-admin@tres65.test", password: PASSWORD, returnSecureToken: true }),
  });

  console.log(`Admin de prueba listo: ${EMAIL} / ${PASSWORD} (uid ${uid})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
