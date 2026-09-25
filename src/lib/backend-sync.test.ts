import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { OPTIONS } from "@/config/questionnaire";

/**
 * Los códigos de opción de la landing DEBEN coincidir con la lista blanca del
 * backend del CRM (agente-tres65/landing_campaign.py). Si no, el backend rechaza
 * el envío. Se salta si el repo del backend no está al lado (p. ej. en CI).
 */
const backendFile = resolve(process.env.BACKEND_DIR ?? resolve(__dirname, "../../../_feat-landing-merida"), "landing_campaign.py");

describe.skipIf(!existsSync(backendFile))("sincronía con el backend del CRM", () => {
  const py = existsSync(backendFile) ? readFileSync(backendFile, "utf8") : "";

  function backendCodes(key: string): string[] {
    const m = new RegExp(`"${key}":\\s*\\{([^}]*)\\}`).exec(py);
    if (!m) return [];
    return [...m[1].matchAll(/"([^"]+)":/g)].map((x) => x[1]);
  }

  for (const [key, options] of Object.entries(OPTIONS)) {
    it(`${key} tiene los mismos códigos`, () => {
      expect(backendCodes(key).sort()).toEqual(options.map((o) => o.value).sort());
    });
  }
});
