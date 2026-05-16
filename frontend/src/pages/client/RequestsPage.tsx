import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../../components/AppShell'
import type { AppDispatch, RootState } from '../../store'
import { fetchTeams } from '../../store/teamsSlice'
import { apiGetMyRequests } from '../../api/requests'
import type { Request as ClientRequest } from '../../api/requests'
import { apiGetTasksByTeam } from '../../api/tasks'
import type { Task } from '../../api/tasks'
import styles from './requests.module.scss'

const CLASSIFICATION_LABEL: Record<string, string> = {
  feature:         'Новая функция',
  ui_change:       'UI-изменение',
  behavior_change: 'Поведение',
  bugfix:          'Ошибка',
}

const CLASSIFICATION_CLASS: Record<string, string> = {
  feature:         styles.clsFeature,
  ui_change:       styles.clsUiChange,
  behavior_change: styles.clsBehaviorChange,
  bugfix:          styles.clsBugfix,
}

const DEV_LABEL: Record<string, string> = {
  frontend:  'frontend',
  backend:   'backend',
  qa:        'qa',
  analytics: 'analytics',
}

const DEV_CLASS: Record<string, string> = {
  frontend:  styles.devFrontend,
  backend:   styles.devBackend,
  qa:        styles.devQa,
  analytics: styles.devAnalytics,
}

const PRIORITY_LABEL: Record<string, string> = {
  low:    'низкий',
  medium: 'средний',
  high:   'высокий',
  urgent: 'срочный',
}

const PRIORITY_CLASS: Record<string, string> = {
  low:    styles.priLow,
  medium: styles.priMedium,
  high:   styles.priHigh,
  urgent: styles.priUrgent,
}

const STATUS_COLUMNS: Array<{ value: string, label: string, hue: number }> = [
  { value: 'todo',        label: 'К выполнению', hue: 255 },
  { value: 'in_progress', label: 'В работе',     hue: 70 },
  { value: 'review',      label: 'На проверке',  hue: 305 },
  { value: 'done',        label: 'Выполнено',    hue: 155 },
]

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

function formatRelative(iso: string): string {
  const date = new Date(iso)
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000)
  if (diffMin < 1)    return 'только что'
  if (diffMin < 60)   return `${diffMin} мин назад`
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} ч назад`
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ClientRequestsPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const { items: teams, loaded: teamsLoaded } = useSelector((s: RootState) => s.teams)

  const [requests,  setRequests]  = useState<ClientRequest[]>([])
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')

  const [teamFilter,        setTeamFilter]        = useState<string>('all')
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)

  const [tasksByTeam, setTasksByTeam] = useState<Record<string, Task[]>>({})
  const [tasksError,  setTasksError]  = useState('')

  useEffect(() => {
    if (!teamsLoaded) dispatch(fetchTeams())
  }, [teamsLoaded, dispatch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    apiGetMyRequests()
      .then(data => {
        if (cancelled) return
        setRequests(data)
      })
      .catch(err => {
        if (!cancelled) setLoadError(errorMessage(err, 'Не удалось загрузить запросы'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const teamById = useMemo(
    () => Object.fromEntries(teams.map(t => [t.id, t])),
    [teams],
  )

  const filteredRequests = useMemo(() => {
    if (teamFilter === 'all') return requests
    return requests.filter(r => r.team_id === teamFilter)
  }, [requests, teamFilter])

  // Keep selection in sync with the filtered list:
  // - if filtered is empty → clear
  // - if currently selected isn't in filtered → pick first
  useEffect(() => {
    if (filteredRequests.length === 0) {
      setSelectedRequestId(null)
      return
    }
    setSelectedRequestId(prev =>
      (prev && filteredRequests.some(r => r.id === prev)) ? prev : filteredRequests[0].id
    )
  }, [filteredRequests])

  const selectedRequest = useMemo(
    () => requests.find(r => r.id === selectedRequestId) ?? null,
    [requests, selectedRequestId],
  )

  // Load tasks for selected request's team (cached per team)
  useEffect(() => {
    const teamId = selectedRequest?.team_id
    if (!teamId || tasksByTeam[teamId]) return

    let cancelled = false
    apiGetTasksByTeam(teamId)
      .then(tasks => {
        if (cancelled) return
        setTasksByTeam(prev => ({ ...prev, [teamId]: tasks }))
        setTasksError('')
      })
      .catch(err => {
        if (!cancelled) setTasksError(errorMessage(err, 'Не удалось загрузить задачи'))
      })
    return () => { cancelled = true }
  }, [selectedRequest, tasksByTeam])

  const selectedTasks = useMemo<Task[]>(() => {
    if (!selectedRequest?.team_id) return []
    const teamTasks = tasksByTeam[selectedRequest.team_id]
    if (!teamTasks) return []
    return teamTasks
      .filter(t => t.request_id === selectedRequest.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, [selectedRequest, tasksByTeam])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { todo: 0, in_progress: 0, review: 0, done: 0 }
    for (const t of selectedTasks) {
      if (t.status in counts) counts[t.status]++
    }
    return counts
  }, [selectedTasks])

  return (
    <AppShell
      crumb="Заказчик"
      title="Мои запросы"
      action={
        <button
          onClick={() => navigate('/client/requests/new')}
          className={styles.btnPrimary}
        >
          + Новый запрос
        </button>
      }
    >
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <span className={styles.label}>Команда:</span>
          <select
            className={styles.select}
            value={teamFilter}
            onChange={e => setTeamFilter(e.target.value)}
          >
            <option value="all">Все команды</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className={styles.label}>
          Всего: {filteredRequests.length}
        </div>
      </div>

      {loadError && <div className={styles.error}>{loadError}</div>}

      <div className={styles.layout}>
        {/* ── List ── */}
        <div className={styles.list}>
          {loading && (
            <div className={styles.empty}>
              <div className={styles.emptyHeader}>загрузка</div>
            </div>
          )}

          {!loading && filteredRequests.length === 0 && (
            <div className={styles.empty}>
              <div className={styles.emptyHeader}>запросов нет</div>
              <div className={styles.emptyText}>
                {teamFilter === 'all'
                  ? 'Создайте первый запрос — система сгенерирует задачи автоматически.'
                  : 'Для этой команды запросов ещё нет.'}
              </div>
            </div>
          )}

          {!loading && filteredRequests.map(r => {
            const team = r.team_id ? teamById[r.team_id] : null
            const cls = r.classification ?? 'unknown'
            return (
              <button
                key={r.id}
                type="button"
                className={styles.item}
                data-active={r.id === selectedRequestId ? 'true' : 'false'}
                onClick={() => setSelectedRequestId(r.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={`${styles.badge} ${CLASSIFICATION_CLASS[cls] ?? styles.clsUnknown}`}>
                    {CLASSIFICATION_LABEL[cls] ?? cls}
                  </span>
                  {team && (
                    <span className={`${styles.badge} ${styles.badgeTeam}`}>{team.name}</span>
                  )}
                </div>
                <div className={styles.itemTitle}>
                  {r.name ?? r.area ?? 'без названия'}
                </div>
                <div className={styles.itemFooter}>
                  <span>{r.area ?? '—'}</span>
                  <span>{formatRelative(r.created_at)}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Detail ── */}
        <section className={styles.detail}>
          {!selectedRequest && !loading && (
            <div className={styles.detailEmpty}>
              <span className={styles.emptyHeader}>Запрос не выбран</span>
              <p className={styles.emptyText}>
                Выберите запрос слева, чтобы увидеть статусы сгенерированных задач.
              </p>
            </div>
          )}

          {selectedRequest && (
            <>
              <div className={styles.detailHeader}>
                <div className={styles.detailTitleRow}>
                  <span className={`${styles.badge} ${CLASSIFICATION_CLASS[selectedRequest.classification ?? ''] ?? styles.clsUnknown}`}>
                    {CLASSIFICATION_LABEL[selectedRequest.classification ?? ''] ?? selectedRequest.classification}
                  </span>
                  {selectedRequest.team_id && teamById[selectedRequest.team_id] && (
                    <span className={`${styles.badge} ${styles.badgeTeam}`}>
                      {teamById[selectedRequest.team_id].name}
                    </span>
                  )}
                </div>
                <div className={styles.detailTitle}>
                  {selectedRequest.name ?? selectedRequest.area ?? 'без названия'}
                </div>
                <div className={styles.detailMeta}>
                  область: {selectedRequest.area ?? '—'} · создан {formatRelative(selectedRequest.created_at)}
                </div>
              </div>

              {tasksError && <div className={styles.error}>{tasksError}</div>}

              <div className={styles.sectionTitle}>Статусы задач</div>
              <div className={styles.stats}>
                {STATUS_COLUMNS.map(col => (
                  <div key={col.value} className={styles.statBox}>
                    <span className={styles.statLabel}>
                      <span
                        className={styles.statDot}
                        style={{ background: `oklch(0.55 0.14 ${col.hue})` }}
                      />
                      {col.label}
                    </span>
                    <span className={styles.statValue}>{statusCounts[col.value] ?? 0}</span>
                  </div>
                ))}
              </div>

              <div className={styles.sectionTitle}>Задачи ({selectedTasks.length})</div>
              <div className={styles.tasks}>
                {selectedTasks.map(t => {
                  const statusCol = STATUS_COLUMNS.find(c => c.value === t.status)
                  const dev = t.development ?? 'unknown'
                  return (
                    <div key={t.id} className={styles.task}>
                      <span
                        className={styles.taskDot}
                        style={{ background: `oklch(0.55 0.14 ${statusCol?.hue ?? 0})` }}
                        title={statusCol?.label ?? t.status}
                      />
                      <span className={styles.taskTitle}>{t.title}</span>
                      <span className={`${styles.taskTag} ${DEV_CLASS[dev] ?? styles.devUnknown}`}>
                        {DEV_LABEL[dev] ?? '—'}
                      </span>
                      <span className={`${styles.taskTag} ${PRIORITY_CLASS[t.priority] ?? styles.priMedium}`}>
                        {PRIORITY_LABEL[t.priority] ?? t.priority}
                      </span>
                    </div>
                  )
                })}
                {selectedTasks.length === 0 && (
                  <div className={styles.detailEmpty}>
                    <span className={styles.emptyText}>Задач нет</span>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
