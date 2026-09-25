# TRES65 · Landing "Diversifica tu patrimonio en Mérida"

Landing + cuestionario de prospectos + panel `/admin` para la campaña `medicos_merida`
(médicos/profesionales interesados en invertir en bienes raíces en Mérida).

**Los prospectos entran directo al CRM de TRES65** (mismos contactos que Leads, Directorio,
Chatwoot y María). No hay base de datos separada ni migraciones futuras.

## Arquitectura

```
Landing (este repo, sitio estático)
  └─ POST /landing/inversion-merida/submit ─→ backend CRM (agente-tres65, Railway)
                                                ├─ valida (lista blanca), deduplica
                                                ├─ contacto nuevo → lead en Chatwoot, listo-para-asesor, asignado a Damara
                                                ├─ contacto existente → solo se agrega la nota (no se reasigna ni cambia su estado)
                                                └─ respuestas completas → Firestore campaign_submissions (solo backend)
/admin (este repo) ─ login con cuentas de agente (Firebase tres65-perfilcliente)
  └─ GET /portal/landing/inversion-merida/submissions ─→ estado y asesor EN VIVO del CRM,
                                                          con las reglas de visibilidad del Directorio
```

- Next.js 16 (`output: "export"`), TypeScript, Tailwind 4 — hosting estático (GitHub Pages).
- El navegador **no** lee ni escribe Firestore. Firebase aquí es solo Auth para `/admin`.
- Lógica del backend: `agente-tres65/landing_campaign.py` + bloque "LANDING INVERSIÓN MÉRIDA" de `main.py`
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

## Qué pasa al enviar el cuestionario

| Situación en el CRM | Qué hace el backend |
|---|---|
| Nadie con ese teléfono (últimos 10 dígitos) ni correo | Lead nuevo en Chatwoot, label `listo-para-asesor`, asignado a Damara, nota privada con resumen |
| Lead/conversación existente con agente | Nota privada con el resumen. **No** se reasigna ni se cambian labels |
| Conversación existente sin agente ni etapa | Se asigna a Damara y entra como `listo-para-asesor` |
| Cliente con portal (`clients`) | Se agrega una tarea con el resumen a su ficha. Nada más |
| Contacto manual del Directorio | Se conserva; la respuesta queda ligada a él |
| Chatwoot no responde | No se crea nada a ciegas: queda "Pendiente de vincular" (Admin reintenta desde `/admin`) |

Nunca crea portal ni pone `cliente-creado`. Los campos `assignee_uid`, `status`, labels, portal, roles, etc.
se ignoran si vienen del navegador.

## Seguridad

- Endpoint público con lista blanca de campos y códigos, honeypot, rate limit (Redis),
  idempotencia (`submissionId`) y candado por teléfono.
- `campaign_submissions` solo se escribe/lee con Admin SDK; las reglas de Firestore del CRM **no se modificaron**
  (esa colección queda cerrada al navegador por defecto).
- Panel: Admin y Moisés ven toda la campaña; cualquier otro agente solo los contactos que hoy son suyos
  (mismas reglas del Directorio). Cuentas sin rol de agente no ven nada.
- Notas del panel se guardan en el contacto real (nota privada de Chatwoot o tarea de la ficha).

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

1. **Backend primero:** revisar y desplegar la rama `feat/landing-inversion-merida` de `agente-tres65`
   (ver checklist en el reporte de integración). Sin eso, el envío del cuestionario falla.
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
