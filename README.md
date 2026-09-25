# TRES65 · Landing "Diversifica tu patrimonio en Mérida"

Landing + cuestionario de prospectos + panel `/admin` para la campaña dirigida a
médicos/profesionales interesados en invertir en bienes raíces en Mérida.

Proyecto **aislado**: no comparte código, base de datos ni despliegue con María,
Chatwoot, el Directorio, el portal ni el CRM de TRES65.

## Stack

- Next.js 16 (App Router) con `output: "export"` → sitio 100% estático (carpeta `out/`)
- TypeScript + Tailwind CSS 4
- Firebase Authentication (email/contraseña, solo admins) + Cloud Firestore
- Vitest (unitarias + reglas de Firestore en emulador) · Playwright (smoke E2E)
- Hosting: GitHub Pages vía GitHub Actions (`.github/workflows/deploy.yml`)

## Estructura

```
src/
  app/
    page.tsx                  Landing (hero, nosotros, Mérida, por qué TRES65, proceso, cuestionario)
    admin/page.tsx            Panel (login + dashboard), noindex
    aviso-de-privacidad/      Aviso de Privacidad oficial de TRES65 (aviso.json)
  components/
    landing/                  Secciones de la landing
    questionnaire/            Formulario multi-step, campos accesibles, pantalla de gracias
    admin/                    Login, dashboard, ficha del prospecto
  config/
    site.ts                   Contacto de Damara, valores por defecto de campaña
    questionnaire.ts          Opciones, rangos de presupuesto, estados, pasos  ← editar aquí
  lib/
    validation.ts             Validación por paso, email, teléfono
    prospects.ts              Construcción del documento y acceso a Firestore
    attribution.ts            Captura de UTMs y referrer
    csv.ts                    Exportación CSV (con protección contra CSV injection)
firestore.rules               Reglas de seguridad (la protección real de los datos)
tests/rules/                  Pruebas de las reglas contra el emulador
tests/e2e/smoke.py            Recorrido completo landing → admin contra emuladores
scripts/seed-emulator.mjs     Crea un admin de prueba SOLO en el emulador
```

## Modelo de datos — `prospects/{id}`

Campos planos con códigos estables (las etiquetas viven en `src/config/questionnaire.ts`),
pensados para conectarse más adelante al Directorio/CRM:

`id, schemaVersion, createdAt, updatedAt, fullName, email, phone (+52…),
diversificationInterest, previousRealEstateInvestment, previousInvestmentTypes[],
previousInvestmentTypeOther, previousInvestmentLocation, investmentBudget, purchaseMethod,
financingInterest, investmentTimeline, decisionMakers[], decisionMakersOther,
investmentPurposes[], investmentPurposeOther, personalUse, meridaExperience,
meridaMarketKnowledge, preferredArea, openToRecommendations, eventInterest,
privacyConsent, privacyConsentAt, source, campaign, assignedAgent, status,
utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, landingUrl`

Solo admin: `internalNotes[] {text, author, createdAt}`, `statusUpdatedAt`, `statusUpdatedBy`.

Por defecto: `source="landing"`, `campaign="medicos_merida"`,
`assignedAgent="Damara Traconis"`, `status="nuevo"`.

## Seguridad

- **Público:** solo puede *crear* un prospecto. Las reglas validan cada campo (lista exacta
  de campos, tipos, longitudes, formato de email/teléfono, `status == "nuevo"`,
  consentimiento `true`, fechas = hora del servidor). No puede leer, listar, editar ni borrar.
- **Admin:** usuario de Firebase Auth cuyo UID existe en `admins/{uid}`. Esa colección no se
  puede escribir desde la web; se administra en la consola. Un usuario autenticado que no
  esté ahí no ve nada (probado).
- **Admin puede** leer y cambiar solo `status` y notas internas. Nadie borra desde la web.
- No hay registro público ni contraseñas en el código.
- Honeypot anti-spam (campo oculto `website`; si viene lleno no se guarda nada, y las reglas
  rechazan cualquier campo extra).
- El formulario no se puede enviar antes de que cargue el JavaScript (evita que datos
  personales terminen en la URL).
- CSV: las celdas que empiezan con `= + - @` se neutralizan.

## Desarrollo local (sin tocar ningún proyecto real)

Requiere Node 20+, Java 21 (para los emuladores) y `firebase-tools`.

```bash
npm install
npm run emulators          # terminal 1: Auth + Firestore locales (puertos 9099 y 8181)
npm run seed:emulator      # crea admin@tres65.test / admin-local-123 en el emulador
npm run dev:emulator       # terminal 2: http://localhost:3065  y  /admin/
```

Pruebas:

```bash
npm run lint && npm run typecheck
npm test                   # unitarias
npm run test:rules         # reglas de Firestore (levanta el emulador solo)
python3 tests/e2e/smoke.py # E2E (con emuladores + dev:emulator corriendo)
npm run build              # genera out/
```

## Configuración de Firebase (una sola vez)

1. Crear un proyecto **nuevo** en https://console.firebase.google.com (p. ej. `tres65-landing-inversion`).
   No reutilizar el proyecto del portal/CRM.
2. **Firestore Database** → Crear base de datos (modo producción, región `nam5` o `us-central1`).
3. **Authentication** → Comenzar → habilitar *Correo electrónico/contraseña*.
   - Settings → *User actions* → desmarcar **Enable create (sign-up)** (nadie puede registrarse).
   - Settings → activar **Email enumeration protection**.
   - Settings → *Authorized domains* → agregar el dominio donde se publique (p. ej. `<usuario>.github.io`).
4. **Crear los admins:** Authentication → Users → *Add user* (correo + contraseña segura).
   Copiar su **UID**. Luego Firestore → *Iniciar colección* `admins` → ID del documento = ese UID,
   campo `email` (string). Repetir para cada persona con acceso.
5. **App web:** Configuración del proyecto → Tus apps → `</>` → registrar → copiar la config a
   `.env.local` (ver `.env.example`).
6. **Publicar reglas** (desde esta carpeta):
   ```bash
   firebase login
   firebase deploy --only firestore:rules,firestore:indexes --project <ID_DEL_PROYECTO>
   ```
7. Recomendado: en Google Cloud Console → APIs y servicios → Credenciales, restringir la API key
   por *HTTP referrer* al dominio del sitio.

## Publicar en GitHub Pages

1. Crear el repositorio en GitHub y hacer push de `main`.
2. Settings → Pages → *Source*: **GitHub Actions**.
3. Settings → Secrets and variables → Actions → **Variables**: crear las
   `NEXT_PUBLIC_FIREBASE_*` y, si la URL es `https://<usuario>.github.io/<repo>/`,
   `NEXT_PUBLIC_BASE_PATH=/<repo>`.
4. Cada push a `main` corre pruebas y publica.

## Cambios frecuentes

- **Rangos de presupuesto, opciones, estados:** `src/config/questionnaire.ts`.
- **Datos de Damara / campaña:** `src/config/site.ts`.
- **Aviso de Privacidad:** `src/app/aviso-de-privacidad/aviso.json`.
