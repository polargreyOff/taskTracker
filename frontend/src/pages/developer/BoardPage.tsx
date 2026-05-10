import AppShell from '../../components/AppShell'

export default function BoardPage() {
  return (
    <AppShell crumb="Разработчик" title="Kanban-доска">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {(['К выполнению', 'В работе', 'На проверке', 'Выполнено'] as const).map((col, i) => {
          const hues = [255, 70, 305, 155]
          const hue = hues[i]
          return (
            <div key={col} style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              padding: 10,
              minHeight: 240,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 6px 10px',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 2,
                  background: `oklch(0.55 0.14 ${hue})`,
                }}/>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{col}</span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)',
                }}>0</span>
              </div>
              <div style={{
                border: '1px dashed var(--line-strong)',
                borderRadius: 'var(--r-md)',
                padding: '18px 12px', textAlign: 'center',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)',
                }}>пусто</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 24, background: 'var(--surface)',
        border: '1px dashed var(--line-strong)',
        borderRadius: 'var(--r-lg)', padding: '32px',
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5,
          textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)',
        }}>В разработке · Kanban-доска</span>
        <p style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
          Здесь появятся задачи, сгенерированные системой на основе запросов заказчиков.
        </p>
      </div>
    </AppShell>
  )
}
