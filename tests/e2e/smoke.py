"""
E2E landing → backend REAL del CRM (con Firestore/Chatwoot/Redis falsos) → /admin
("Agregar al Directorio" manual).
Nunca toca producción.

Requisitos (cuatro terminales):
  npm run emulators          # Auth emulator (cuentas de agente de prueba)
  npm run seed:emulator
  npm run backend:local      # main.py real de agente-tres65 en :5065 (arnés)
  npm run dev:emulator       # landing en http://localhost:3065

  python3 tests/e2e/smoke.py [carpeta_para_capturas]
"""
import json
import re
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = "http://localhost:3065"
API = "http://localhost:5065"
SHOTS = Path(sys.argv[1] if len(sys.argv) > 1 else "test-results")
SHOTS.mkdir(parents=True, exist_ok=True)
DAMARA_CW, GUILLERMO_CW = 6, 7
PASSWORD = "agente-local-123"


def api(path, method="GET", body=None, headers=None):
    req = urllib.request.Request(API + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json", **(headers or {})})
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def state():
    return api("/__e2e/state")[1]


def shot(page, name, full=False):
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=full)


def pick(page, group, text):
    page.locator(f"#{group}").get_by_text(text, exact=True).click()


def cont(page):
    page.get_by_role("button", name="Continuar").click()


def fill_questionnaire(page, name, email, phone, utm=""):
    page.goto(f"{BASE}/{utm}")
    page.get_by_role("link", name="Responder cuestionario").click()
    expect(page.get_by_role("button", name="Continuar")).to_be_enabled(timeout=20000)
    page.get_by_label("Nombre completo").fill(name)
    page.get_by_label("Correo electrónico").fill(email)
    page.get_by_label("Teléfono / WhatsApp").fill(phone)
    cont(page)
    pick(page, "diversificationInterest", "Sí, me interesa")
    pick(page, "previousRealEstateInvestment", "Sí")
    pick(page, "previousInvestmentTypes", "Departamento")
    page.get_by_label("¿En qué ciudad o zona?").fill("Mérida norte")
    cont(page)
    pick(page, "investmentBudget", "$3 – 5 M MXN")
    pick(page, "purchaseMethod", "Liquidez propia")
    pick(page, "financingInterest", "Tal vez, quiero más información")
    cont(page)
    pick(page, "investmentTimeline", "Entre 3 y 6 meses")
    pick(page, "decisionMakers", "Con mi pareja")
    cont(page)
    pick(page, "investmentPurposes", "Ingreso por renta")
    pick(page, "investmentPurposes", "Herencia / patrimonio familiar")
    pick(page, "personalUse", "Tal vez")
    cont(page)
    pick(page, "meridaExperience", "Vivo en Mérida o sus alrededores")
    pick(page, "meridaMarketKnowledge", "He escuchado algo")
    page.get_by_label("Estoy abierto/a a recomendaciones", exact=False).check()
    cont(page)
    pick(page, "eventInterest", "Sí, me interesa asistir")
    page.get_by_label("Autorizo a TRES65 Inmobiliaria", exact=False).check()
    page.get_by_role("button", name="Enviar respuestas").click()
    expect(page.get_by_role("heading", name=f"Gracias, {name.split()[0]}")).to_be_visible(timeout=15000)


def login(page, email):
    page.goto(f"{BASE}/admin/")
    page.get_by_label("Correo").fill(email)
    page.get_by_label("Contraseña").fill(PASSWORD)
    page.get_by_role("button", name="Entrar").click()


def table_rows(page):
    page.wait_for_timeout(300)
    return page.locator("table tbody tr").all_inner_texts()


api("/__e2e/reset", "POST")
errors = []

with sync_playwright() as p:
    browser = p.chromium.launch()
    phone_ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)

    # 1-3. Envíos: solo se guardan, NADA toca el CRM
    page = phone_ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    fill_questionnaire(page, "Ana López Pérez", "ana@example.com", "999 123 4567",
                       "?utm_source=whatsapp&utm_medium=mensaje&utm_campaign=medicos_sept")
    page.wait_for_timeout(1200)
    shot(page, "01-gracias")
    fill_questionnaire(phone_ctx.new_page(), "Ana López Pérez", "ana.otro@example.com", "+52 1 999 123 4567")
    fill_questionnaire(phone_ctx.new_page(), "Beto Ruiz Díaz", "beto@example.com", "999 777 6655")
    s = state()
    assert len(s["submissions"]) == 3, s["submissions"].keys()
    assert all(v["status"] == "nuevo" and v["directory"] is None for v in s["submissions"].values())
    ana1 = next(v for v in s["submissions"].values() if v["email"] == "ana@example.com")
    assert ana1["utm_source"] == "whatsapp" and ana1["campaign"] == "medicos_merida" and ana1["phone"] == "5219991234567"
    assert s["chatwoot_calls"] == 0 and s["directorio_manual"] == {} and s["directorio_tipo"] == {}
    print("OK  1-3 envíos guardados en campaign_submissions (nuevo), cero llamadas a Chatwoot, Directorio intacto")

    # 4. Formulario manipulado + público intentando agregar al Directorio
    manip = page.evaluate("""async (api) => {
      const r = await fetch(api + '/landing/inversion-merida/submit', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({submissionId: 'manipulado-0000000000', fullName: 'Hack Er Test', email: 'hack@example.com', phone: '9995550000',
          diversificationInterest: 'si', previousRealEstateInvestment: 'no', investmentBudget: 'mas_8m', purchaseMethod: 'liquidez',
          financingInterest: 'no', investmentTimeline: '0_3m', decisionMakers: ['solo'], investmentPurposes: ['renta'], personalUse: 'inversion',
          meridaExperience: 'conozco', meridaMarketKnowledge: 'poco', openToRecommendations: true, eventInterest: 'no', privacyConsent: true,
          status: 'agregado_directorio', directory: {state: 'created'}, assignee_uid: '5219992413657', labels: ['cliente-creado'],
          portal_creado: true, admin: true})});
      const agregar = await fetch(api + '/portal/landing/inversion-merida/submissions/manipulado-0000000000/directorio', {method: 'POST'});
      const leer = await fetch(api + '/portal/landing/inversion-merida/submissions');
      const dir = await fetch(api + '/portal/directorio/agregar', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: 'x', phone: '9990000000'})});
      return {submit: r.status, agregar: agregar.status, leer: leer.status, dir: dir.status};
    }""", API)
    assert manip == {"submit": 200, "agregar": 401, "leer": 401, "dir": 401}, manip
    s = state()
    h = s["submissions"]["manipulado-0000000000"]
    assert h["status"] == "nuevo" and h["directory"] is None
    assert not any(k in h for k in ("assignee_uid", "labels", "portal_creado", "admin"))
    assert s["chatwoot_calls"] == 0 and s["directorio_manual"] == {}
    print("OK  4 campos manipulados ignorados; el público no puede agregar ni leer")

    desk = browser.new_context(viewport={"width": 1440, "height": 900})

    # 5. Damara ve todas las respuestas de su campaña, ninguna agregada
    dam = desk.new_page()
    dam.on("pageerror", lambda e: errors.append(str(e)))
    login(dam, "damara@tres65.test")
    expect(dam.get_by_role("heading", name="Respuestas")).to_be_visible(timeout=15000)
    rows = table_rows(dam)
    assert len(rows) == 4 and all("No agregado" in r and "Nuevo" in r for r in rows), rows
    shot(dam, "02-panel-inicial")

    # 6. Agregar al Directorio (persona nueva) desde la tabla
    fila_ana = dam.locator("table tbody tr", has_text="ana@example.com")
    fila_ana.get_by_role("button", name="Agregar al Directorio").click()
    expect(fila_ana.get_by_text("En Directorio", exact=True)).to_be_visible(timeout=10000)
    link = fila_ana.get_by_role("link", name="Abrir en Directorio")
    assert link.get_attribute("href").endswith("/agente-home.html")
    expect(fila_ana.get_by_text("Agregado al Directorio")).to_be_visible()
    s = state()
    [(manual_id, entry)] = s["directorio_manual"].items()
    assert entry["assignee_uid"] == "5219992786153" and entry["status"] == "Cliente potencial"
    assert entry["phone"] == "5219991234567" and entry["origin"] == "medicos_merida"
    assert "Presupuesto: $3 – 5 M MXN" in s["directorio_tipo"]["9991234567"]["notes"]
    sub = next(v for v in s["submissions"].values() if v["email"] == "ana@example.com")
    assert sub["status"] == "agregado_directorio" and sub["directory"]["manual_id"] == manual_id and sub["directory"]["converted_at"]
    assert s["chatwoot_writes"] == 0
    print("OK  6 persona nueva → alta real en el Directorio asignada a Damara, con resumen; sin escribir en Chatwoot")

    # 7. Segunda respuesta de Ana (mismo teléfono) → ya existe, no duplica
    dam.locator("table tbody tr", has_text="ana.otro@example.com").get_by_role("button", name=re.compile("Ana")).click()
    dialog = dam.get_by_role("dialog")
    dialog.get_by_role("button", name="Agregar al Directorio").click()
    expect(dialog.get_by_text("Este contacto ya existe en el Directorio", exact=False)).to_be_visible(timeout=10000)
    expect(dialog.get_by_role("link", name="Abrir en Directorio")).to_be_visible()
    shot(dam, "03-ya-existe")
    dam.keyboard.press("Escape")
    assert len(state()["directorio_manual"]) == 1
    print("OK  7 misma persona → 'ya existe', vinculada sin duplicar")

    # 8. Beto ya existía en TRES65 como lead de Guillermo → se vincula sin tocarlo
    before = state()
    beto_conv = next(c for c in before["convs"] if c["meta"]["sender"]["phone_number"].endswith("9997776655"))
    fila_beto = dam.locator("table tbody tr", has_text="beto@example.com")
    fila_beto.get_by_role("button", name="Agregar al Directorio").click()
    expect(fila_beto.get_by_text("En Directorio", exact=True)).to_be_visible(timeout=10000)
    s = state()
    beto_after = next(c for c in s["convs"] if c["id"] == beto_conv["id"])
    assert beto_after == beto_conv and s["assignments"] == [] and s["chatwoot_writes"] == 0
    assert len(s["directorio_manual"]) == 1
    bsub = next(v for v in s["submissions"].values() if v["email"] == "beto@example.com")
    assert bsub["directory"]["state"] == "existing" and bsub["directory"]["owner_uid"] == "5219992413657"
    print("OK  8 contacto existente de Guillermo → vinculado; agente, labels y notas intactos")

    # 9. Estado propio: Descartado
    dam.locator("table tbody tr", has_text="hack@example.com").get_by_role("button", name=re.compile("Hack")).click()
    dialog = dam.get_by_role("dialog")
    dialog.get_by_label("Estado de respuesta").select_option("descartado")
    dialog.get_by_role("button", name="Guardar estado").click()
    expect(dialog.get_by_text("Estado actualizado.")).to_be_visible()
    shot(dam, "04-ficha")
    dam.keyboard.press("Escape")
    assert state()["submissions"]["manipulado-0000000000"]["status"] == "descartado"
    print("OK  9 estado propio de la respuesta, sin tocar el CRM")

    # 10. Filtros + CSV
    dam.get_by_label("Directorio", exact=True).select_option("si")
    assert len(table_rows(dam)) == 3
    dam.get_by_label("Directorio", exact=True).select_option("no")
    rows = table_rows(dam)
    assert len(rows) == 1 and "hack@example.com" in rows[0]
    dam.get_by_role("button", name="Limpiar filtros").click()
    dam.get_by_label("Estado", exact=True).select_option("nuevo")
    assert len(table_rows(dam)) == 0
    dam.get_by_role("button", name="Limpiar filtros").click()
    dam.get_by_label("Presentación", exact=True).select_option("si")
    assert len(table_rows(dam)) == 3
    dam.get_by_role("button", name="Limpiar filtros").click()
    shot(dam, "05-panel-final")
    with dam.expect_download() as dl:
        dam.get_by_role("button", name="Exportar CSV").click()
    csv = Path(dl.value.path()).read_text(encoding="utf-8-sig")
    assert "Estado de respuesta" in csv and "En Directorio" in csv and "No agregado" in csv and "Descartado" in csv
    print("OK  10 filtros (Directorio, estado, presentación) y CSV")

    # 11. Otro agente: sin acceso
    gui = browser.new_context().new_page()
    login(gui, "guillermo@tres65.test")
    expect(gui.get_by_text("Esta cuenta no tiene acceso a esta campaña.")).to_be_visible(timeout=15000)
    print("OK  11 Guillermo no tiene acceso al panel de la campaña")

    # 12. Admin ve todo
    adm = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
    login(adm, "admin@tres65.test")
    expect(adm.get_by_role("heading", name="Respuestas")).to_be_visible(timeout=15000)
    assert len(table_rows(adm)) == 4
    print("OK  12 Admin ve toda la campaña")

    mob = desk.new_page()
    mob.set_viewport_size({"width": 390, "height": 844})
    mob.goto(f"{BASE}/admin/")
    expect(mob.get_by_role("heading", name="Respuestas")).to_be_visible(timeout=15000)
    shot(mob, "06-panel-movil")

    assert not errors, errors
    print("OK  sin errores de JavaScript")
    browser.close()
