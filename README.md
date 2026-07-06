<div align="center">

<img src="public/favicon.svg" width="80" height="80" alt="CardioSense logo">

# CardioSense — Dashboard medico

### Sistema IoT real-time per il monitoraggio closed-loop di pazienti con scompenso cardiaco

[![React](https://img.shields.io/badge/React-Dashboard-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![MQTT](https://img.shields.io/badge/MQTT-WebSocket-3C5280?logo=eclipsemosquitto&logoColor=white)](https://mosquitto.org/)

</div>

---

## Indice

- [Panoramica del progetto](#panoramica-del-progetto)
- [Architettura del sistema](#architettura-del-sistema)
- [Repository collegati](#repository-collegati)
- [Questo repository: Dashboard medico](#questo-repository-dashboard-medico)
- [Prerequisiti](#prerequisiti)
- [Installazione](#installazione)
- [Avvio in sviluppo](#avvio-in-sviluppo)
- [Build di produzione](#build-di-produzione)
- [Test end-to-end](#test-end-to-end)
- [Struttura del progetto](#struttura-del-progetto)
- [Note tecniche](#note-tecniche)
- [Contesto accademico](#contesto-accademico)

---

## Panoramica del progetto

**CardioSense** è un sistema IoT end-to-end per il monitoraggio in tempo reale di pazienti affetti da **insufficienza cardiaca congestizia**. Il sistema acquisisce segnali fisiologici (ECG, postura tramite IMU a 6 assi — accelerometro + giroscopio, temperatura corporea) da un dispositivo wearable, li classifica tramite modelli di Machine Learning per rilevare anomalie cliniche, e mette in comunicazione diretta **paziente** e **medico** attraverso un'architettura event-driven basata su MQTT, con persistenza su database e validazione clinica delle anomalie rilevate.

Il progetto nasce con l'obiettivo di costruire — partendo da un dispositivo di acquisizione biomedicale esistente (**IIT BioDataAcq**) — un sistema cloud-like completo: dall'acquisizione del segnale grezzo fino alla dashboard clinica, passando per classificazione automatica, notifiche in tempo reale e un ciclo di **retraining periodico** dei modelli sulla base delle validazioni mediche.

> 🩺 **Closed-loop**: ogni anomalia rilevata automaticamente viene validata da un medico (vero positivo / falso allarme); queste validazioni rientrano nel dataset di addestramento per ri-calibrare periodicamente il classificatore ECG, chiudendo il ciclo tra IA e giudizio clinico.

---

## Architettura del sistema

> Lo schema sotto mostra l'intero sistema end-to-end. Questo repository implementa il blocco **Dashboard Web (medico)**, evidenziato di seguito.

```
                ┌───────────────────────────────────────────────────────────────┐
                │ App Python "IIT BioDataAcq" + dongle USB/BLE  (repo separato) │
                │ (acquisizione segnali grezzi: ECG, IMU acc+gyro, Temperatura) │
                └───────────────────────────────────────────────────────────────┘
                                                │
                                                │  layer non invasivo (mqtt_bridge.py)
                                                ▼
                                                  MQTT su TLS (mkcert)
                                                │
                                 ┌─────────────────────────────┐
                                 │ Broker Mosquitto            │
                                 │ (porte 8883 TLS · 9002 WSS) │
                                 └─────────────────────────────┘
                                                │
                          ┌─────────────────────┴──────────────────────┐
                          ▼                                            ▼
  ┌───────────────────────────────────────────────┐       ┌──────────────────────────┐
  │ mqtt_subscriber.py  (repo backend)            │       │ fastapi_server.py        │
  │ • Classificazione ECG / Postura / Temperatura │       │ (repo backend)           │
  │ • Salvataggio annotazioni su MongoDB          │       │ • REST API (JWT auth)    │
  │ • Notifiche allarme → medico                  │       │ • CRUD pazienti / medici │
  └───────────────────────────────────────────────┘       │ • Validazione episodi    │
                          │                               └──────────────────────────┘
                          ▼                                            │
         ┌─────────────────────────────────┐                           │
         │ MongoDB / MySQL (repo backend)  │                           │
         └─────────────────────────────────┘                           │
                                                                        ▼
                                              ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
                                                ██ QUESTO REPOSITORY ██
                                              │  Dashboard Web (medico)             │
                                                React (Vite) · MQTT via WebSocket
                                              │  REST via HTTPS                     │
                                              └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

La dashboard **non ospita né logica di classificazione, né persistenza, né broker**: consuma esclusivamente le API REST esposte da `fastapi_server.py` e il topic MQTT `cardiosense/allarmi` via WebSocket, entrambi forniti dal repository backend.

---

## Repository collegati

| Repository | Contenuto | Stato |
|---|---|---|
| **[CardioSense — Backend](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-backend-giuri)** | Backend: classificazione ML, API REST, persistenza (MongoDB/MySQL), broker MQTT, notifiche | Privato |
| **[cardiosense-dashboard](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-dashboard-giuri)** *(questo repo)* | Dashboard medico in React (Vite) | Privato |
| **[IIT BioDataAcq](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-patient-app-giuri)** | App Kivy di acquisizione segnali via dongle USB/BLE — base fornita da IIT, con layer di integrazione MQTT sviluppato per questo progetto | Repository distinto |

---

## Questo repository: Dashboard medico

Dashboard medico di CardioSense, realizzata in React (Vite). Si collega al backend FastAPI e al broker Mosquitto del repository **[backend](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-backend-giuri)** tramite REST (HTTPS) e MQTT via WebSocket (WSS).

Questo repository contiene **solo il frontend**: nessun backend, nessun database, nessun broker.

**Funzionalità principali:**

- 📊 **Panoramica**: KPI in tempo reale (pazienti monitorati, anomalie in attesa, validazioni del giorno)
- 🚨 **Anomalie**: coda di episodi da validare, raggruppati clinicamente, con notifica push via MQTT + beep sonoro
- 🧑‍⚕️ **Pazienti**: creazione e gestione, con generazione automatica del codice di accesso
- 🗂️ **Storico**: episodi passati per paziente, validati e in attesa, con traccia ECG e note cliniche
- 🔔 **Notifiche desktop**: Web Notifications API + allarme sonoro via Web Audio API
- 🔐 **Autenticazione**: login JWT, gestione sessione e scadenza token

---

## Prerequisiti

- Node.js 18+ (consigliata la versione 20 LTS)
- Backend CardioSense in esecuzione (repo **[backend](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-backend-giuri)**): Mosquitto, MongoDB, MySQL, `fastapi_server.py`, `mqtt_subscriber.py`
- [mkcert](https://github.com/FiloSottile/mkcert), con gli stessi certificati già generati per il repo backend

## Installazione

```bash
npm install
cp .env.example .env.local
```

Valorizza `.env.local`:

```bash
VITE_API_URL=https://localhost:8443
VITE_BROKER_URL=wss://localhost:9002
VITE_TLS_CERT=/percorso/assoluto/a/mosquitto/certs/server.crt
VITE_TLS_KEY=/percorso/assoluto/a/mosquitto/certs/server.key
```

I percorsi dei certificati devono puntare agli stessi file `.crt`/`.key` usati da Mosquitto e FastAPI nel repo backend (cartella `mosquitto/certs/`). Non copiare i certificati in questo repository: vanno referenziati da lì tramite percorso assoluto, così restano un'unica fonte di verità e `server.key` non viene mai duplicata in un secondo repository.

> Su Windows, usa gli slash forward anche nei percorsi Windows (`C:/Users/nome/CardioSense/mosquitto/certs/server.crt`), non i backslash. Il parser di `dotenv` interpreta `\n`, `\t`, `\"` come sequenze di escape anche dentro percorsi tra virgolette, e un backslash seguito dalla lettera sbagliata rompe il valore silenziosamente.

> `.env.local` è escluso da Git. `.env.example` deve contenere solo placeholder generici, mai percorsi reali.

> Se `VITE_TLS_CERT`/`VITE_TLS_KEY` sono vuoti, il dev server parte in HTTP semplice — utile solo se anche il backend gira senza TLS (`MQTT_TLS_ENABLED=false` e FastAPI senza `ssl_keyfile`/`ssl_certfile`).

## Avvio in sviluppo

```bash
npm run dev
```

Il dev server parte su `https://localhost:5173` (o la prima porta libera). Se aperto in `http://` invece di `https://`, il browser blocca comunque la connessione al broker su `wss://` per mixed-content.

## Build di produzione

```bash
npm run build     # genera dist/
npm run preview   # serve dist/ in locale per un ultimo controllo
```

`npm run build` produce solo file statici, pensati per essere serviti da un hosting statico o una CDN (es. S3 + CloudFront), non per essere serviti da `vite preview` in produzione. In quello scenario `VITE_TLS_CERT`/`VITE_TLS_KEY` non servono: il TLS viene terminato dall'infrastruttura (es. CloudFront/ALB con certificato ACM), e `VITE_API_URL`/`VITE_BROKER_URL` vanno impostati sui domini pubblici reali del backend a build-time.

---

## Test end-to-end

### 1. Avvia l'infrastruttura e il backend (repo backend)

```bash
# terminale 1 — infrastruttura
docker-compose up -d          # Mosquitto, MongoDB, MySQL

# terminale 2 — backend API
cd backend
source venv/bin/activate
python fastapi_server.py

# terminale 3 — pipeline di classificazione
python backend/mqtt_subscriber.py
```

Verifica che l'API risponda:

```bash
curl -k https://localhost:8443/health
# {"status":"ok","timestamp":"..."}
```

### 2. Avvia questo progetto

```bash
npm install
npm run dev
```

Apri `https://localhost:5173`. Se `.env.local` punta agli stessi certificati del backend, il browser mostra la CA mkcert come fidata, senza warning.

### 3. Login

Se non esiste ancora un medico registrato:

```bash
curl -k -X POST https://localhost:8443/auth/registrazione \
  -H "Content-Type: application/json" \
  -d '{"nome":"Mario","cognome":"Rossi","email":"medico@test.it","password":"password123"}'
```

Accedi dalla pagina di login con quelle credenziali. Dopo il login il pallino MQTT in Topbar passa da "Connessione MQTT..." (ambra) a "MQTT connesso" (teal) entro pochi secondi.

### 4. Creazione paziente

Sezione **Pazienti** → **+ Nuovo paziente** → nome e cognome. Viene mostrato un codice di accesso a 8 caratteri; il paziente compare nella griglia; il KPI "Pazienti monitorati" in Panoramica si aggiorna.

### 5. Flusso anomalia → notifica → validazione

Nel repo backend, con `PAZIENTE_ID` in `simulate_stream.py` allineato al `codice_accesso` del paziente appena creato:

```bash
cd backend/simulation
python simulate_stream.py --scenario anomalia_ecg --durata 30
```

Verifica, in ordine:

1. Entro 1-2s, beep sonoro e toast rosso in alto a destra — conferma che il WebSocket riceve `cardiosense/allarmi` in tempo reale.
2. Con le notifiche desktop attivate (Topbar), arriva anche una notifica di sistema nativa.
3. Il badge sulla voce **Anomalie** nella sidebar si aggiorna con il conteggio.
4. In **Anomalie**, l'episodio compare raggruppato (non come righe singole), con lo score picco/medio.
5. **Valida** → si apre il modal:
   - Il grafico ECG mostra inizialmente "Traccia ECG in elaborazione" (i campioni post-anomalia non sono ancora arrivati).
   - Dopo qualche secondo, **Riprova** mostra il tracciato SVG con la linea rossa tratteggiata sul picco.
   - Seleziona **Vero positivo** o **Falso allarme**, aggiungi una nota, conferma.
6. Toast verde di conferma; il KPI "Validate oggi" incrementa; l'episodio esce dalla coda Anomalie.

### 6. Storico

Sezione **Storico** → seleziona il paziente → **Carica**. L'episodio validato compare con il bordo colorato coerente (rosso = vero positivo, verde = falso allarme) e la nota clinica in corsivo. Cliccandolo, il modal si riapre in modalità dettaglio con il pulsante **"Aggiorna validazione"**; cambiando esito e confermando, la lista si ricarica da sola senza dover ricliccare "Carica".

### 7. Robustezza connessione

Ferma `mqtt_subscriber.py` o Mosquitto (`docker-compose stop mosquitto`) a dashboard aperta. Il pallino in Topbar diventa rosso ("MQTT disconnesso"), poi ambra ("Riconnessione...") al riavvio di Mosquitto, senza ricaricare la pagina.

### 8. Logout / sessione scaduta

**Esci dall'account** in sidebar riporta al login e rimuove `cs_token` da `localStorage`. Per testare la scadenza: riduci temporaneamente `ACCESS_TOKEN_EXPIRE_MINUTES` in `fastapi_server.py`, fai login, aspetta la scadenza, esegui un'azione (es. Aggiorna anomalie) → reindirizzamento automatico al login.

---

## Struttura del progetto

```
cardiosense-dashboard/
├── index.html                  # entry point Vite
├── vite.config.js              # dev server + HTTPS opzionale (mkcert)
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                 # bootstrap React
    ├── App.jsx                  # routing Login/Dashboard in base al token
    ├── api/
    │   └── client.js            # apiFetch autenticata + publicFetch
    ├── context/
    │   └── AuthContext.jsx      # token JWT in localStorage (cs_token)
    ├── hooks/
    │   ├── useMqtt.js           # connessione WebSocket + sottoscrizione allarmi
    │   ├── useToast.js          # coda toast
    │   └── useNotifiche.js      # Web Notifications API + beep Web Audio API
    ├── utils/
    │   └── format.js            # formattazione timestamp/durata episodio
    ├── styles/
    │   └── global.css           # variabili/classi CSS condivise con la dashboard originale
    ├── pages/
    │   ├── Login.jsx            # animazione ECG canvas + form
    │   └── Dashboard.jsx        # orchestrazione stato, polling, MQTT, modali
    └── components/
        ├── Sidebar.jsx
        ├── Topbar.jsx
        ├── ToastContainer.jsx
        ├── EcgChart.jsx         # grafico SVG traccia ECG estesa
        ├── ValidationModal.jsx  # validazione + dettaglio storico (stesso modal)
        ├── NewPatientModal.jsx
        └── sections/
            ├── Panoramica.jsx
            ├── Anomalie.jsx
            ├── Pazienti.jsx
            └── Storico.jsx
```

## Note tecniche

- Lo stato applicativo (episodi, pazienti, KPI, modali) è centralizzato in `Dashboard.jsx` con `useState`/`useEffect`, senza librerie di state management esterne.
- Il debounce sugli allarmi per evitare più notifiche per lo stesso episodio (`DEBOUNCE_ALLARME_MS = 15000`) è coerente con `GAP_MASSIMO_EPISODIO_SECONDI` lato backend.
- `React.StrictMode` monta/smonta gli effetti due volte in sviluppo: la connessione MQTT si ricrea correttamente grazie al cleanup in `useMqtt` (`client.end(true)`). Eventuali doppie sottoscrizioni nei log durante `npm run dev` sono comportamento atteso di React in sviluppo e non compaiono in build di produzione.
- CORS: in sviluppo, `fastapi_server.py` accetta l'origine di questo dev server. In produzione `allow_origins` sul backend va ristretto esplicitamente al dominio reale della dashboard deployata — un wildcard (`*`) combinato con `allow_credentials=True` va evitato.

---

## Contesto accademico

Componente sviluppato per l'esame di Internet of Things presso l'Università del Salento, in collaborazione con:

- **IDA Lab** - Università del Salento
- **IIT — Istituto Italiano di Tecnologia**

Per la descrizione completa dell'intero sistema, la logica di backend e i modelli di Machine Learning, fare riferimento al README del repository **[backend](https://github.com/UniSalento-IDALab-IoTCourse-2025-2026/wot-project-2025-2026-backend-giuri)**.