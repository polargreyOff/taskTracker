import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../store/authSlice'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  title:    string
  crumb?:   string
  action?:  ReactNode
}

const CLIENT_NAV = [
  { to: '/client/requests',     label: 'Мои запросы' },
  { to: '/client/teams',        label: 'Моя команда' },
  { to: '/client/requests/new', label: 'Создать запрос' },
]

const DEV_NAV = [
  { to: '/developer/board',    label: 'Kanban-доска' },
  { to: '/developer/teams',    label: 'Моя команда' },
  { to: '/developer/requests', label: 'Запросы' },
]

export default function AppShell({ children, title, crumb, action }: Props) {
  const { user } = useAuth()
  const dispatch  = useDispatch<AppDispatch>()
  const navigate  = useNavigate()
  const nav       = user?.role === 'client' ? CLIENT_NAV : DEV_NAV

  const handleLogout = async () => {
    await dispatch(logout())
    navigate('/login', { replace: true })
  }

  const initials = user
    ? (user.name[0] ?? '') + (user.surname[0] ?? '')
    : '??'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: 248, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--line)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'var(--ink)', color: 'var(--bg)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600,
            flexShrink: 0,
          }}>TT</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>TaskTracker</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              {user?.role === 'client' ? 'Заказчик' : 'Разработчик'}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              style={({ isActive }) => ({
                display: 'block',
                padding: '8px 10px',
                borderRadius: 'var(--r-sm)',
                fontSize: 13,
                fontWeight: 500,
                textDecoration: 'none',
                color: isActive ? 'var(--ink)' : 'var(--ink-3)',
                background: isActive ? 'var(--surface-3)' : 'transparent',
                marginBottom: 2,
                transition: 'background 0.12s, color 0.12s',
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer / user */}
        <div style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--line)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--ink)', color: 'var(--bg)',
            display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            flexShrink: 0,
          }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name} {user?.surname}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, opacity: 0.5, textTransform: 'uppercase' }}>
              {user?.role === 'client' ? 'Заказчик' : 'Разработчик'}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Выйти"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--ink-4)', fontSize: 16, padding: 4,
              borderRadius: 'var(--r-sm)', lineHeight: 1,
              transition: 'color 0.12s',
            }}
          >↩</button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: 'oklch(0.985 0.004 85 / 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--line)',
          padding: '0 28px',
          height: 56,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {crumb && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 10.5,
              color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{crumb} /</span>
          )}
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
        </header>

        {/* Content */}
        <main style={{ padding: 28, maxWidth: 1320, width: '100%' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
