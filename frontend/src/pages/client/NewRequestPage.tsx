import AppShell from '../../components/AppShell'

export default function NewRequestPage() {
  return (
    <AppShell crumb="Заказчик / Мои запросы" title="Новый запрос">
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
        }}>В разработке · Опросник</span>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', maxWidth: 400 }}>
          Здесь будет шесть вопросов опросника для описания нового запроса
          на изменение системы.
        </p>
      </div>
    </AppShell>
  )
}
