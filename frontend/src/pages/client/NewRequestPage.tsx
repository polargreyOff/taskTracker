import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../../components/AppShell'
import type { AppDispatch, RootState } from '../../store'
import { fetchTeams } from '../../store/teamsSlice'
import { apiCreateRequest } from '../../api/requests'
import type { CreateRequestResult } from '../../api/requests'
import styles from './new-request.module.scss'

interface OptionItem { value: string, label: string, desc?: string }

const CHANGE_TYPES: OptionItem[] = [
  { value: 'feature',         label: 'Появится новая возможность', desc: 'feature' },
  { value: 'ui_change',       label: 'Изменится внешний вид',       desc: 'ui_change' },
  { value: 'behavior_change', label: 'Изменится поведение системы', desc: 'behavior_change' },
  { value: 'bugfix',          label: 'Исправить ошибку',            desc: 'bugfix' },
  { value: 'unknown',         label: 'Не знаю',                     desc: 'фолбэк по умолчанию' },
]

const AREA_TYPES: OptionItem[] = [
  { value: 'page',         label: 'Страница' },
  { value: 'section',      label: 'Раздел системы' },
  { value: 'data',         label: 'Данные' },
  { value: 'interface',    label: 'Интерфейс / UI-элемент' },
  { value: 'integration',  label: 'Интеграция' },
  { value: 'notification', label: 'Уведомления' },
  { value: 'access',       label: 'Права доступа' },
  { value: 'report',       label: 'Отчёт' },
  { value: 'payment',      label: 'Оплата' },
  { value: 'search',       label: 'Поиск' },
  { value: 'profile',      label: 'Профиль' },
  { value: 'admin_panel',  label: 'Админ-панель' },
  { value: 'content',      label: 'Контент' },
  { value: 'workflow',     label: 'Бизнес-процесс' },
  { value: 'unknown',      label: 'Не знаю' },
]

const AUDIENCES: OptionItem[] = [
  { value: 'clients', label: 'Клиенты' },
  { value: 'staff',   label: 'Сотрудники' },
  { value: 'admins',  label: 'Администраторы' },
  { value: 'all',     label: 'Все пользователи' },
  { value: 'unknown', label: 'Не знаю' },
]

const URGENCIES: OptionItem[] = [
  { value: 'not_urgent', label: 'Не срочно',  desc: 'низкий приоритет' },
  { value: 'desired',    label: 'Желательно', desc: 'средний приоритет' },
  { value: 'urgent',     label: 'Срочно',     desc: 'высокий приоритет' },
]

const STEPS = [
  { key: 'team',     label: 'Команда' },
  { key: 'q1',       label: 'Что вы хотите сделать?' },
  { key: 'q2',       label: 'Что должно измениться?' },
  { key: 'q3',       label: 'К чему относится?' },
  { key: 'q4',       label: 'Как это должно работать?' },
  { key: 'q5',       label: 'Кто будет пользоваться?' },
  { key: 'q6',       label: 'Насколько это срочно?' },
] as const

const TOTAL = STEPS.length

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

function labelFor(list: OptionItem[], value: string): string {
  return list.find(o => o.value === value)?.label ?? ''
}

export default function NewRequestPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { items: teams, loaded: teamsLoaded } = useSelector((s: RootState) => s.teams)

  const [step, setStep] = useState(1)

  const [teamId,           setTeamId]           = useState('')
  const [requestText,      setRequestText]      = useState('')
  const [changeType,       setChangeType]       = useState('')
  const [areaType,         setAreaType]         = useState('')
  const [areaName,         setAreaName]         = useState('')
  const [expectedBehavior, setExpectedBehavior] = useState('')
  const [targetAudience,   setTargetAudience]   = useState('')
  const [urgency,          setUrgency]          = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState('')
  const [result,     setResult]     = useState<CreateRequestResult | null>(null)

  useEffect(() => {
    if (!teamsLoaded) dispatch(fetchTeams())
  }, [teamsLoaded, dispatch])

  const stepValid = (s: number): boolean => {
    switch (s) {
      case 1: return teamId !== ''
      case 2: return requestText.trim().length >= 3
      case 3: return changeType !== ''
      case 4: return areaType !== ''
      case 5: return expectedBehavior.trim().length >= 3
      case 6: return targetAudience !== ''
      case 7: return urgency !== ''
      default: return false
    }
  }

  const canGoNext = stepValid(step)
  const canSubmit = [1, 2, 3, 4, 5, 6, 7].every(stepValid)

  const goNext = () => {
    if (step < TOTAL) setStep(step + 1)
  }
  const goBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const data = await apiCreateRequest({
        team_id: teamId,
        answers: {
          request_text:      requestText.trim(),
          change_type:       changeType,
          area_type:         areaType,
          area_name:         areaName.trim() || undefined,
          expected_behavior: expectedBehavior.trim(),
          target_audience:   targetAudience,
          urgency,
        },
      })
      setResult(data)
    } catch (err) {
      setError(errorMessage(err, 'Не удалось создать запрос'))
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <AppShell crumb="Заказчик / Создать запрос" title="Запрос создан">
        <div className={styles.success}>
          <div className={styles.successEyebrow}>Готово</div>
          <div className={styles.successTitle}>Запрос создан и задачи сгенерированы</div>
          <p className={styles.successDesc}>
            Шаблон: «{result.template_name}» · классификация: {result.classification} · область: {result.area}
          </p>

          <div className={styles.successStats}>
            <div className={styles.successStat}>
              <div className={styles.successStatValue}>{result.tasks.length}</div>
              <div className={styles.successStatLabel}>задач</div>
            </div>
            <div className={styles.successStat}>
              <div className={styles.successStatValue}>{(result.confidence * 100).toFixed(0)}%</div>
              <div className={styles.successStatLabel}>уверенность</div>
            </div>
          </div>

          <div className={styles.successActions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={() => navigate('/client/requests')}
            >
              Перейти к запросам
            </button>
          </div>
        </div>
      </AppShell>
    )
  }

  const summaryItems: Array<{ label: string, value: string }> = [
    { label: 'Команда',         value: labelFor(teams.map(t => ({ value: t.id, label: t.name })), teamId) },
    { label: 'Запрос',          value: requestText.trim().slice(0, 40) + (requestText.length > 40 ? '…' : '') },
    { label: 'Тип изменения',   value: labelFor(CHANGE_TYPES, changeType) },
    { label: 'Область',         value: [labelFor(AREA_TYPES, areaType), areaName.trim()].filter(Boolean).join(' · ') },
    { label: 'Как работает',    value: expectedBehavior.trim().slice(0, 40) + (expectedBehavior.length > 40 ? '…' : '') },
    { label: 'Кто пользуется',  value: labelFor(AUDIENCES, targetAudience) },
    { label: 'Срочность',       value: labelFor(URGENCIES, urgency) },
  ]

  return (
    <AppShell crumb="Заказчик" title="Создать запрос">
      <div className={styles.layout}>
        {/* ── Main: progress + question ── */}
        <div className={styles.main}>
          <div className={styles.progressRow}>
            <span className={styles.progressLabel}>Шаг {step} / {TOTAL}</span>
            <div className={styles.progressDots}>
              {Array.from({ length: TOTAL }, (_, i) => i + 1).map((n, i) => (
                <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button
                    type="button"
                    className={styles.dot}
                    data-state={n === step ? 'current' : n < step ? 'done' : 'pending'}
                    onClick={() => setStep(n)}
                    title={STEPS[n - 1].label}
                  >
                    {n}
                  </button>
                  {i < TOTAL - 1 && <span className={styles.connector} />}
                </span>
              ))}
            </div>
          </div>

          {/* Step 1: Team */}
          {step === 1 && (
            <>
              <div className={styles.eyebrow}>Шаг 1</div>
              <div className={styles.title}>Выберите команду</div>
              <p className={styles.hint}>В рамках которой создаём запрос.</p>

              {teams.length === 0 && (
                <div className={styles.teamEmpty}>
                  У вас ещё нет команд. Создайте команду на вкладке «Моя команда».
                </div>
              )}

              {teams.length > 0 && (
                <div className={styles.teamGrid}>
                  {teams.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={styles.teamCard}
                      data-selected={teamId === t.id ? 'true' : 'false'}
                      onClick={() => setTeamId(t.id)}
                    >
                      <div className={styles.teamCardName}>{t.name}</div>
                      <div className={styles.teamCardMeta}>
                        {t.members.length} {t.members.length === 1 ? 'участник' : 'участников'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Step 2: Q1 — request_text */}
          {step === 2 && (
            <>
              <div className={styles.eyebrow}>Вопрос 01</div>
              <div className={styles.title}>Что вы хотите сделать?</div>
              <p className={styles.hint}>Кратко опишите, что нужно добавить, изменить или исправить.</p>

              <div className={styles.field}>
                <textarea
                  className={styles.textarea}
                  placeholder="Например: добавить возможность экспорта отчётов в PDF"
                  value={requestText}
                  onChange={e => setRequestText(e.target.value)}
                  autoFocus
                />
              </div>
            </>
          )}

          {/* Step 3: Q2 — change_type */}
          {step === 3 && (
            <>
              <div className={styles.eyebrow}>Вопрос 02</div>
              <div className={styles.title}>Что должно измениться?</div>
              <p className={styles.hint}>Выберите наиболее подходящий вариант.</p>

              <div className={styles.options}>
                {CHANGE_TYPES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={styles.option}
                    data-selected={changeType === o.value ? 'true' : 'false'}
                    onClick={() => setChangeType(o.value)}
                  >
                    <span className={styles.optionMark} />
                    <div className={styles.optionMain}>
                      <div className={styles.optionLabel}>{o.label}</div>
                      {o.desc && <div className={styles.optionDesc}>{o.desc}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 4: Q3 — area_type + area_name */}
          {step === 4 && (
            <>
              <div className={styles.eyebrow}>Вопрос 03</div>
              <div className={styles.title}>К чему относится этот запрос?</div>
              <p className={styles.hint}>Тип объекта и (необязательно) название.</p>

              <div className={styles.hybrid}>
                <div className={styles.field}>
                  <label className={styles.label}>Тип</label>
                  <select
                    className={styles.select}
                    value={areaType}
                    onChange={e => setAreaType(e.target.value)}
                  >
                    <option value="">— выберите —</option>
                    {AREA_TYPES.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Название (необязательно)</label>
                  <input
                    className={styles.input}
                    placeholder="например: отчёты, корзина, профиль"
                    value={areaName}
                    onChange={e => setAreaName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 5: Q4 — expected_behavior */}
          {step === 5 && (
            <>
              <div className={styles.eyebrow}>Вопрос 04</div>
              <div className={styles.title}>Как это должно работать?</div>
              <p className={styles.hint}>Что пользователь сможет делать после изменений?</p>

              <div className={styles.field}>
                <textarea
                  className={styles.textarea}
                  placeholder="Например: пользователь нажимает кнопку и скачивает PDF с отчётом"
                  value={expectedBehavior}
                  onChange={e => setExpectedBehavior(e.target.value)}
                  autoFocus
                />
              </div>
            </>
          )}

          {/* Step 6: Q5 — target_audience */}
          {step === 6 && (
            <>
              <div className={styles.eyebrow}>Вопрос 05</div>
              <div className={styles.title}>Кто будет пользоваться?</div>
              <p className={styles.hint}>Целевая аудитория для этого изменения.</p>

              <div className={styles.options}>
                {AUDIENCES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={styles.option}
                    data-selected={targetAudience === o.value ? 'true' : 'false'}
                    onClick={() => setTargetAudience(o.value)}
                  >
                    <span className={styles.optionMark} />
                    <div className={styles.optionMain}>
                      <div className={styles.optionLabel}>{o.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 7: Q6 — urgency */}
          {step === 7 && (
            <>
              <div className={styles.eyebrow}>Вопрос 06</div>
              <div className={styles.title}>Насколько это срочно?</div>
              <p className={styles.hint}>Срочность повлияет на приоритет сгенерированных задач.</p>

              <div className={styles.options}>
                {URGENCIES.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    className={styles.option}
                    data-selected={urgency === o.value ? 'true' : 'false'}
                    onClick={() => setUrgency(o.value)}
                  >
                    <span className={styles.optionMark} />
                    <div className={styles.optionMain}>
                      <div className={styles.optionLabel}>{o.label}</div>
                      {o.desc && <div className={styles.optionDesc}>{o.desc}</div>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className={styles.spacer} />

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.nav}>
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost}`}
              onClick={() => navigate('/client/requests')}
            >
              Отмена
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={goBack}
                disabled={step === 1}
              >
                Назад
              </button>
              {step < TOTAL ? (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  Дальше →
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                >
                  {submitting ? 'Создаём…' : 'Создать запрос'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Summary sidebar ── */}
        <aside className={styles.summary}>
          <div className={styles.summaryHeader}>Ваши ответы</div>
          {summaryItems.map((item, i) => {
            const n = i + 1
            const filled = item.value.length > 0
            return (
              <button
                key={item.label}
                type="button"
                className={styles.summaryItem}
                data-current={n === step ? 'true' : 'false'}
                data-state={filled ? 'answered' : 'pending'}
                onClick={() => setStep(n)}
              >
                <span className={styles.summaryIcon}>{filled ? '✓' : ''}</span>
                <div className={styles.summaryBody}>
                  <div className={styles.summaryLabel}>{item.label}</div>
                  <div className={styles.summaryValue}>{item.value || 'не указано'}</div>
                </div>
              </button>
            )
          })}
        </aside>
      </div>
    </AppShell>
  )
}
