import { readFileSync } from 'node:fs'

export const REQUIRED_CI_JOBS = [
  'Application validation',
  'Browser end-to-end tests',
  'Terraform validation',
  'CodeQL',
]

const getRuns = payload => Array.isArray(payload) ? payload : payload?.workflow_runs
const getJobs = payload => Array.isArray(payload) ? payload : payload?.jobs

export const selectSuccessfulCiRun = ({ payload, releaseSha }) => {
  const runs = getRuns(payload) ?? []
  const exactRuns = runs.filter(run => run?.head_sha === releaseSha && run?.event === 'push' && run?.head_branch === 'main')
  const successfulRuns = exactRuns.filter(run => run.status === 'completed' && run.conclusion === 'success')

  if (successfulRuns.length === 0) {
    if (exactRuns.length > 0) {
      throw new Error(`No successful Pull Request Checks run exists for release commit ${releaseSha}.`)
    }
    throw new Error(`No Pull Request Checks run exists for exact release commit ${releaseSha}.`)
  }

  return [...successfulRuns].sort((left, right) => (right.id ?? 0) - (left.id ?? 0))[0]
}

export const validateSuccessfulCiJobs = ({ payload, runId, requiredJobs = REQUIRED_CI_JOBS }) => {
  const jobs = getJobs(payload) ?? []
  const relevantJobs = jobs.filter(job => requiredJobs.includes(job?.name))
  const unsuccessful = relevantJobs
    .filter(job => job.status !== 'completed' || job.conclusion !== 'success')
    .map(job => job.name)
  const missing = requiredJobs.filter(name => !relevantJobs.some(job => job.name === name && job.status === 'completed' && job.conclusion === 'success'))

  if (unsuccessful.length > 0 || missing.length > 0) {
    const details = [
      unsuccessful.length > 0 ? `unsuccessful: ${[...new Set(unsuccessful)].join(', ')}` : null,
      missing.length > 0 ? `missing: ${missing.join(', ')}` : null,
    ].filter(Boolean).join('; ')
    throw new Error(`CI run ${runId} does not have all required successful jobs (${details}).`)
  }

  return true
}

const readJson = path => JSON.parse(readFileSync(path, 'utf8'))

const getOption = name => {
  const index = process.argv.indexOf(name)
  return index < 0 ? null : process.argv[index + 1]
}

const main = () => {
  try {
    const runsPath = getOption('--runs')
    const jobsPath = getOption('--jobs')
    const releaseSha = getOption('--sha')
    const runId = getOption('--run-id')

    if (runsPath && releaseSha) {
      console.log(selectSuccessfulCiRun({ payload: readJson(runsPath), releaseSha }).id)
      return
    }

    if (jobsPath && runId) {
      validateSuccessfulCiJobs({ payload: readJson(jobsPath), runId })
      console.log(`CI run ${runId} passed all required release jobs.`)
      return
    }

    throw new Error('Usage: --runs FILE --sha SHA or --jobs FILE --run-id ID')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

if (process.argv[1] === new URL(import.meta.url).pathname) main()
