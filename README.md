# CardioSense — Dashboard medico (React)

Porting React (Vite) della dashboard medico originariamente scritta in HTML/CSS/JS vanilla nel repository principale **CardioSense**. Stessa identità visiva, stessa logica applicativa (polling REST + MQTT via WebSocket), riorganizzata in componenti.

Questo repo **non contiene backend**: si collega via rete (HTTPS + WSS) al backend FastAPI/Mosquitto del repo principale, esattamente come faceva la dashboard originale in `dashboard/`.

---

## Prerequisiti

- Node.js 18+ (consigliato 20 LTS)
- Il backend CardioSense (repo principale) in esecuzione — Mosquitto, MongoDB, MySQL, `fastapi_server.py`, `mqtt_subscriber.py`
- [mkcert](https://github.com/FiloSottile/mkcert) — stessi certificati già generati per il repo principale, per evitare warning TLS nel browser

## Installazione

```bash
npm install
cp .env.example .env.local
```

Apri `.env.local` e valorizza:

```bash
VITE_API_URL=https://localhost:8443
VITE_BROKER_URL=wss://localhost:9002
VITE_TLS_CERT=/percorso/assoluto/a/mosquitto/certs/server.crt
VITE_TLS_KEY=/percorso/assoluto/a/mosquitto/certs/server.key
```

I percorsi dei certificati devono puntare agli stessi file `.crt`/`.key` usati da Mosquitto e FastAPI nel repo principale (cartella `mosquitto/certs/`), così il browser li riconosce già come fidati grazie a `mkcert -install` e non servono certificati separati per questo progetto.

> Se lasci `VITE_TLS_CERT`/`VITE_TLS_KEY` vuoti, il dev server parte in HTTP semplice — utile solo se il backend gira anch'esso senza TLS (`MQTT_TLS_ENABLED=false` e FastAPI senza `ssl_keyfile`/`ssl_certfile`).

## Avvio in sviluppo

```bash
npm run dev
```

Il dev server parte su `https://localhost:5173` (o la prima porta libera). Se lo apri in `http://` invece di `https://`, il browser bloccherà comunque la connessione al broker MQTT su `wss://` per mixed-content: usa sempre l'URL `https://`.

## Build di produzione

```bash
npm run build     # genera dist/
npm run preview   # serve dist/ in locale per un ultimo controllo
```

---

## Come testare l'intero flusso end-to-end

Questi passaggi replicano esattamente il test che facevi con la dashboard HTML originale — cambia solo da dove viene servito il frontend.

### 1. Avvia l'infrastruttura e il backend (repo principale `cardiosense/`)

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

### 2. Avvia questo progetto React (repo separato)

```bash
npm install
npm run dev
```

Apri `https://localhost:5173`. Il browser dovrebbe mostrare la CA mkcert come fidata (nessun warning) se hai puntato `.env.local` agli stessi certificati del backend.

### 3. Test del login

- Se non hai ancora un medico registrato, crealo con:
  ```bash
  curl -k -X POST https://localhost:8443/auth/registrazione \
    -H "Content-Type: application/json" \
    -d '{"nome":"Mario","cognome":"Rossi","email":"medico@test.it","password":"password123"}'
  ```
- Accedi dalla pagina di login React con quelle credenziali.
- **Verifica**: dopo il login vieni reindirizzato alla dashboard, il pallino MQTT in alto a destra passa da "Connessione MQTT..." (ambra) a "MQTT connesso" (teal) entro pochi secondi.

### 4. Test creazione paziente

- Sezione **Pazienti** → **+ Nuovo paziente** → inserisci nome/cognome.
- **Verifica**: viene mostrato un codice di accesso a 8 caratteri; il paziente compare nella griglia; il KPI "Pazienti monitorati" in Panoramica si aggiorna.

### 5. Test del flusso anomalia → notifica → validazione (il test più importante)

Nel repo principale, con `PAZIENTE_ID` in `simulate_stream.py` allineato al `codice_accesso` del paziente appena creato (modifica la costante o passa il paziente giusto), lancia il simulatore:

```bash
cd backend/simulation
python simulate_stream.py --scenario anomalia_ecg --durata 30
```

**Verifica in ordine:**

1. Entro 1-2s dall'inizio dello stream, in React parte il **beep sonoro** e appare un **toast rosso** in alto a destra — prova che il WebSocket MQTT sta ricevendo `cardiosense/allarmi` in tempo reale.
2. Se hai cliccato "Attiva notifiche desktop" nella Topbar e concesso il permesso al browser, arriva anche una **notifica di sistema** nativa OS.
3. Il badge rosso sulla voce **Anomalie** nella sidebar si aggiorna con il conteggio.
4. Vai su **Anomalie** → dovresti vedere l'episodio raggruppato (non 30 righe singole) con lo score picco/medio.
5. Clicca **Valida** → si apre il modal:
   - Il grafico ECG esteso inizialmente mostra "Traccia ECG in elaborazione" (i campioni post-anomalia non sono ancora arrivati).
   - Dopo qualche secondo clicca **Riprova**: dovrebbe apparire il tracciato SVG con la linea rossa tratteggiata sul picco.
   - Seleziona **Vero positivo** o **Falso allarme**, aggiungi una nota, conferma.
6. **Verifica**: toast verde di conferma, il KPI "Validate oggi" in Panoramica incrementa, l'episodio sparisce dalla coda Anomalie.

### 6. Test dello storico

- Sezione **Storico** → seleziona il paziente → **Carica**.
- **Verifica**: l'episodio appena validato compare con il bordo colorato coerente (rosso = vero positivo, verde = falso allarme) e la nota clinica in corsivo.
- Cliccalo → il modal si riapre in modalità dettaglio con il banner dell'esito già mostrato e il pulsante **"Aggiorna validazione"**; prova a cambiare esito e confermare — verifica che la lista storico si ricarichi da sola senza dover ricliccare "Carica".

### 7. Test di robustezza connessione

- Ferma `mqtt_subscriber.py` o Mosquitto (`docker-compose stop mosquitto`) mentre la dashboard è aperta.
- **Verifica**: il pallino in Topbar diventa rosso ("MQTT disconnesso"), poi ambra ("Riconnessione...") quando riavvii Mosquitto — senza dover ricaricare la pagina (gestito da `reconnectPeriod` di mqtt.js).

### 8. Test logout / sessione scaduta

- Clicca **Esci dall'account** in sidebar → torni alla pagina di login e `localStorage` non contiene più `cs_token`.
- Per testare la scadenza token: modifica temporaneamente `ACCESS_TOKEN_EXPIRE_MINUTES` in `fastapi_server.py` a un valore molto basso, fai login, aspetta la scadenza, esegui un'azione (es. Aggiorna anomalie) → dovresti essere reindirizzato automaticamente al login (gestito da `apiFetch` → `onUnauthorized`).

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
    │   └── global.css           # porting 1:1 delle variabili/classi CSS originali
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

## Note di porting

- **Nessuna modifica al backend è necessaria**: CORS è già `allow_origins=["*"]` in `fastapi_server.py`, quindi questo frontend consuma le stesse API REST e lo stesso topic MQTT (`cardiosense/allarmi`) dell'originale.
- Lo stato applicativo (episodi, pazienti, KPI, modali) è centralizzato in `Dashboard.jsx` con `useState`/`useEffect`, senza librerie di state management esterne: il volume di stato non lo giustifica.
- Il debounce sugli allarmi per evitare N beep per lo stesso episodio (`DEBOUNCE_ALLARME_MS = 15000`, coerente con `GAP_MASSIMO_EPISODIO_SECONDI` lato backend) è mantenuto identico all'originale.
- `React.StrictMode` in sviluppo monta/smonta gli effetti due volte: la connessione MQTT si ricrea correttamente grazie al cleanup in `useMqtt` (`client.end(true)`), ma se noti doppie sottoscrizioni nei log del browser durante `npm run dev` è un comportamento atteso di React in dev, non un bug — sparisce in build di produzione.
