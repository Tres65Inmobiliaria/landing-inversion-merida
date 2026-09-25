@AGENTS.md

# Landing TRES65 — Inversión Mérida

Ver README.md para arquitectura, seguridad y configuración. Reglas del proyecto:

- Proyecto aislado. No importar ni tocar nada de `../WEBSITE`, `../agente-tres65` ni producción de TRES65.
- Toda protección de datos vive en `firestore.rules`. Si agregas un campo al prospecto, actualiza
  `prospectKeys()` en las reglas, `buildProspectPayload`, el tipo `Prospect`, la ficha admin, el CSV
  y corre `npm run test:rules`.
- Opciones/labels del cuestionario solo en `src/config/questionnaire.ts` (en Firestore se guardan códigos).
- Nunca emojis en la UI; iconos de `lucide-react`.
- Emuladores: Firestore en el puerto 8181 (el 8080 está ocupado en esta máquina). Next dev bloquea
  `127.0.0.1` como origen: usar `localhost:3065`.
