import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store'
import { setUser } from '../store/authSlice'
import { apiRegister } from '../api/auth'
import styles from './auth.module.css'

interface FormState {
  username: string
  name: string
  surname: string
  password: string
  role: string
  specialization: string
}

export default function RegisterPage() {
  const [form, setForm] = useState<FormState>({
    username: '',
    name: '',
    surname: '',
    password: '',
    role: 'client',
    specialization: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const canSubmit =
    form.username.trim().length >= 3 &&
    form.name.trim().length >= 2 &&
    form.surname.trim().length >= 2 &&
    form.password.length >= 6

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setError('')
    setSubmitting(true)
    try {
      const user = await apiRegister({
        username: form.username.trim(),
        name: form.name.trim(),
        surname: form.surname.trim(),
        password: form.password,
        role: form.role,
        specialization: form.role === 'developer' ? form.specialization || undefined : undefined,
      })
      dispatch(setUser(user))
      navigate(user.role === 'client' ? '/client/requests' : '/developer/board', { replace: true })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Ошибка при регистрации')
    } finally {
      setSubmitting(false)
    }
  }

  const roles = [
    { value: 'client',    label: 'Заказчик',    desc: 'Опросник + запросы' },
    { value: 'developer', label: 'Разработчик',  desc: 'Kanban-доска' },
  ]

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
          <div className={styles.eyebrow}>Добро пожаловать</div>
          <h1 className={styles.headlineTitle}>
            Присоединяйтесь<br />к системе.
          </h1>
          <p className={styles.headlineDesc}>
            Заказчики создают запросы на понятном языке.
            Разработчики получают структурированные задачи
            на Kanban-доске.
          </p>

          <div className={styles.roleList}>
            {[
              { label: 'Заказчик', desc: 'Шесть вопросов опросника → автогенерация задач для команды' },
              { label: 'Разработчик', desc: 'Kanban-доска с фильтрацией, управлением задачами и статусами' },
            ].map(item => (
              <div key={item.label} className={styles.roleItem}>
                <div className={styles.roleDot} />
                <div>
                  <div className={styles.roleItemLabel}>{item.label}</div>
                  <div className={styles.roleItemDesc}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.deco}>
          {'01  feature       todo\n02  bugfix        in_progress\n03  ui_change     review\n04  behavior      done'}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className={styles.formWrap}>
        <div className={styles.formInner}>
          <div className={styles.formEyebrow}>Регистрация</div>
          <h2 className={styles.formTitle}>Создать аккаунт.</h2>
          <p className={styles.formDesc}>Заполните форму и выберите роль.</p>

          {/* Role selector */}
          <div className={styles.roleTiles}>
            {roles.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, role: opt.value, specialization: '' }))}
                className={styles.roleTile}
                data-active={form.role === opt.value ? 'true' : 'false'}
              >
                <div className={styles.roleTileLabel}>{opt.label}</div>
                <div className={styles.roleTileDesc}>{opt.desc}</div>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Логин</label>
                <input
                  className={styles.input}
                  placeholder="username (мин. 3 символа)"
                  value={form.username}
                  onChange={set('username')}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className={styles.row2}>
                <div className={styles.field}>
                  <label className={styles.label}>Имя</label>
                  <input
                    className={styles.input}
                    placeholder="Иван"
                    value={form.name}
                    onChange={set('name')}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Фамилия</label>
                  <input
                    className={styles.input}
                    placeholder="Иванов"
                    value={form.surname}
                    onChange={set('surname')}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Пароль</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="мин. 6 символов"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                />
              </div>

              {form.role === 'developer' && (
                <div className={styles.field}>
                  <label className={styles.label}>Специализация</label>
                  <select
                    className={styles.select}
                    value={form.specialization}
                    onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                  >
                    <option value="">Не указана</option>
                    <option value="frontend">Фронтенд</option>
                    <option value="backend">Бэкенд</option>
                    <option value="qa">QA / Тестирование</option>
                    <option value="analytics">Аналитика</option>
                  </select>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}

              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className={styles.submitBtn}
              >
                {submitting ? 'Создаём аккаунт…' : 'Создать аккаунт'}
              </button>
            </div>
          </form>

          <div className={styles.footerLink}>
            Уже есть аккаунт?{' '}
            <Link to="/login">Войти</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
