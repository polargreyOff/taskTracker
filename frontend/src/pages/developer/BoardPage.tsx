import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../../components/AppShell'
import type { AppDispatch, RootState } from '../../store'
import { fetchTeams } from '../../store/teamsSlice'
import { useAuth } from '../../hooks/useAuth'
import { apiGetTasksByTeam, apiUpdateTask } from '../../api/tasks'
import type { Task } from '../../api/tasks'
import type { TeamMember } from '../../api/teams'
import styles from './board.module.scss'

const COLUMNS: Array<{ value: string, label: string, hue: number }> = [
  { value: 'todo',        label: 'К выполнению', hue: 255 },
  { value: 'in_progress', label: 'В работе',     hue: 70 },
  { value: 'review',      label: 'На проверке',  hue: 305 },
  { value: 'done',        label: 'Выполнено',    hue: 155 },
]

const PRIORITY_OPTIONS = [
  { value: 'all',    label: 'Все' },
  { value: 'urgent', label: 'Срочные' },
  { value: 'high',   label: 'Высокий' },
  { value: 'medium', label: 'Средний' },
  { value: 'low',    label: 'Низкий' },
]

const SPHERE_OPTIONS = [
  { value: 'all',       label: 'Все' },
  { value: 'frontend',  label: 'Frontend' },
  { value: 'backend',   label: 'Backend' },
  { value: 'qa',        label: 'QA' },
  { value: 'analytics', label: 'Analytics' },
]

const ASSIGNEE_OPTIONS = [
  { value: 'all',        label: 'Все' },
  { value: 'mine',       label: 'Только мои' },
  { value: 'unassigned', label: 'Без исполнителя' },
]

const PRIORITY_LABEL: Record<string, string> = {
  low: 'низкий', medium: 'средний', high: 'высокий', urgent: 'срочный',
}

const PRIORITY_CLASS: Record<string, string> = {
  low: styles.priLow, medium: styles.priMedium, high: styles.priHigh, urgent: styles.priUrgent,
}

const DEV_CLASS: Record<string, string> = {
  frontend: styles.devFrontend, backend: styles.devBackend,
  qa: styles.devQa, analytics: styles.devAnalytics,
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

function initials(name: string, surname: string): string {
  return (name[0] ?? '') + (surname[0] ?? '')
}

export default function BoardPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useAuth()
  const { items: teams, loaded: teamsLoaded } = useSelector((s: RootState) => s.teams)

  const [teamId,   setTeamId]   = useState<string>('')
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const [priorityFilter, setPriorityFilter] = useState('all')
  const [sphereFilter,   setSphereFilter]   = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  const [draggingId,     setDraggingId]     = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const moveTask = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return

    const prevTasks = tasks
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))

    try {
      const updated = await apiUpdateTask(taskId, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
    } catch (err) {
      setTasks(prevTasks)
      setError(errorMessage(err, 'Не удалось переместить задачу'))
    }
  }

  const onTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(taskId)
  }

  const onTaskDragEnd = () => {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const onColumnDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== status) setDragOverColumn(status)
  }

  const onColumnDragLeave = (e: React.DragEvent, status: string) => {
    // Only clear when leaving the column itself, not its children
    if (!e.currentTarget.contains(e.relatedTarget as Node) && dragOverColumn === status) {
      setDragOverColumn(null)
    }
  }

  const onColumnDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain')
    setDraggingId(null)
    setDragOverColumn(null)
    if (taskId) moveTask(taskId, status)
  }

  useEffect(() => {
    if (!teamsLoaded) dispatch(fetchTeams())
  }, [teamsLoaded, dispatch])

  // Default team selection when teams arrive
  useEffect(() => {
    if (teams.length === 0) {
      setTeamId('')
      return
    }
    setTeamId(prev => (prev && teams.some(t => t.id === prev)) ? prev : teams[0].id)
  }, [teams])

  // Fetch tasks when team changes
  useEffect(() => {
    if (!teamId) {
      setTasks([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    apiGetTasksByTeam(teamId)
      .then(data => {
        if (cancelled) return
        setTasks(data)
      })
      .catch(err => {
        if (!cancelled) setError(errorMessage(err, 'Не удалось загрузить задачи'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [teamId])

  const memberById = useMemo<Record<string, TeamMember>>(() => {
    const team = teams.find(t => t.id === teamId)
    if (!team) return {}
    return Object.fromEntries(team.members.map(m => [m.id, m]))
  }, [teams, teamId])

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
      if (sphereFilter   !== 'all' && t.development !== sphereFilter) return false
      if (assigneeFilter === 'mine'       && t.assignee_id !== user?.id) return false
      if (assigneeFilter === 'unassigned' && t.assignee_id !== null) return false
      return true
    })
  }, [tasks, priorityFilter, sphereFilter, assigneeFilter, user])

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], in_progress: [], review: [], done: [] }
    for (const t of filteredTasks) {
      if (t.status in map) map[t.status].push(t)
    }
    return map
  }, [filteredTasks])

  return (
    <AppShell crumb="Разработчик" title="Kanban-доска">
      <div className={styles.toolbar}>
        {/* Team picker — separated */}
        <div className={styles.teamPicker}>
          <span className={styles.label}>Команда:</span>
          <select
            className={`${styles.select} ${styles.teamSelect}`}
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

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Приоритет:</span>
            <select
              className={styles.select}
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Сфера:</span>
            <select
              className={styles.select}
              value={sphereFilter}
              onChange={e => setSphereFilter(e.target.value)}
            >
              {SPHERE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.label}>Исполнитель:</span>
            <select
              className={styles.select}
              value={assigneeFilter}
              onChange={e => setAssigneeFilter(e.target.value)}
            >
              {ASSIGNEE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {!teamId && teamsLoaded && (
        <div className={styles.noTeam}>
          <div className={styles.noTeamHeader}>команд пока нет</div>
          <p className={styles.noTeamText}>
            Дождитесь, пока заказчик добавит вас в свою команду — после этого
            задачи появятся на доске.
          </p>
        </div>
      )}

      {teamId && (
        <div className={styles.board}>
          {COLUMNS.map(col => (
            <div
              key={col.value}
              className={styles.column}
              data-drag-over={dragOverColumn === col.value ? 'true' : 'false'}
              onDragOver={e => onColumnDragOver(e, col.value)}
              onDragLeave={e => onColumnDragLeave(e, col.value)}
              onDrop={e => onColumnDrop(e, col.value)}
            >
              <div className={styles.columnHeader}>
                <span
                  className={styles.columnDot}
                  style={{ background: `oklch(0.55 0.14 ${col.hue})` }}
                />
                <span className={styles.columnTitle}>{col.label}</span>
                <span className={styles.columnCount}>{tasksByStatus[col.value]?.length ?? 0}</span>
              </div>
              <div className={styles.tasks}>
                {(tasksByStatus[col.value] ?? []).map(task => {
                  const assignee = task.assignee_id ? memberById[task.assignee_id] : null
                  const dev = task.development ?? 'unknown'
                  return (
                    <div
                      key={task.id}
                      className={styles.task}
                      draggable
                      data-dragging={draggingId === task.id ? 'true' : 'false'}
                      onDragStart={e => onTaskDragStart(e, task.id)}
                      onDragEnd={onTaskDragEnd}
                    >
                      <div className={styles.taskHeader}>
                        <span className={styles.taskId}>#{task.id.slice(0, 6)}</span>
                        <span className={`${styles.tag} ${PRIORITY_CLASS[task.priority] ?? styles.priMedium}`}>
                          {PRIORITY_LABEL[task.priority] ?? task.priority}
                        </span>
                      </div>
                      <div className={styles.taskTitle}>{task.title}</div>
                      <div className={styles.taskFooter}>
                        <span className={`${styles.tag} ${DEV_CLASS[dev] ?? styles.devUnknown}`}>
                          {dev}
                        </span>
                        {assignee ? (
                          <span className={styles.taskAssignee}>
                            <span className={styles.avatar}>{initials(assignee.name, assignee.surname)}</span>
                            <span>@{assignee.username}</span>
                          </span>
                        ) : (
                          <span className={styles.taskAssignee}>
                            <span className={`${styles.avatar} ${styles.avatarEmpty}`}>?</span>
                            <span>не назначен</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {(tasksByStatus[col.value]?.length ?? 0) === 0 && !loading && (
                  <div className={styles.empty}>пусто</div>
                )}
                {loading && (tasksByStatus[col.value]?.length ?? 0) === 0 && (
                  <div className={styles.empty}>загрузка...</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
