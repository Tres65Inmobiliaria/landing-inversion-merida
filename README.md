# TRES65 · Landing "Diversifica tu patrimonio en Mérida"

Landing + cuestionario de prospectos + panel `/admin` para la campaña `medicos_merida`
(médicos/profesionales interesados en invertir en bienes raíces en Mérida).

Las respuestas se guardan en el Firestore **existente** de TRES65 (`campaign_submissions`) a través
del backend del CRM. Responder el cuestionario **no** crea ni modifica nada en Chatwoot, el Directorio,
clientes ni María. Pasar a alguien al Directorio es una acción **manual** desde `/admin`.

## Arquitectura

```
Landing (este repo, sitio estático)
  └─ POST /landing/inversion-merida/submit ─→ backend CRM (agente-tres65)
                                                └─ valida (lista blanca) y guarda en campaign_submissions (status "nuevo")
/admin (este repo) ─ login con cuentas de agente (Firebase tres65-perfilcliente)
  ├─ GET  /portal/landing/inversion-merida/submissions          (Admin, Moisés, Damara)
  ├─ POST .../<id>/estado        estado propio de la respuesta (no toca el CRM)
  └─ POST .../<id>/directorio    "Agregar al Directorio":
                                   busca por teléfono/correo en clients, directorio_manual y Chatwoot (solo lectura)
                                   ├─ ya existe → se vincula sin cambiarle nada
                                   └─ no existe → alta real del Directorio (directorio_manual) asignada a Damara
                                                  + nota libre del Directorio con el resumen
```

- Next.js 16 (`output: "export"`), TypeScript, Tailwind 4 — hosting estático (GitHub Pages).
- El navegador **no** lee ni escribe Firestore. Firebase aquí es solo Auth para `/admin`.
- Backend: `agente-tres65/landing_campaign.py` + bloque "LANDING INVERSIÓN MÉRIDA" de `main.py`
  (rama `feat/landing-inversion-merida`). Ver su `CLAUDE.md`.

## Estructura

```
src/
  app/page.tsx                Landing
  app/admin/page.tsx          Panel (noindex)
  app/aviso-de-privacidad/    Aviso de Privacidad oficial de TRES65
  components/questionnaire/   Formulario multi-step (7 pasos)
  components/admin/           Login, dashboard, ficha
  config/questionnaire.ts     Opciones (códigos = lista blanca del backend), estados del CRM
  config/site.ts              Datos de Damara
  lib/crm.ts                  Cliente del backend del CRM (envío + panel)
  lib/validation.ts           Validación por paso, email, teléfono
  lib/attribution.ts          UTMs y referrer
  lib/csv.ts                  Exportación CSV (con protección contra CSV injection)
tests/e2e/                    E2E + arnés que corre el backend real con Chatwoot/Firestore falsos
```

## "Agregar al Directorio"

| Situación en TRES65 (teléfono últimos 10 dígitos o correo) | Qué hace |
|---|---|
| No existe | Alta en `directorio_manual` (mismo mecanismo que "+ Agregar manual"): asignada a Damara, estado "Cliente potencial", `origin: medicos_merida`, nota libre del Directorio con el resumen |
| Cliente con portal | Se vincula (abre su ficha). Nada cambia |
| Contacto manual del Directorio | Se vincula. Nada cambia |
| Lead de Chatwoot con etapa del Directorio | Se vincula (sin reasignar, sin labels, sin notas) |
| Contacto de Chatwoot sin etapa | Se vincula como "Existe en Chatwoot"; no se crea otra entrada |
| Chatwoot no responde | No se crea nada; se puede reintentar |

Nunca crea conversación en Chatwoot, portal, `cliente-creado`, ni entra a la reasignación automática de 24 h.
Es idempotente (doble clic no duplica).

## Estados de la respuesta (solo del panel)

Nuevo · Revisado · Contactado · Descartado · Agregado al Directorio (lo pone la acción). No cambian el CRM.

## Seguridad

- Endpoint público con lista blanca de campos y códigos, honeypot, rate limit (Redis) e idempotencia.
- `campaign_submissions` solo se escribe/lee con Admin SDK; las reglas de Firestore del CRM **no se modificaron**.
- Panel y "Agregar al Directorio": solo Admin, Moisés y Damara (verificado en el backend). Otros agentes: 403.

## Desarrollo local (sin tocar producción)

Requiere Node 20+, Python 3 con las dependencias de `agente-tres65/requirements-dev.txt`,
Java 21 y `firebase-tools` (emulador de Auth), y la worktree del backend en `../_feat-landing-merida`.

```bash
npm install
npm run emulators       # terminal 1: emulador de Auth
npm run seed:emulator   # cuentas: admin@ / damara@ / guillermo@ / moises@ / cliente@tres65.test (agente-local-123)
npm run backend:local   # terminal 2: backend REAL con Chatwoot/Firestore/Redis falsos en :5065
npm run dev:emulator    # terminal 3: http://localhost:3065  y  /admin/
python3 tests/e2e/smoke.py
```

Pruebas rápidas: `npm run lint && npm run typecheck && npm test && npm run build`.

## Publicar

1. **Backend primero:** revisar y desplegar la rama `feat/landing-inversion-merida` de `agente-tres65`.
   Sin eso, el envío del cuestionario falla.
2. Crear el repositorio en GitHub, Settings → Pages → Source: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → **Variables**: `NEXT_PUBLIC_CRM_API_URL`,
   `NEXT_PUBLIC_FIREBASE_*` (valores públicos de `WEBSITE/firebase-sync.js`), `NEXT_PUBLIC_CRM_WEB_URL`,
   y `NEXT_PUBLIC_BASE_PATH=/<repo>` si se publica en `usuario.github.io/<repo>/`.
4. Si la API key de Firebase tiene restricción por HTTP referrer, agregar el dominio de la landing.

## Cambios frecuentes

- **Textos de opciones:** `src/config/questionnaire.ts` (label libre).
- **Agregar/cambiar un código de opción o rango:** en `src/config/questionnaire.ts` **y** en
  `agente-tres65/landing_campaign.py` (la prueba `backend-sync.test.ts` avisa si no coinciden).
- **Aviso de Privacidad:** `src/app/aviso-de-privacidad/aviso.json`.
