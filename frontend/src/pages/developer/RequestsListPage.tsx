import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../../components/AppShell'
import type { AppDispatch, RootState } from '../../store'
import { fetchTeams } from '../../store/teamsSlice'
import { apiGetRequestsByTeam } from '../../api/requests'
import type { Request as TaskRequest } from '../../api/requests'
import { apiGetTasksByTeam } from '../../api/tasks'
import type { Task } from '../../api/tasks'
import styles from './dev-requests.module.scss'

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

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default function DevRequestsListPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items: teams, loaded: teamsLoaded } = useSelector((s: RootState) => s.teams)

  const [teamId,   setTeamId]   = useState<string>('')
  const [requests, setRequests] = useState<TaskRequest[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    if (!teamsLoaded) dispatch(fetchTeams())
  }, [teamsLoaded, dispatch])

  useEffect(() => {
    if (teams.length === 0) {
      setTeamId('')
      return
    }
    setTeamId(prev => (prev && teams.some(t => t.id === prev)) ? prev : teams[0].id)
  }, [teams])

  useEffect(() => {
    if (!teamId) {
      setRequests([])
      setTasks([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    Promise.all([
      apiGetRequestsByTeam(teamId),
      apiGetTasksByTeam(teamId),
    ])
      .then(([reqs, taskList]) => {
        if (cancelled) return
        setRequests(reqs)
        setTasks(taskList)
      })
      .catch(err => {
        if (!cancelled) setError(errorMessage(err, 'Не удалось загрузить данные'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [teamId])

  const progressByRequest = useMemo(() => {
    const map: Record<string, { total: number, done: number }> = {}
    for (const t of tasks) {
      if (!t.request_id) continue
      if (!map[t.request_id]) map[t.request_id] = { total: 0, done: 0 }
      map[t.request_id].total++
      if (t.status === 'done') map[t.request_id].done++
    }
    return map
  }, [tasks])

  return (
    <AppShell crumb="Разработчик" title="Запросы заказчиков">
      <div className={styles.toolbar}>
        <div className={styles.teamPicker}>
          <span className={styles.label}>Команда:</span>
          <select
            className={styles.select}
            value={teamId}
            onChange={e => setTeamId(e.target.value)}
            disabled={teams.length === 0}
          >
            {teams.length === 0 && <option value="">— команд нет —</option>}
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!teamId && teamsLoaded && (
        <div className={styles.noTeam}>
          <div className={styles.emptyHeader}>команд пока нет</div>
          <p className={styles.emptyText}>
            Дождитесь, пока заказчик добавит вас в свою команду.
          </p>
        </div>
      )}

      {teamId && !loading && requests.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyHeader}>запросов нет</div>
          <p className={styles.emptyText}>
            В этой команде пока не создано ни одного запроса.
          </p>
        </div>
      )}

      {teamId && requests.length > 0 && (
        <div className={styles.list}>
          {requests.map(r => {
            const cls = r.classification ?? 'unknown'
            const { total = 0, done = 0 } = progressByRequest[r.id] ?? {}
            const pct = total === 0 ? 0 : Math.round((done / total) * 100)
            const complete = total > 0 && done === total
            return (
              <div key={r.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={`${styles.badge} ${CLASSIFICATION_CLASS[cls] ?? styles.clsUnknown}`}>
                    {CLASSIFICATION_LABEL[cls] ?? cls}
                  </span>
                  <span className={styles.cardTitle}>
                    {r.name ?? r.area ?? 'без названия'}
                  </span>
                </div>

                <div className={styles.cardMeta}>
                  область: {r.area ?? '—'} · создан {formatDate(r.created_at)}
                </div>

                <div className={styles.progressRow}>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${complete ? styles.progressDone : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className={styles.progressStats}>
                    <span className={styles.progressPercent}>{pct}%</span>
                    <span className={styles.progressCounts}>{done} из {total}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
