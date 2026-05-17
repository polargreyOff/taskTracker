import { useEffect, useMemo, useState } from 'react'
import { apiCreateTask } from '../../api/tasks'
import type { Task } from '../../api/tasks'
import type { TeamMember } from '../../api/teams'
import styles from './task-edit.module.scss'

const PRIORITIES = [
  { value: 'low',    label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high',   label: 'Высокий' },
  { value: 'urgent', label: 'Срочный' },
]

const DEVELOPMENTS = [
  { value: '',          label: '— не указана —' },
  { value: 'frontend',  label: 'Frontend' },
  { value: 'backend',   label: 'Backend' },
  { value: 'qa',        label: 'QA' },
  { value: 'analytics', label: 'Analytics' },
]

interface Props {
  teamId:      string
  teamMembers: TeamMember[]
  onClose:     () => void
  onCreate:    (task: Task) => void
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

export default function TaskCreateModal({ teamId, teamMembers, onClose, onCreate }: Props) {
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [priority,    setPriority]    = useState('medium')
  const [development, setDevelopment] = useState('')
  const [assigneeId,  setAssigneeId]  = useState('')

  const [creating, setCreating] = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const developersForAssignee = useMemo(() => {
    return teamMembers.filter(m => {
      if (m.role !== 'developer') return false
      if (development && m.specialization !== development) return false
      return true
    })
  }, [teamMembers, development])

  useEffect(() => {
    if (!assigneeId) return
    if (!developersForAssignee.some(d => d.id === assigneeId)) {
      setAssigneeId('')
    }
  }, [development, developersForAssignee, assigneeId])

  const trimmedTitle = title.trim()
  const canCreate = trimmedTitle.length > 0 && !creating

  const handleCreate = async () => {
    if (!canCreate) return
    setCreating(true)
    setError('')
    try {
      const task = await apiCreateTask({
        team_id:     teamId,
        title:       trimmedTitle,
        description: description.trim() || null,
        priority,
        development: development || null,
        assignee_id: assigneeId || null,
      })
      onCreate(task)
    } catch (err) {
      setError(errorMessage(err, 'Не удалось создать задачу'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.eyebrow}>Новая задача</div>
            <div className={styles.title}>Создание</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Заголовок</label>
            <input
              className={styles.input}
              placeholder="что нужно сделать"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={creating}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Описание</label>
            <textarea
              className={styles.textarea}
              placeholder="детали, контекст, ссылки (необязательно)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={creating}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Приоритет</label>
              <select
                className={styles.select}
                value={priority}
                onChange={e => setPriority(e.target.value)}
                disabled={creating}
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Сфера</label>
              <select
                className={styles.select}
                value={development}
                onChange={e => setDevelopment(e.target.value)}
                disabled={creating}
              >
                {DEVELOPMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Исполнитель</label>
            <select
              className={styles.select}
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              disabled={creating}
            >
              <option value="">— не назначен —</option>
              {developersForAssignee.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.surname} · @{m.username}
                </option>
              ))}
            </select>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
            disabled={creating}
          >
            Отмена
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleCreate}
            disabled={!canCreate}
          >
            {creating ? 'Создаём…' : 'Создать задачу'}
          </button>
        </div>
      </div>
    </div>
  )
}
