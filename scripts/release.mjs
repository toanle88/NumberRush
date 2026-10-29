import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const numericIdentifierPattern = /^(0|[1-9]\d*)$/
const identifierPattern = /^[0-9A-Za-z-]+$/

const isValidNumericIdentifier = value => numericIdentifierPattern.test(value)

const isValidIdentifier = (value, { allowLeadingZero = false } = {}) => {
  if (!identifierPattern.test(value)) return false
  if (allowLeadingZero || !/^\d+$/.test(value)) return true
  return isValidNumericIdentifier(value)
}

const isValidSemVer = version => {
  const plusParts = version.split('+')
  if (plusParts.length > 2) return false

  const [coreAndPrerelease, build] = plusParts
  const hyphenIndex = coreAndPrerelease.indexOf('-')
  const core = hyphenIndex < 0 ? coreAndPrerelease : coreAndPrerelease.slice(0, hyphenIndex)
  const prerelease = hyphenIndex < 0 ? null : coreAndPrerelease.slice(hyphenIndex + 1)
  const coreParts = core.split('.')

  if (coreParts.length !== 3 || !coreParts.every(isValidNumericIdentifier)) return false
  if (prerelease !== null && (!prerelease || !prerelease.split('.').every(isValidIdentifier))) return false
  if (build !== undefined && (!build || !build.split('.').every(value => isValidIdentifier(value, { allowLeadingZero: true })))) {
    return false
  }

  return true
}

export const extractReleaseNotes = (source, version) => {
  const heading = `## [${version}]`
  const start = source.indexOf(heading)
  if (start < 0) return null
  const contentStart = source.indexOf('\n', start) + 1
  const nextHeading = source.indexOf('\n## [', contentStart)
  const referenceDefinitions = source.search(/\n\[[^\]]+\]: /)
  const end = [nextHeading, referenceDefinitions]
    .filter(position => position >= contentStart)
    .sort((left, right) => left - right)[0] ?? source.length
  return source.slice(contentStart, end).trim() || null
}

export const validateRelease = ({ packageVersion, tag, source }) => {
  const errors = []
  const version = tag?.replace(/^v/, '')

  if (!tag?.startsWith('v') || !isValidSemVer(version ?? '')) {
    errors.push('The release tag must use the vMAJOR.MINOR.PATCH SemVer format.')
  }
  if (packageVersion !== version) {
    errors.push(`package.json version ${packageVersion} does not match tag ${tag}.`)
  }
  if (version && !extractReleaseNotes(source, version)) {
    errors.push(`CHANGELOG.md is missing a release section for ${version}.`)
  }

  return { errors, notes: version ? extractReleaseNotes(source, version) : null }
}

const getTag = () => process.argv[3] ?? process.env.GITHUB_REF_NAME

const main = () => {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  const changelog = readFileSync(new URL('../CHANGELOG.md', import.meta.url), 'utf8')
  const tag = getTag()
  const result = validateRelease({ packageVersion: packageJson.version, tag, source: changelog })

  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(error)
    process.exitCode = 1
    return
  }

  if (process.argv[2] === '--notes') {
    console.log(result.notes)
  } else {
    console.log(`Release ${tag} matches package.json and CHANGELOG.md.`)
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] === fileURLToPath(import.meta.url)) main()
