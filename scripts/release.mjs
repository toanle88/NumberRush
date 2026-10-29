import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

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

  if (!tag?.startsWith('v') || !semverPattern.test(version ?? '')) {
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
