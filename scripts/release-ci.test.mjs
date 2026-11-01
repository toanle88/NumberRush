import { describe, expect, it } from 'vitest'
import { selectSuccessfulCiRun, validateSuccessfulCiJobs } from './release-ci.mjs'

const releaseSha = 'a'.repeat(40)
const successfulRun = {
  id: 42,
  head_sha: releaseSha,
  head_branch: 'main',
  event: 'push',
  status: 'completed',
  conclusion: 'success',
}

const requiredJobs = [
  'Application validation',
  'Browser end-to-end tests',
  'Terraform validation',
  'CodeQL',
]

const successfulJobs = requiredJobs.map(name => ({ name, status: 'completed', conclusion: 'success' }))

describe('release CI validation', () => {
  it('selects a successful CI run for the exact release SHA', () => {
    expect(selectSuccessfulCiRun({
      payload: { workflow_runs: [{ ...successfulRun, id: 41, head_sha: 'b'.repeat(40) }, successfulRun] },
      releaseSha,
    })).toEqual(successfulRun)
  })

  it('rejects a successful run for a different SHA', () => {
    expect(() => selectSuccessfulCiRun({
      payload: { workflow_runs: [{ ...successfulRun, head_sha: 'b'.repeat(40) }] },
      releaseSha,
    })).toThrow(`No Pull Request Checks run exists for exact release commit ${releaseSha}.`)
  })

  it('rejects missing or failed CI runs', () => {
    expect(() => selectSuccessfulCiRun({
      payload: { workflow_runs: [{ ...successfulRun, conclusion: 'failure' }] },
      releaseSha,
    })).toThrow(`No successful Pull Request Checks run exists for release commit ${releaseSha}.`)
  })

  it('requires every release-gating CI job to succeed', () => {
    expect(() => validateSuccessfulCiJobs({
      payload: { jobs: successfulJobs.filter(({ name }) => name !== 'CodeQL') },
      runId: successfulRun.id,
      requiredJobs,
    })).toThrow('missing: CodeQL')

    expect(() => validateSuccessfulCiJobs({
      payload: { jobs: [...successfulJobs, { name: 'CodeQL', status: 'completed', conclusion: 'failure' }] },
      runId: successfulRun.id,
      requiredJobs,
    })).toThrow('unsuccessful: CodeQL')
  })
})
