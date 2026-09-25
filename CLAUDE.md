@AGENTS.md

# Landing TRES65 — Inversión Mérida

Ver README.md. Reglas del proyecto:

- Los prospectos entran al CRM de TRES65 SOLO por el backend (`POST /landing/inversion-merida/submit` en
  agente-tres65). Nunca escribir en Firestore del CRM desde el navegador ni abrir reglas de Firestore.
- No tocar `../WEBSITE`, María ni producción desde aquí. Cambios de backend van en la worktree
  `../_feat-landing-merida` (rama `feat/landing-inversion-merida`) y no se despliegan sin aprobación.
- Códigos de opción: `src/config/questionnaire.ts` y `agente-tres65/landing_campaign.py` deben coincidir
  (`src/lib/backend-sync.test.ts`).
- Estado/asignación del prospecto = los del CRM (Directorio). No crear estados paralelos en la landing.
- Nunca emojis en la UI; iconos de `lucide-react`.
- Next dev bloquea `127.0.0.1` como origen: usar `localhost:3065`.
