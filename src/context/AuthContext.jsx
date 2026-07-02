import { createContext, useCallback, useContext, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_KEY = 'cs_token'

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => localStorage.getItem(STORAGE_KEY))

  const login = useCallback((nuovoToken) => {
    localStorage.setItem(STORAGE_KEY, nuovoToken)
    setTokenState(nuovoToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTokenState(null)
  }, [])

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve essere usato dentro AuthProvider')
  return ctx
}
