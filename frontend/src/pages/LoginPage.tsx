import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store'
import { setUser } from '../store/authSlice'
import { apiLogin } from '../api/auth'
import styles from './auth.module.css'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const canSubmit = username.trim().length >= 3 && password.length >= 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setError('')
    setSubmitting(true)
    try {
      const user = await apiLogin(username.trim(), password)
      dispatch(setUser(user))
      navigate(user.role === 'client' ? '/client/requests' : '/developer/board', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Неверный логин или пароль')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.screen}>
      {/* ── Left art panel ── */}
      <div className={styles.art}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>TT</div>
          <div>
            <div className={styles.brandName}>TaskTracker</div>
            <div className={styles.brandSub}>курсовой проект · 2026</div>
          </div>
        </div>

        <div className={styles.headline}>
          <div className={styles.eyebrow}>Что внутри</div>
          <h1 className={styles.headlineTitle}>
            Между запросом заказчика<br />
            и задачей разработчика —<br />
            <span className={styles.headlineAccent}>шесть простых вопросов.</span>
          </h1>
          <p className={styles.headlineDesc}>
            Заказчик описывает изменение на понятном языке. Система классифицирует
            запрос и генерирует структурированные задачи с приоритетом и сферой —
            готовые к работе на Kanban-доске.
          </p>

          <div className={styles.stats}>
            {([['6', 'вопросов опросника'], ['4', 'статуса на доске'], ['2', 'роли в системе']] as const).map(([n, label]) => (
              <div key={label} className={styles.stat}>
                <div className={styles.statN}>{n}</div>
                <div className={styles.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.deco}>
          {'01  feature       todo\n02  bugfix        in_progress\n03  ui_change     review\n04  behavior      done\n05  feature       todo\n06  bugfix        in_progress'}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.formWrap}>
        <div className={styles.formInner}>
          <div className={styles.formEyebrow}>Вход в систему</div>
          <h2 className={styles.formTitle}>С возвращением.</h2>
          <p className={styles.formDesc}>Введите ваши данные для входа.</p>

          <form onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Логин</label>
                <input
                  className={styles.input}
                  placeholder="username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Пароль</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className={styles.submitBtn}
              >
                {submitting ? 'Входим…' : 'Войти'}
              </button>
            </div>
          </form>

          <div className={styles.footerLink}>
            Нет аккаунта?{' '}
            <Link to="/register">Создать</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
