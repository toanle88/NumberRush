import type { ProgressMetrics, ProgressSession } from '../utils/progress'
import type { DifficultyTier, Operation } from '../utils/mathLogic'
import { DAILY_GOAL, WEEKLY_GOAL } from '../utils/dailyChallenges'
import type { RecurringProgress } from '../utils/dailyChallenges'
import { createTranslator } from '../utils/i18n'
import type { Locale, TranslationKey, Translator } from '../utils/i18n'

interface ProgressDashboardProps { metrics: ProgressMetrics; recurringProgress: RecurringProgress; onBack: () => void; locale?: Locale; translate?: Translator }
const operationKeys: Record<Operation, TranslationKey> = { addition: 'addition', subtraction: 'subtraction', multiplication: 'multiplication', division: 'division' }
const difficultyKeys: Record<DifficultyTier, TranslationKey> = { easy: 'easy', medium: 'medium', hard: 'hard' }
const formatResponseTime = (milliseconds: number | null): string => milliseconds === null ? '—' : `${(milliseconds / 1000).toFixed(1)}s`
const formatChange = (value: number, unit: string, translate: Translator): string => value === 0 ? translate('noChange', { unit }) : `${value > 0 ? '+' : ''}${value}${unit}`

const SessionRow = ({ session, locale, translate }: { session: ProgressSession; locale: Locale; translate: Translator }) => (
  <li className="session-row"><div><strong>{new Date(session.completedAt).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}</strong><span>{session.mode === 'blitz' ? translate('blitzRush') : translate('practice')} · {session.totalQuestions} {translate('attemptedSuffix')}</span></div><div className="session-result"><strong>{session.accuracy}%</strong><span>{session.correctAnswers} {translate('solvedSuffixText')} · {formatResponseTime(session.averageResponseTimeMs)}</span></div></li>
)

const RecurringGoals = ({ recurringProgress, translate }: { recurringProgress: RecurringProgress; translate: Translator }) => (
  <section className="progress-panel goals-panel" aria-labelledby="recurring-goals-heading"><div className="daily-challenge-heading"><div><p className="eyebrow">{translate('keepReturning')}</p><h3 id="recurring-goals-heading">{translate('recurringGoals')}</h3></div><span className="challenge-icon" aria-hidden="true">🌟</span></div>
    {[{ ...DAILY_GOAL, title: translate('dailyGoal'), description: translate('dailyGoalDescription'), progress: recurringProgress.dailyCorrectAnswers }, { ...WEEKLY_GOAL, title: translate('weeklyGoal'), description: translate('weeklyGoalDescription'), progress: recurringProgress.weeklyCorrectAnswers }].map(goal => <div className="goal-row" key={goal.id}><div><strong>{goal.title}</strong><span>{goal.description}</span></div><strong>{Math.min(goal.progress, goal.target)}/{goal.target}{goal.progress >= goal.target ? ' ✓' : ''}</strong></div>)}
  </section>
)

function ProgressDashboard({ metrics, recurringProgress, onBack, locale = 'en', translate = createTranslator('en') }: ProgressDashboardProps) {
  const heading = <div className="progress-heading"><div><p className="eyebrow">{translate('progressEyebrow')}</p><h2 id="progress-title">{translate('progress')}</h2></div><button type="button" onClick={onBack}>{translate('backHome')}</button></div>
  if (metrics.totalSessions === 0) return <section className="progress-dashboard" aria-labelledby="progress-title">{heading}<div className="progress-empty-state" role="status"><span className="progress-empty-icon" aria-hidden="true">🚀</span><h3>{translate('progressStory')}</h3><p>{translate('progressEmpty')}</p><button type="button" className="primary" onClick={onBack}>{translate('firstRound')}</button></div><RecurringGoals recurringProgress={recurringProgress} translate={translate} /></section>
  return <section className="progress-dashboard" aria-labelledby="progress-title">
    <div className="progress-heading"><div><p className="eyebrow">{translate('progressEyebrow')}</p><h2 id="progress-title">{translate('progress')}</h2><p className="progress-subtitle">{translate('roundsBuilt', { count: metrics.totalSessions, roundWord: metrics.totalSessions === 1 ? translate('round') : translate('rounds') })}</p></div><button type="button" onClick={onBack}>{translate('backHome')}</button></div>
    <div className="progress-metric-grid" role="group" aria-label={translate('overallMetrics')}><div className="progress-metric"><span>{translate('accuracy')}</span><strong>{metrics.accuracy}%</strong><small>{metrics.questionsAttempted} {translate('attempted')}</small></div><div className="progress-metric"><span>{translate('averageResponse')}</span><strong>{formatResponseTime(metrics.averageResponseTimeMs)}</strong><small>{translate('acrossAnswers')}</small></div><div className="progress-metric"><span>{translate('solved')}</span><strong>{metrics.questionsSolved}</strong><small>{metrics.totalSessions} {metrics.totalSessions === 1 ? translate('session') : translate('sessions')}</small></div></div>
    <RecurringGoals recurringProgress={recurringProgress} translate={translate} />
    {metrics.trend && <div className="progress-trend" role="status"><strong>{translate('recentTrend')}</strong><span>{formatChange(metrics.trend.accuracyChange, translate('pointsAccuracy'), translate)}</span><span>{metrics.trend.averageResponseTimeChangeMs === null ? translate('speedDash') : `${metrics.trend.averageResponseTimeChangeMs <= 0 ? translate('fasterBy') : translate('slowerBy')} ${formatResponseTime(Math.abs(metrics.trend.averageResponseTimeChangeMs))}`}</span><span>{formatChange(metrics.trend.solvedChange, translate('solvedSuffix'), translate)}</span></div>}
    <div className="progress-breakdown-grid"><section className="progress-panel" aria-labelledby="operator-title"><h3 id="operator-title">{translate('byOperator')}</h3><div className="progress-table-wrap" role="region" aria-label={translate('performanceOperator')} tabIndex={0}><table><caption className="sr-only">{translate('performanceOperator')}</caption><thead><tr><th scope="col">{translate('operator')}</th><th scope="col">{translate('accuracy')}</th><th scope="col">{translate('speed')}</th></tr></thead><tbody>{(Object.keys(operationKeys) as Operation[]).map(operation => {
 const breakdown = metrics.byOperator[operation]; return <tr key={operation}><th scope="row">{translate(operationKeys[operation])}</th><td>{breakdown.attempts === 0 ? '—' : `${breakdown.accuracy}%`}</td><td>{breakdown.attempts === 0 ? '—' : formatResponseTime(breakdown.averageResponseTimeMs)}</td></tr>
})}</tbody></table></div></section><section className="progress-panel" aria-labelledby="difficulty-title"><h3 id="difficulty-title">{translate('byDifficulty')}</h3><div className="progress-table-wrap" role="region" aria-label={translate('performanceDifficulty')} tabIndex={0}><table><caption className="sr-only">{translate('performanceDifficulty')}</caption><thead><tr><th scope="col">{translate('tier')}</th><th scope="col">{translate('accuracy')}</th><th scope="col">{translate('speed')}</th></tr></thead><tbody>{(Object.keys(difficultyKeys) as DifficultyTier[]).map(difficulty => {
 const breakdown = metrics.byDifficulty[difficulty]; return <tr key={difficulty}><th scope="row">{translate(difficultyKeys[difficulty])}</th><td>{breakdown.attempts === 0 ? '—' : `${breakdown.accuracy}%`}</td><td>{breakdown.attempts === 0 ? '—' : formatResponseTime(breakdown.averageResponseTimeMs)}</td></tr>
})}</tbody></table></div></section></div>
    <section className="progress-panel recent-sessions" aria-labelledby="recent-sessions-title"><h3 id="recent-sessions-title">{translate('recentSessions')}</h3><ol className="session-list">{metrics.recentSessions.map(session => <SessionRow key={session.id} session={session} locale={locale} translate={translate} />)}</ol></section>
  </section>
}
export default ProgressDashboard
