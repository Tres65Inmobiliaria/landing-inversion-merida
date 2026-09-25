"""
E2E landing → backend REAL del CRM (con Firestore/Chatwoot/Redis falsos) → /admin.
Nunca toca producción.

Requisitos (cuatro terminales):
  npm run emulators          # Auth emulator (cuentas de agente de prueba)
  npm run seed:emulator
  npm run backend:local      # main.py real de agente-tres65 en :5065 (arnés)
  npm run dev:emulator       # landing en http://localhost:3065

  python3 tests/e2e/smoke.py [carpeta_para_capturas]
"""
import json
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

    # 1. Prospecto completamente nuevo (con UTMs)
    page = phone_ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    fill_questionnaire(page, "Ana López Pérez", "ana@example.com", "999 123 4567",
                       "?utm_source=whatsapp&utm_medium=mensaje&utm_campaign=medicos_sept")
    page.wait_for_timeout(1200)
    shot(page, "01-gracias")
    s = state()
    ana_convs = [c for c in s["convs"] if c["meta"]["sender"]["phone_number"].endswith("9991234567")]
    assert len(ana_convs) == 1, s["convs"]
    ana = ana_convs[0]
    assert ana["meta"]["assignee"]["id"] == DAMARA_CW and ana["labels"] == ["listo-para-asesor"], ana
    assert any(c["phone_number"] == "+5219991234567" for c in s["contacts"])
    note = s["messages"][str(ana["id"])][0]
    assert note["private"] and "Cuestionario Inversión Mérida completado" in note["content"], note
    sub = next(v for v in s["submissions"].values() if v["email"] == "ana@example.com")
    assert sub["crm"]["action"] == "created" and sub["utm_source"] == "whatsapp" and sub["campaign"] == "medicos_merida"
    print("OK  1 prospecto nuevo → lead real en Chatwoot asignado a Damara, con nota y UTMs")

    # 2. Mismo teléfono otra vez (sin UTMs, otro correo)
    page = phone_ctx.new_page()
    fill_questionnaire(page, "Ana López Pérez", "ana.otro@example.com", "+52 1 999 123 4567")
    s = state()
    assert len([c for c in s["contacts"] if c["phone_number"].endswith("9991234567")]) == 1
    assert len([c for c in s["convs"] if c["meta"]["sender"]["phone_number"].endswith("9991234567")]) == 1
    print("OK  2 mismo teléfono → sin contacto duplicado")

    # 3. Contacto existente de otro agente (Guillermo)
    page = phone_ctx.new_page()
    fill_questionnaire(page, "Beto Ruiz Díaz", "beto@example.com", "999 777 6655")
    s = state()
    beto = next(c for c in s["convs"] if c["meta"]["sender"]["phone_number"].endswith("9997776655"))
    assert beto["meta"]["assignee"]["id"] == GUILLERMO_CW and s["assignments"] == [[ana["id"], DAMARA_CW]], s["assignments"]
    assert "se conservaron asignación" in s["messages"][str(beto["id"])][-1]["content"]
    print("OK  3 contacto de Guillermo → enriquecido, sin reasignar")

    # 4. Formulario manipulado desde el navegador
    manip = page.evaluate("""async (api) => {
      const r = await fetch(api + '/landing/inversion-merida/submit', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({submissionId: 'manipulado-0000000000', fullName: 'Hack Er Test', email: 'hack@example.com', phone: '9995550000',
          diversificationInterest: 'si', previousRealEstateInvestment: 'no', investmentBudget: 'mas_8m', purchaseMethod: 'liquidez',
          financingInterest: 'no', investmentTimeline: '0_3m', decisionMakers: ['solo'], investmentPurposes: ['renta'], personalUse: 'inversion',
          meridaExperience: 'conozco', meridaMarketKnowledge: 'poco', openToRecommendations: true, eventInterest: 'no', privacyConsent: true,
          assignee_uid: '5219992413657', status: 'Cliente creado', labels: ['cliente-creado'], portal_creado: true, admin: true, roles: ['admin']})});
      const leer = await fetch(api + '/portal/landing/inversion-merida/submissions');
      const dir = await fetch(api + '/portal/directorio');
      return {submit: r.status, leer: leer.status, dir: dir.status};
    }""", API)
    assert manip == {"submit": 200, "leer": 401, "dir": 401}, manip
    s = state()
    hack = next(c for c in s["convs"] if c["meta"]["sender"]["phone_number"].endswith("9995550000"))
    assert hack["meta"]["assignee"]["id"] == DAMARA_CW and hack["labels"] == ["listo-para-asesor"]
    hsub = s["submissions"]["manipulado-0000000000"]
    assert not any(k in hsub for k in ("assignee_uid", "status", "labels", "portal_creado", "admin", "roles"))
    assert s["clients"] == {}
    print("OK  4 campos privilegiados ignorados; público no lee /portal")

    desk = browser.new_context(viewport={"width": 1440, "height": 900})

    # 5. Damara: solo lo suyo
    dam = desk.new_page()
    dam.on("pageerror", lambda e: errors.append(str(e)))
    login(dam, "damara@tres65.test")
    expect(dam.get_by_role("heading", name="Prospectos")).to_be_visible(timeout=15000)
    expect(dam.get_by_text("tus contactos", exact=False)).to_be_visible()
    rows = table_rows(dam)
    assert len(rows) == 3 and not any("Beto" in r for r in rows), rows
    shot(dam, "02-admin-damara")
    dam.get_by_role("cell", name="Ana López Pérez").first.click()
    dialog = dam.get_by_role("dialog")
    expect(dialog.get_by_text("Lead en Chatwoot", exact=False)).to_be_visible()
    expect(dialog.get_by_text("Cuestionario Inversión Mérida completado", exact=False).first).to_be_visible(timeout=10000)
    dialog.get_by_label("Agregar nota (se guarda en el CRM)").fill("Le llamé, prefiere por la tarde.")
    dialog.get_by_role("button", name="Agregar nota").click()
    expect(dialog.get_by_text("Nota guardada en el CRM.")).to_be_visible()
    expect(dialog.get_by_text("Le llamé, prefiere por la tarde.", exact=False).first).to_be_visible()
    shot(dam, "03-ficha-damara")
    dam.keyboard.press("Escape")
    with dam.expect_download() as dl:
        dam.get_by_role("button", name="Exportar CSV").click()
    csv = Path(dl.value.path()).read_text(encoding="utf-8-sig")
    assert "Ana López Pérez" in csv and "Listo para asesor" in csv and "Beto" not in csv, csv[:300]
    assert any("Le llamé" in x["content"] for x in state()["messages"][str(ana["id"])])
    print("OK  5 Damara ve solo lo suyo, historial real, nota al CRM y CSV")

    # 6. Guillermo: solo su contacto existente
    gui = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
    login(gui, "guillermo@tres65.test")
    expect(gui.get_by_role("heading", name="Prospectos")).to_be_visible(timeout=15000)
    rows = table_rows(gui)
    assert len(rows) == 1 and "Beto" in rows[0], rows
    print("OK  6 Guillermo solo ve su contacto (sin acceso extra)")

    # 7. Admin: toda la campaña
    adm = browser.new_context(viewport={"width": 1440, "height": 900}).new_page()
    login(adm, "admin@tres65.test")
    expect(adm.get_by_text("todos los asesores", exact=False)).to_be_visible(timeout=15000)
    rows = table_rows(adm)
    assert len(rows) == 4 and any("Beto" in r and "Guillermo" in r for r in rows), rows
    shot(adm, "04-admin-todos")
    print("OK  7 Admin ve toda la campaña con asesor en vivo")

    # 8. Cuenta sin rol de agente
    cli = browser.new_context().new_page()
    login(cli, "cliente@tres65.test")
    expect(cli.get_by_text("Aún no hay prospectos de esta campaña para ti.")).to_be_visible(timeout=15000)
    print("OK  8 cuenta que no es agente no ve nada")

    # Panel en móvil
    mob = desk.new_page()
    mob.set_viewport_size({"width": 390, "height": 844})
    mob.goto(f"{BASE}/admin/")
    expect(mob.get_by_role("heading", name="Prospectos")).to_be_visible(timeout=15000)
    shot(mob, "05-admin-movil")

    assert not errors, errors
    print("OK  sin errores de JavaScript")
    browser.close()
