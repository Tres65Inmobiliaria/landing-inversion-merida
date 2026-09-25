"""
Prueba de humo end-to-end contra los EMULADORES (nunca contra producción).

Requisitos (tres terminales):
  npm run emulators
  npm run seed:emulator
  npm run dev:emulator          # http://localhost:3065

Luego:
  python3 tests/e2e/smoke.py [carpeta_para_capturas]
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

from playwright.sync_api import expect, sync_playwright

BASE = "http://localhost:3065"
FS = "http://127.0.0.1:8181/v1/projects/demo-tres65-landing/databases/(default)/documents"
SHOTS = Path(sys.argv[1] if len(sys.argv) > 1 else "test-results")
SHOTS.mkdir(parents=True, exist_ok=True)


def shot(page, name, full=False):
    page.screenshot(path=str(SHOTS / f"{name}.png"), full_page=full)


def pick(page, group, text):
    page.locator(f"#{group}").get_by_text(text, exact=True).click()


def cont(page):
    page.get_by_role("button", name="Continuar").click()


def reset_emulator():
    req = urllib.request.Request(f"{FS}".replace("/v1/", "/emulator/v1/"), method="DELETE")
    urllib.request.urlopen(req)
    subprocess.run(["node", "scripts/seed-emulator.mjs"], check=True, capture_output=True)


def firestore_docs():
    req = urllib.request.Request(f"{FS}/prospects", headers={"Authorization": "Bearer owner"})
    return json.load(urllib.request.urlopen(req)).get("documents", [])


reset_emulator()

with sync_playwright() as p:
    browser = p.chromium.launch()
    phone = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    page = phone.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))

    page.goto(f"{BASE}/?utm_source=whatsapp&utm_medium=mensaje&utm_campaign=medicos_sept&utm_content=carta")
    page.evaluate("document.fonts.ready")
    expect(page.get_by_role("heading", level=1)).to_have_text("Diversifica tu patrimonio en Mérida")
    shot(page, "01-hero-movil")
    shot(page, "02-landing-completa-movil", full=True)

    page.get_by_role("link", name="Responder cuestionario").click()
    expect(page.get_by_text("Paso 1 de 7")).to_be_visible()
    expect(page.get_by_role("button", name="Continuar")).to_be_enabled(timeout=15000)  # hidratado

    # Paso 1: validaciones
    cont(page)
    expect(page.get_by_text("Escribe tu nombre completo.")).to_be_visible()
    expect(page.get_by_text("Escribe tu correo electrónico.")).to_be_visible()
    shot(page, "03-errores-paso1")
    page.get_by_label("Nombre completo").fill("Ana López Pérez")
    page.get_by_label("Correo electrónico").fill("ana@correo")
    page.get_by_label("Teléfono / WhatsApp").fill("12345")
    cont(page)
    expect(page.get_by_text("Revisa tu correo", exact=False)).to_be_visible()
    expect(page.get_by_text("Escribe un número de 10 dígitos", exact=False)).to_be_visible()
    page.get_by_label("Correo electrónico").fill("ana@example.com")
    page.get_by_label("Teléfono / WhatsApp").fill("999 123 4567")
    cont(page)

    # Paso 2: condicional
    expect(page.get_by_text("Paso 2 de 7")).to_be_visible()
    pick(page, "diversificationInterest", "Sí, me interesa")
    expect(page.locator("#previousInvestmentTypes")).to_have_count(0)
    pick(page, "previousRealEstateInvestment", "Sí")
    expect(page.locator("#previousInvestmentTypes")).to_be_visible()
    cont(page)
    expect(page.get_by_text("Elige al menos una opción.")).to_be_visible()
    pick(page, "previousInvestmentTypes", "Departamento")
    pick(page, "previousInvestmentTypes", "Otro")
    page.get_by_label("¿Qué otro tipo?").fill("Bodega")
    page.get_by_label("¿En qué ciudad o zona?").fill("Mérida norte")
    shot(page, "04-paso2-condicional")
    cont(page)

    # Paso 3
    expect(page.get_by_text("Paso 3 de 7")).to_be_visible()
    pick(page, "investmentBudget", "$3 – 5 M MXN")
    pick(page, "purchaseMethod", "Liquidez propia")
    pick(page, "financingInterest", "Tal vez, quiero más información")
    shot(page, "05-paso3")
    cont(page)

    # Paso 4: "Yo solo/a" es excluyente
    expect(page.get_by_text("Paso 4 de 7")).to_be_visible()
    pick(page, "investmentTimeline", "En los próximos 3 meses")
    pick(page, "decisionMakers", "Con mi pareja")
    pick(page, "decisionMakers", "Yo solo/a")
    expect(page.locator("#decisionMakers input[value=pareja]")).not_to_be_checked()
    pick(page, "decisionMakers", "Con mi pareja")
    expect(page.locator("#decisionMakers input[value=solo]")).not_to_be_checked()
    cont(page)

    # Paso 5
    expect(page.get_by_text("Paso 5 de 7")).to_be_visible()
    pick(page, "investmentPurposes", "Ingreso por renta")
    pick(page, "investmentPurposes", "Herencia / patrimonio familiar")
    pick(page, "personalUse", "Tal vez")
    cont(page)

    # Paso 6
    expect(page.get_by_text("Paso 6 de 7")).to_be_visible()
    pick(page, "meridaExperience", "Vivo en Mérida o sus alrededores")
    pick(page, "meridaMarketKnowledge", "He escuchado algo")
    cont(page)
    expect(page.get_by_text("Escribe una zona o marca", exact=False)).to_be_visible()
    page.get_by_label("Estoy abierto/a a recomendaciones", exact=False).check()
    cont(page)

    # Paso 7: consentimiento obligatorio
    expect(page.get_by_text("Paso 7 de 7")).to_be_visible()
    consent = page.get_by_label("Autorizo a TRES65 Inmobiliaria", exact=False)
    expect(consent).not_to_be_checked()
    pick(page, "eventInterest", "Sí, me interesa asistir")
    page.get_by_role("button", name="Enviar respuestas").click()
    expect(page.get_by_text("Necesitamos tu autorización", exact=False)).to_be_visible()
    consent.check()
    shot(page, "06-paso7")
    page.get_by_role("button", name="Enviar respuestas").click()

    expect(page.get_by_role("heading", name="Gracias, Ana")).to_be_visible(timeout=10000)
    expect(page.get_by_text("se pondrá en contacto contigo", exact=False)).to_be_visible()
    href = page.get_by_role("link", name="Hablar con Damara").get_attribute("href")
    assert href.startswith("https://wa.me/529992786153?text="), href
    assert "soy%20Ana%20L%C3%B3pez%20P%C3%A9rez" in href, href
    page.wait_for_timeout(1200)  # termina el scroll suave
    expect(page.get_by_role("heading", name="Gracias, Ana")).to_be_in_viewport()
    shot(page, "07-gracias")

    docs = firestore_docs()
    assert len(docs) == 1, docs
    f = docs[0]["fields"]
    assert f["status"]["stringValue"] == "nuevo"
    assert f["utm_source"]["stringValue"] == "whatsapp"
    assert f["campaign"]["stringValue"] == "medicos_merida"
    assert f["assignedAgent"]["stringValue"] == "Damara Traconis"
    assert f["phone"]["stringValue"] == "+529991234567"
    assert f["previousInvestmentTypeOther"]["stringValue"] == "Bodega"
    assert "website" not in f
    print("OK  cuestionario guardado en Firestore (emulador)")

    # Admin en escritorio
    desk = browser.new_context(viewport={"width": 1440, "height": 900})
    admin = desk.new_page()
    admin.on("pageerror", lambda e: errors.append(str(e)))
    admin.goto(f"{BASE}/admin/")
    expect(admin.get_by_role("heading", name="Acceso administrativo")).to_be_visible()
    shot(admin, "08-admin-login")
    admin.get_by_label("Correo").fill("admin@tres65.test")
    admin.get_by_label("Contraseña").fill("incorrecta")
    admin.get_by_role("button", name="Entrar").click()
    expect(admin.get_by_text("Correo o contraseña incorrectos.")).to_be_visible()
    admin.get_by_label("Contraseña").fill("admin-local-123")
    admin.get_by_role("button", name="Entrar").click()
    expect(admin.get_by_role("heading", name="Prospectos")).to_be_visible(timeout=10000)
    expect(admin.get_by_role("cell", name="Ana López Pérez")).to_be_visible()
    shot(admin, "09-admin-dashboard")

    admin.get_by_label("Buscar por nombre", exact=False).fill("nadie")
    expect(admin.get_by_text("Ningún prospecto coincide")).to_be_visible()
    admin.get_by_label("Buscar por nombre", exact=False).fill("999 123")
    expect(admin.get_by_role("cell", name="Ana López Pérez")).to_be_visible()
    admin.get_by_label("Buscar por nombre", exact=False).fill("")

    admin.get_by_role("cell", name="Ana López Pérez").click()
    dialog = admin.get_by_role("dialog")
    expect(dialog.get_by_text("Bodega", exact=False)).to_be_visible()
    expect(dialog.get_by_text("medicos_sept")).to_be_visible()
    shot(admin, "10-admin-ficha")
    dialog.get_by_label("Estado").select_option("contactado")
    dialog.get_by_role("button", name="Guardar estado").click()
    expect(dialog.get_by_text("Estado actualizado.")).to_be_visible()
    dialog.get_by_label("Notas internas").fill("Le llamé, prefiere por la tarde.")
    dialog.get_by_role("button", name="Agregar nota").click()
    expect(dialog.get_by_role("listitem").get_by_text("Le llamé, prefiere por la tarde.")).to_be_visible()
    expect(dialog.get_by_label("Notas internas")).to_have_value("")
    wa = dialog.get_by_role("link", name="WhatsApp").get_attribute("href")
    assert wa.startswith("https://wa.me/529991234567?text="), wa
    shot(admin, "11-admin-ficha-seguimiento")
    admin.keyboard.press("Escape")
    expect(admin.get_by_role("dialog")).to_have_count(0)

    with admin.expect_download() as dl:
        admin.get_by_role("button", name="Exportar CSV").click()
    csv = Path(dl.value.path()).read_text(encoding="utf-8-sig")
    assert "Ana López Pérez" in csv and "Contactado" in csv and "Le llamé" in csv, csv[:400]
    print("OK  admin: login, ficha, estado, nota y CSV")

    f = firestore_docs()[0]["fields"]
    assert f["status"]["stringValue"] == "contactado"

    # Admin en móvil
    mob = desk.new_page()  # misma sesión admin
    mob.set_viewport_size({"width": 390, "height": 844})
    mob.goto(f"{BASE}/admin/")
    expect(mob.get_by_role("heading", name="Prospectos")).to_be_visible(timeout=10000)
    shot(mob, "12-admin-movil")
    mob.close()

    # Usuario autenticado sin permiso
    other = browser.new_context().new_page()
    other.goto(f"{BASE}/admin/")
    other.get_by_label("Correo").fill("no-admin@tres65.test")
    other.get_by_label("Contraseña").fill("admin-local-123")
    other.get_by_role("button", name="Entrar").click()
    expect(other.get_by_text("Esta cuenta no tiene acceso al panel.")).to_be_visible(timeout=10000)
    print("OK  usuario no-admin rechazado")

    # Escritorio: landing
    land = desk.new_page()
    land.goto(BASE + "/")
    land.evaluate("document.fonts.ready")
    shot(land, "13-landing-desktop", full=True)
    shot(land, "14-hero-desktop")

    assert not errors, errors
    print("OK  sin errores de JavaScript")
    browser.close()
