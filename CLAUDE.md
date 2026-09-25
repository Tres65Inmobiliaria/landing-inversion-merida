@AGENTS.md

# Landing TRES65 — Inversión Mérida

Ver README.md. Reglas del proyecto:

- El cuestionario solo guarda en `campaign_submissions` vía backend (`POST /landing/inversion-merida/submit`).
  Nunca escribir en Firestore del CRM desde el navegador ni abrir reglas. Enviar NO toca Chatwoot/Directorio:
  eso solo ocurre con "Agregar al Directorio" (acción manual autorizada en /admin, server-side).
- No tocar `../WEBSITE`, María ni producción desde aquí. Cambios de backend van en la worktree
  `../_feat-landing-merida` (rama `feat/landing-inversion-merida`) y no se despliegan sin aprobación.
- Códigos de opción: `src/config/questionnaire.ts` y `agente-tres65/landing_campaign.py` deben coincidir
  (`src/lib/backend-sync.test.ts`).
- Los estados de la respuesta (nuevo/revisado/contactado/descartado/agregado_directorio) son solo del panel;
  nunca cambian estados del CRM.
- Nunca emojis en la UI; iconos de `lucide-react`.
- Next dev bloquea `127.0.0.1` como origen: usar `localhost:3065`.
