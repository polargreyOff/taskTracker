import AppShell from '../../components/AppShell'

export default function DevRequestsListPage() {
  return (
    <AppShell crumb="Разработчик" title="Запросы заказчиков">
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
        }}>В разработке · Запросы заказчиков</span>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 400 }}>
          Здесь будет список входящих запросов от заказчиков с информацией о типе,
          срочности и сгенерированных задачах.
        </p>
      </div>
    </AppShell>
  )
}
