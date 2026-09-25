"""
SOLO PRUEBAS LOCALES. Levanta el backend REAL del CRM (main.py de agente-tres65,
rama feat/landing-inversion-merida) en http://localhost:5065 con:
  - Firestore falso en memoria (FakeFS de las pruebas del backend)
  - Chatwoot falso con estado (FakeChatwoot de las pruebas del backend)
  - Redis falso (fakeredis)
  - Tokens del emulador de Firebase Auth mapeados a los agent_uid reales
Nunca toca Chatwoot, Firestore ni Redis reales.

  BACKEND_DIR=../_feat-landing-merida python3 tests/e2e/crm_backend_harness.py
"""
import base64
import json
import os
import sys

BACKEND_DIR = os.path.abspath(os.environ.get("BACKEND_DIR", os.path.join(os.path.dirname(__file__), "../../../_feat-landing-merida")))
for k, v in {
    "OPENAI_API_KEY": "test", "CHATWOOT_TOKEN": "test", "CHATWOOT_URL": "https://chatwoot.test",
    "CHATWOOT_ACCOUNT_ID": "1", "CHATWOOT_INBOX_ID": "1", "CHATWOOT_WEBHOOK_SECRET": "test",
    "META_APP_SECRET": "test", "WHATSAPP_TOKEN": "test", "WHATSAPP_PHONE_ID": "1",
    "EASYBROKER_API_KEY": "test", "GITHUB_TOKEN": "test", "GITHUB_REPORTS_OWNER": "Test",
}.items():
    os.environ[k] = v
for k in ("REDIS_URL", "FIREBASE_SERVICE_ACCOUNT_JSON"):
    os.environ.pop(k, None)
sys.path[:0] = [BACKEND_DIR, os.path.join(BACKEND_DIR, "tests")]

import fakeredis  # noqa: E402
import requests_mock  # noqa: E402
from flask import jsonify  # noqa: E402

import main as m  # noqa: E402
from test_client_directorio_mirror import FakeFS  # noqa: E402
from test_landing_inversion_merida import FakeChatwoot  # noqa: E402

AGENTS = {
    "admin@tres65.test": ("admin-tres65", True),
    "damara@tres65.test": ("5219992786153", False),
    "guillermo@tres65.test": ("5219992413657", False),
    "moises@tres65.test": ("5219992399890", False),
    "cliente@tres65.test": ("5219990000000", False),  # cuenta que NO es agente
}

mocker = requests_mock.Mocker()
mocker.start()
state = {}


def reset():
    mocker.reset_mock()
    state["fs"] = FakeFS(clients={}, directorio_manual={}, campaign_submissions={}, directorio_tipo={}, lead_assigned={})
    state["cw"] = FakeChatwoot(mocker)
    m._fs = state["fs"]
    m._redis = fakeredis.FakeRedis(decode_responses=True)
    # Contacto que YA existía en el CRM, asignado a Guillermo (para probar que no se reasigna).
    cid = state["cw"].add_contact("+5219997776655", "Beto Ruiz")
    state["cw"].add_conv(cid, labels=["listo-para-asesor"], assignee_uid="5219992413657")


def verify(req):
    """Tokens del emulador vienen sin firma: se decodifica el payload y se
    mapea el correo al agent_uid real (en producción lo hace fb_auth)."""
    h = req.headers.get("Authorization", "")
    if not h.startswith("Bearer "):
        return None, False
    try:
        payload = h[7:].split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(payload + "=" * (-len(payload) % 4)))
    except Exception:
        return None, False
    return AGENTS.get(claims.get("email"), (None, False))


m._verify_agent_token = verify
m.fb_auth.get_user = lambda uid: type("U", (), {"display_name": next((e for e, (u, _) in AGENTS.items() if u == uid), uid), "email": ""})()
reset()


@m.app.route("/__e2e/reset", methods=["POST"])
def _e2e_reset():
    reset()
    return jsonify(ok=True)


@m.app.route("/__e2e/state")
def _e2e_state():
    cw = state["cw"]
    calls = [r for r in mocker.request_history if r.url.startswith(m.chatwoot_base())]
    return jsonify(
        chatwoot_calls=len(calls),
        chatwoot_writes=len([r for r in calls if r.method != "GET"]),
        submissions=state["fs"].data.get("campaign_submissions", {}),
        clients=state["fs"].data.get("clients", {}),
        directorio_manual=state["fs"].data.get("directorio_manual", {}),
        directorio_tipo=state["fs"].data.get("directorio_tipo", {}),
        contacts=list(cw.contacts.values()),
        convs=list(cw.convs.values()),
        messages={str(k): v for k, v in cw.messages.items()},
        assignments=cw.assignments,
    )


if __name__ == "__main__":
    print(f"Backend real desde {BACKEND_DIR} con Firestore/Chatwoot/Redis falsos en http://localhost:5065")
    m.app.run(port=5065, debug=False, use_reloader=False, threaded=True)
