import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'

export default function ClientRequestsPage() {
  const navigate = useNavigate()

  return (
    <AppShell
      crumb="Заказчик"
      title="Мои запросы"
      action={
        <button
          onClick={() => navigate('/client/requests/new')}
          style={{
            padding: '7px 14px',
            borderRadius: 'var(--r-sm)',
            border: 'none',
            background: 'var(--ink)',
            color: 'var(--bg)',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Новый запрос
        </button>
      }
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px dashed var(--line-strong)',
        borderRadius: 'var(--r-lg)',
        padding: '48px 32px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          color: 'var(--ink-4)',
        }}>В разработке · Список запросов</span>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 400 }}>
          Здесь будет список ваших запросов с текущими статусами и краткой информацией
          о сгенерированных задачах.
        </p>
      </div>
    </AppShell>
  )
}
