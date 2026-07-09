import { useEffect, useRef, useState } from 'react'
import { API_URL } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const canvasRef = useRef(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState('')
  const [caricamento, setCaricamento] = useState(false)

  // Animazione ECG di sfondo — porting 1:1 della logica canvas originale
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frame
    let offset = 0

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function ecgPoint(x) {
      const t = (x + offset) * 0.02
      const cycle = t % (Math.PI * 2)
      if (cycle < 0.3) return Math.sin(cycle * 10) * 30
      if (cycle < 0.5) return Math.sin(cycle * 20) * 120
      if (cycle < 0.7) return -Math.sin(cycle * 15) * 40
      return Math.sin(cycle * 5) * 5
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.strokeStyle = '#e53e3e'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height / 2 + ecgPoint(x)
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      ctx.strokeStyle = '#4fd1c5'
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x < canvas.width; x++) {
        const y = canvas.height * 0.3 + ecgPoint(x + 200) * 0.5
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.stroke()

      offset += 2
      frame = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setErrore('')
    setCaricamento(true)

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      })

      if (!res.ok) {
        setErrore('Credenziali non valide. Riprova.')
        return
      }

      const data = await res.json()
      login(data.access_token)
    } catch (err) {
      setErrore('Errore di connessione al server.')
    } finally {
      setCaricamento(false)
    }
  }

  return (
    <div className="login-body">
      <canvas className="bg-canvas" ref={canvasRef} />

      <div className="login-wrap">
        <div className="login-card">
          <div className="brand">
            <div className="brand-icon">
              <img src="/favicon.svg" alt="SmartCare Logo" />
            </div>
            <div className="brand-name">Smart<span>Care</span></div>
          </div>

          <h1 className="login-title">Bentornato</h1>
          <p className="login-subtitle">Accedi all'area riservata medici</p>

          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="medico@ospedale.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="btn-login" type="submit" disabled={caricamento}>
              {caricamento ? 'Accesso in corso...' : 'Accedi'}
            </button>

            {errore && <div className="error">{errore}</div>}
          </form>

          <div className="divider" />

          <div className="status-row">
            <div className="status-dot-teal" />
            Sistema operativo — Tutti i servizi attivi
          </div>
        </div>
      </div>
    </div>
  )
}
