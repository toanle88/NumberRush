import type { ProgressMetrics, ProgressSession } from '../utils/progress'
import type { DifficultyTier, Operation } from '../utils/mathLogic'
import { DAILY_GOAL, WEEKLY_GOAL } from '../utils/dailyChallenges'
import type { RecurringProgress } from '../utils/dailyChallenges'
interface ProgressDashboardProps {
  metrics: ProgressMetrics
recurringProgress: RecurringProgress
onBack: () => void}

const operationLabels: Record<Operation, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
}
const difficultyLabels: Record<DifficultyTier, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
}
const formatResponseTime = (milliseconds: number | null): string => {
  if (milliseconds === null) return '—'
return `${(milliseconds / 1000).toFixed(1)}s`
}
const formatChange = (value: number, unit: string): string => {
  if (value === 0) return `No change ${unit}`
return `${value > 0 ? '+' : ''}${value}${unit}`
}
const SessionRow = ({ session }: { session: ProgressSession }) => (
  <li className="session-row">
    <div>
      <strong>{new Date(session.completedAt).toLocaleDateString()}</strong>
      <span>{session.mode === 'blitz' ? 'Blitz Rush' : 'Practice'} · {session.totalQuestions} attempted</span>
    </div>
    <div className="session-result">
      <strong>{session.accuracy}%</strong>
      <span>{session.correctAnswers} solved · {formatResponseTime(session.averageResponseTimeMs)}</span>
    </div>
  </li>
)
const RecurringGoals = ({ recurringProgress }: { recurringProgress: RecurringProgress }) => (
  <section className="progress-panel goals-panel" aria-labelledby="recurring-goals-heading">
    <div className="daily-challenge-heading">
      <div>
        <p className="eyebrow">Keep returning</p>
        <h3 id="recurring-goals-heading">Recurring goals</h3>
      </div>
      <span className="challenge-icon" aria-hidden="true">🌟</span>
    </div>
    {[{
      ...DAILY_GOAL,
      progress: recurringProgress.dailyCorrectAnswers,
    }, {
      ...WEEKLY_GOAL,
      progress: recurringProgress.weeklyCorrectAnswers,
    }].map(goal => {
      const progress = Math.min(goal.progress, goal.target)
return (
        <div className="goal-row" key={goal.id}>
          <div>
            <strong>{goal.title}</strong>
            <span>{goal.description}</span>
          </div>
          <strong>{progress}/{goal.target}{progress >= goal.target ? ' ✓' : ''}</strong>
        </div>
      )
})}
  </section>
)
function ProgressDashboard({ metrics, recurringProgress, onBack }: ProgressDashboardProps) {
  if (metrics.totalSessions === 0) {
    return (
      <section className="progress-dashboard" aria-labelledby="progress-title">
        <div className="progress-heading">
          <div>
            <p className="eyebrow">Your learning journey</p>
            <h2 id="progress-title">Progress</h2>
          </div>
          <button type="button" onClick={onBack}>Back to home</button>
        </div>
        <div className="progress-empty-state" role="status">
          <span className="progress-empty-icon" aria-hidden="true">🚀</span>
          <h3>Your progress story starts here</h3>
          <p>Finish a round and your accuracy, speed, and practice history will appear here.</p>
          <button type="button" className="primary" onClick={onBack}>Start your first round</button>
        </div>
        <RecurringGoals recurringProgress={recurringProgress} />
      </section>
    )
}

  return (
    <section className="progress-dashboard" aria-labelledby="progress-title">
      <div className="progress-heading">
        <div>
          <p className="eyebrow">Your learning journey</p>
          <h2 id="progress-title">Progress</h2>
          <p className="progress-subtitle">Built from {metrics.totalSessions} completed {metrics.totalSessions === 1 ? 'round' : 'rounds'} on this device.</p>
        </div>
        <button type="button" onClick={onBack}>Back to home</button>
      </div>

      <div className="progress-metric-grid" aria-label="Overall progress metrics">
        <div className="progress-metric"><span>Accuracy</span><strong>{metrics.accuracy}%</strong><small>{metrics.questionsAttempted} attempted</small></div>
        <div className="progress-metric"><span>Average response</span><strong>{formatResponseTime(metrics.averageResponseTimeMs)}</strong><small>Across all answers</small></div>
        <div className="progress-metric"><span>Questions solved</span><strong>{metrics.questionsSolved}</strong><small>{metrics.totalSessions} {metrics.totalSessions === 1 ? 'session' : 'sessions'}</small></div>
      </div>

      <RecurringGoals recurringProgress={recurringProgress} />

      {metrics.trend && (
        <div className="progress-trend" role="status">
          <strong>Recent trend</strong>
          <span>{formatChange(metrics.trend.accuracyChange, ' points accuracy')}</span>
          <span>{metrics.trend.averageResponseTimeChangeMs === null ? 'Speed —' : `${metrics.trend.averageResponseTimeChangeMs <= 0 ? 'Faster by' : 'Slower by'} ${formatResponseTime(Math.abs(metrics.trend.averageResponseTimeChangeMs))}`}</span>
          <span>{formatChange(metrics.trend.solvedChange, ' solved')}</span>
        </div>
      )}

      <div className="progress-breakdown-grid">
        <section className="progress-panel" aria-labelledby="operator-title">
          <h3 id="operator-title">By operator</h3>
          <div className="progress-table-wrap" tabIndex={0}>
            <table>
              <caption className="sr-only">Performance by math operator</caption>
              <thead><tr><th scope="col">Operator</th><th scope="col">Accuracy</th><th scope="col">Speed</th></tr></thead>
              <tbody>
                {(Object.keys(operationLabels) as Operation[]).map(operation => {
                  const breakdown = metrics.byOperator[operation]
return <tr key={operation}><th scope="row">{operationLabels[operation]}</th><td>{breakdown.attempts === 0 ? '—' : `${breakdown.accuracy}%`}</td><td>{breakdown.attempts === 0 ? '—' : formatResponseTime(breakdown.averageResponseTimeMs)}</td></tr>
})}
              </tbody>
            </table>
          </div>
        </section>

        <section className="progress-panel" aria-labelledby="difficulty-title">
          <h3 id="difficulty-title">By difficulty</h3>
          <div className="progress-table-wrap" tabIndex={0}>
            <table>
              <caption className="sr-only">Performance by difficulty</caption>
              <thead><tr><th scope="col">Tier</th><th scope="col">Accuracy</th><th scope="col">Speed</th></tr></thead>
              <tbody>
                {(Object.keys(difficultyLabels) as DifficultyTier[]).map(difficulty => {
                  const breakdown = metrics.byDifficulty[difficulty]
return <tr key={difficulty}><th scope="row">{difficultyLabels[difficulty]}</th><td>{breakdown.attempts === 0 ? '—' : `${breakdown.accuracy}%`}</td><td>{breakdown.attempts === 0 ? '—' : formatResponseTime(breakdown.averageResponseTimeMs)}</td></tr>
})}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="progress-panel recent-sessions" aria-labelledby="recent-sessions-title">
        <h3 id="recent-sessions-title">Recent sessions</h3>
        <ol className="session-list">
          {metrics.recentSessions.map(session => <SessionRow key={session.id} session={session} />)}
        </ol>
      </section>
    </section>
  )
}

export default ProgressDashboard
