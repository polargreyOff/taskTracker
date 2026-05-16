import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../../components/AppShell'
import { apiAddMember, apiCreateTeam } from '../../api/teams'
import type { AppDispatch, RootState } from '../../store'
import { fetchTeams } from '../../store/teamsSlice'
import styles from './teams.module.css'

const SPECIALIZATIONS = [
  { value: 'frontend',  label: 'Фронтенд' },
  { value: 'backend',   label: 'Бэкенд' },
  { value: 'qa',        label: 'QA / Тестирование' },
  { value: 'analytics', label: 'Аналитика' },
]

const SPEC_LABEL: Record<string, string> = {
  client:    'Заказчик',
  frontend:  'Фронт',
  backend:   'Бэк',
  qa:        'QA',
  analytics: 'Аналитика',
}

const SPEC_CLASS: Record<string, string> = {
  client:    styles.specClient,
  frontend:  styles.specFrontend,
  backend:   styles.specBackend,
  qa:        styles.specQa,
  analytics: styles.specAnalytics,
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback
}

function initials(name: string, surname: string): string {
  return (name[0] ?? '') + (surname[0] ?? '')
}

export default function TeamsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items: teams, loading, loaded, error: loadError } = useSelector((s: RootState) => s.teams)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [newName,     setNewName]     = useState('')
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState('')

  const [memberUsername, setMemberUsername] = useState('')
  const [memberSpec,     setMemberSpec]     = useState('frontend')
  const [addingMember,   setAddingMember]   = useState(false)
  const [addError,       setAddError]       = useState('')

  useEffect(() => {
    if (!loaded) dispatch(fetchTeams())
  }, [loaded, dispatch])

  // Sync selection with teams list
  useEffect(() => {
    if (teams.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId(prev => (prev && teams.some(t => t.id === prev)) ? prev : teams[0].id)
  }, [teams])

  const selected = teams.find(t => t.id === selectedId) ?? null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (trimmed.length < 2 || creating) return
    setCreating(true)
    setCreateError('')
    try {
      const team = await apiCreateTeam(trimmed)
      setNewName('')
      await dispatch(fetchTeams()).unwrap()
      setSelectedId(team.id)
    } catch (err) {
      setCreateError(errorMessage(err, 'Не удалось создать команду'))
    } finally {
      setCreating(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || addingMember) return
    const username = memberUsername.trim()
    if (username.length === 0) return
    setAddingMember(true)
    setAddError('')
    try {
      await apiAddMember(selected.id, username, memberSpec)
      setMemberUsername('')
      await dispatch(fetchTeams()).unwrap()
    } catch (err) {
      setAddError(errorMessage(err, 'Не удалось добавить участника'))
    } finally {
      setAddingMember(false)
    }
  }

  return (
    <AppShell crumb="Заказчик" title="Моя команда">
      <div className={styles.layout}>
        {/* ── Sidebar: teams list + create form ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span>Команды</span>
            <span className={styles.sidebarCount}>{teams.length}</span>
          </div>

          {loading && !loaded && <div className={styles.sidebarEmpty}>загрузка...</div>}

          {loaded && teams.length === 0 && (
            <div className={styles.sidebarEmpty}>команд пока нет</div>
          )}

          {teams.map(team => (
            <button
              key={team.id}
              type="button"
              className={styles.teamItem}
              data-active={team.id === selectedId ? 'true' : 'false'}
              onClick={() => setSelectedId(team.id)}
            >
              <div>{team.name}</div>
              <div className={styles.teamItemMeta}>
                {team.members.length} {team.members.length === 1 ? 'участник' : 'участников'}
              </div>
            </button>
          ))}

          {loadError && <div className={styles.error}>{loadError}</div>}

          <div className={styles.divider} />

          <form className={styles.createForm} onSubmit={handleCreate}>
            <label className={styles.createLabel}>Новая команда</label>
            <input
              className={styles.input}
              placeholder="название проекта"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              disabled={creating}
            />
            {createError && <div className={styles.error}>{createError}</div>}
            <button
              type="submit"
              className={styles.btn}
              disabled={creating || newName.trim().length < 2}
            >
              {creating ? 'Создаём…' : 'Создать команду'}
            </button>
          </form>
        </aside>

        {/* ── Detail: selected team ── */}
        <section className={styles.detail}>
          {!selected && loaded && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Команда не выбрана</span>
              <p className={styles.emptyText}>
                Создайте команду слева — это будет рабочее пространство, в которое
                можно добавлять разработчиков и привязывать запросы.
              </p>
            </div>
          )}

          {selected && (
            <>
              <div className={styles.detailHeader}>
                <div>
                  <div className={styles.detailTitle}>{selected.name}</div>
                  <div className={styles.detailMeta}>
                    ID: {selected.id.slice(0, 8)}… · {selected.members.length} участников
                  </div>
                </div>
              </div>

              <div className={styles.sectionTitle}>Участники</div>
              <div className={styles.members}>
                {selected.members.map(m => {
                  const specKey  = m.specialization ?? 'unknown'
                  const specCls  = SPEC_CLASS[specKey] ?? styles.specUnknown
                  const specText = SPEC_LABEL[specKey] ?? 'не указана'
                  return (
                    <div key={m.id} className={styles.member}>
                      <div className={styles.memberAvatar}>{initials(m.name, m.surname)}</div>
                      <div className={styles.memberInfo}>
                        <div className={styles.memberName}>{m.name} {m.surname}</div>
                        <div className={styles.memberUsername}>@{m.username}</div>
                      </div>
                      <span className={`${styles.memberSpec} ${specCls}`}>{specText}</span>
                    </div>
                  )
                })}
              </div>

              <div className={styles.sectionTitle}>Добавить разработчика</div>
              <form className={styles.addMemberForm} onSubmit={handleAddMember}>
                <div className={styles.formField}>
                  <label className={styles.createLabel}>Username</label>
                  <input
                    className={styles.input}
                    placeholder="username разработчика"
                    value={memberUsername}
                    onChange={e => setMemberUsername(e.target.value)}
                    disabled={addingMember}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.createLabel}>Специализация</label>
                  <select
                    className={styles.select}
                    value={memberSpec}
                    onChange={e => setMemberSpec(e.target.value)}
                    disabled={addingMember}
                  >
                    {SPECIALIZATIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className={styles.btn}
                  disabled={addingMember || memberUsername.trim().length === 0}
                >
                  {addingMember ? 'Добавляем…' : 'Добавить'}
                </button>
                {addError && (
                  <div className={styles.error} style={{ gridColumn: '1 / -1' }}>{addError}</div>
                )}
              </form>
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
