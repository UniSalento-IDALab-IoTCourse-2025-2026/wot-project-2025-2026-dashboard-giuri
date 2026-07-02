export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tipo}`}>
          <div className="toast-icon">{t.tipo === 'alarm' ? '⚠' : '✓'}</div>
          <div className="toast-body">
            <div className="toast-title">{t.titolo}</div>
            <div className="toast-msg">{t.messaggio}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
