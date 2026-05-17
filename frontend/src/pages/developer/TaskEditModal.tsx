import { useEffect, useMemo, useState } from 'react'
import { apiUpdateTask, apiDeleteTask } from '../../api/tasks'
import type { Task } from '../../api/tasks'
import type { TeamMember } from '../../api/teams'
import styles from './task-edit.module.scss'

const STATUSES = [
  { value: 'todo',        label: 'К выполнению' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review',      label: 'На проверке' },
  { value: 'done',        label: 'Выполнено' },
]

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
  task:        Task
  teamMembers: TeamMember[]
  onClose:     () => void
  onSave:      (updated: Task) => void
  onDelete:    (taskId: string) => void
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function TaskEditModal({ task, teamMembers, onClose, onSave, onDelete }: Props) {
  const [title,       setTitle]       = useState(task.title)
  const [description, setDescription] = useState(task.description ?? '')
  const [status,      setStatus]      = useState(task.status)
  const [priority,    setPriority]    = useState(task.priority)
  const [development, setDevelopment] = useState(task.development ?? '')
  const [assigneeId,  setAssigneeId]  = useState(task.assignee_id ?? '')

  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error,    setError]    = useState('')

  // Close on Escape
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

  // If current assignee no longer matches development → clear
  useEffect(() => {
    if (!assigneeId) return
    if (!developersForAssignee.some(d => d.id === assigneeId)) {
      setAssigneeId('')
    }
  }, [development, developersForAssignee, assigneeId])

  const trimmedTitle = title.trim()
  const canSave = trimmedTitle.length > 0 && !saving

  const handleDelete = async () => {
    if (deleting || saving) return
    const confirmed = window.confirm(
      `Удалить задачу «${task.title}»?\nЭто действие необратимо.`
    )
    if (!confirmed) return
    setDeleting(true)
    setError('')
    try {
      await apiDeleteTask(task.id)
      onDelete(task.id)
    } catch (err) {
      setError(errorMessage(err, 'Не удалось удалить задачу'))
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')

    // Send only changed fields
    const patch: Parameters<typeof apiUpdateTask>[1] = {}
    if (trimmedTitle !== task.title)                  patch.title       = trimmedTitle
    if (description !== (task.description ?? ''))     patch.description = description || null
    if (status      !== task.status)                  patch.status      = status
    if (priority    !== task.priority)                patch.priority    = priority
    if (development !== (task.development ?? ''))     patch.development = development || null
    if (assigneeId  !== (task.assignee_id ?? ''))     patch.assignee_id = assigneeId || null

    if (Object.keys(patch).length === 0) {
      onClose()
      return
    }

    try {
      const updated = await apiUpdateTask(task.id, patch)
      onSave(updated)
    } catch (err) {
      setError(errorMessage(err, 'Не удалось сохранить изменения'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.eyebrow}>Задача · #{task.id.slice(0, 6)}</div>
            <div className={styles.title}>Редактирование</div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <div className={styles.body}>
          <div className={styles.field}>
            <label className={styles.label}>Заголовок</label>
            <input
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={saving}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Описание</label>
            <textarea
              className={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Статус</label>
              <select
                className={styles.select}
                value={status}
                onChange={e => setStatus(e.target.value)}
                disabled={saving}
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Приоритет</label>
              <select
                className={styles.select}
                value={priority}
                onChange={e => setPriority(e.target.value)}
                disabled={saving}
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.row2}>
            <div className={styles.field}>
              <label className={styles.label}>Сфера</label>
              <select
                className={styles.select}
                value={development}
                onChange={e => setDevelopment(e.target.value)}
                disabled={saving}
              >
                {DEVELOPMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Исполнитель</label>
              <select
                className={styles.select}
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                disabled={saving}
              >
                <option value="">— не назначен —</option>
                {developersForAssignee.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.surname} · @{m.username}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Создана</span>
              <span className={styles.metaValue}>{formatDate(task.created_at)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Обновлена</span>
              <span className={styles.metaValue}>{formatDate(task.updated_at)}</span>
            </div>
            {task.request_id && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Запрос</span>
                <span className={styles.metaValue}>#{task.request_id.slice(0, 8)}</span>
              </div>
            )}
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>ID</span>
              <span className={styles.metaValue}>{task.id.slice(0, 8)}</span>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleDelete}
            disabled={saving || deleting}
          >
            {deleting ? 'Удаляем…' : 'Удалить'}
          </button>
          <div className={styles.footerSpacer} />
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onClose}
            disabled={saving || deleting}
          >
            Отмена
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSave}
            disabled={!canSave || deleting}
          >
            {saving ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  )
}
