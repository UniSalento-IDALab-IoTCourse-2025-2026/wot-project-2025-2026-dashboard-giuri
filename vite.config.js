import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// Config Vite. Se VITE_TLS_CERT / VITE_TLS_KEY sono impostati e i file
// esistono, il dev server parte in HTTPS con gli stessi certificati
// mkcert già usati da Mosquitto/FastAPI — così il browser li riconosce
// come fidati (mkcert -install) senza warning di sicurezza, e la pagina
// può aprire WebSocket "wss://" e fetch "https://" senza mixed-content.
// Se le variabili non sono impostate, il server parte in HTTP semplice
// (utile in sviluppo rapido, ma allora backend/broker vanno esposti
// anch'essi in chiaro, es. MQTT_TLS_ENABLED=false lato backend).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const certPath = env.VITE_TLS_CERT
  const keyPath = env.VITE_TLS_KEY

  const httpsAttivo =
    certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      https: httpsAttivo
        ? {
            cert: fs.readFileSync(certPath),
            key: fs.readFileSync(keyPath)
          }
        : undefined
    }
  }
})
