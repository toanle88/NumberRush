import { describe, expect, it } from 'vitest'
import { extractReleaseNotes, validateRelease } from './release.mjs'

const changelog = '# Changelog\n\n## [Unreleased]\n\n## [1.2.3] - 2026-10-29\n\n### Added\n\n- A feature.\n'

describe('release validation', () => {
  it('accepts a matching stable SemVer tag and changelog section', () => {
    expect(validateRelease({ packageVersion: '1.2.3', tag: 'v1.2.3', source: changelog })).toEqual({
      errors: [],
      notes: '### Added\n\n- A feature.',
    })
  })

  it('accepts prerelease tags when package and changelog versions match', () => {
    const source = changelog.replace('[1.2.3]', '[1.2.3-rc.1]')
    expect(validateRelease({ packageVersion: '1.2.3-rc.1', tag: 'v1.2.3-rc.1', source }).errors).toEqual([])
  })

  it('rejects mismatched tags and missing changelog sections', () => {
    const result = validateRelease({ packageVersion: '1.2.3', tag: '1.2', source: changelog })
    expect(result.errors).toEqual([
      'The release tag must use the vMAJOR.MINOR.PATCH SemVer format.',
      'package.json version 1.2.3 does not match tag 1.2.',
      'CHANGELOG.md is missing a release section for 1.2.',
    ])
  })

  it('returns null when a release section is absent', () => {
    expect(extractReleaseNotes(changelog, '9.9.9')).toBeNull()
  })
})
