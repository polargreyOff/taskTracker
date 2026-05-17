import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../../components/AppShell'
import type { AppDispatch, RootState } from '../../store'
import { fetchTeams } from '../../store/teamsSlice'
import styles from '../client/teams.module.css'

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

function initials(name: string, surname: string): string {
  return (name[0] ?? '') + (surname[0] ?? '')
}

export default function DevTeamsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { items: teams, loading, loaded, error } = useSelector((s: RootState) => s.teams)

  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!loaded) dispatch(fetchTeams())
  }, [loaded, dispatch])

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId(prev => (prev && teams.some(t => t.id === prev)) ? prev : teams[0].id)
  }, [teams])

  const selected = teams.find(t => t.id === selectedId) ?? null

  return (
    <AppShell crumb="Разработчик" title="Моя команда">
      <div className={styles.layout}>
        {/* ── Sidebar: teams list (read-only) ── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <span>Команды</span>
            <span className={styles.sidebarCount}>{teams.length}</span>
          </div>

          {loading && !loaded && <div className={styles.sidebarEmpty}>загрузка...</div>}

          {loaded && teams.length === 0 && (
            <div className={styles.sidebarEmpty}>
              вас пока не добавили ни в одну команду
            </div>
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

          {error && <div className={styles.error}>{error}</div>}
        </aside>

        {/* ── Detail: selected team (read-only) ── */}
        <section className={styles.detail}>
          {!selected && loaded && teams.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Команд пока нет</span>
              <p className={styles.emptyText}>
                Дождитесь, пока заказчик добавит вас в свою команду — после этого
                здесь появится список её участников.
              </p>
            </div>
          )}

          {!selected && loaded && teams.length > 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyTitle}>Команда не выбрана</span>
              <p className={styles.emptyText}>Выберите команду слева, чтобы увидеть участников.</p>
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
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
