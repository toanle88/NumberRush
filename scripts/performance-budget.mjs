import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { gzipSync } from 'node:zlib'

const DIST_DIRECTORY = 'dist'
const MAX_GZIPPED_BYTES = 150 * 1024
const MAX_FIRST_LOAD_JS_BYTES = 100 * 1024
const MAX_CSS_BYTES = 25 * 1024
const REPORT_PATH = process.env.PERFORMANCE_REPORT_PATH

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const path = `${directory}/${entry.name}`
    if (entry.isDirectory()) files.push(...await collectFiles(path))
    else files.push(path)
  }
  return files
}

const files = (await collectFiles(DIST_DIRECTORY)).sort()
const assets = await Promise.all(files.map(async (path) => {
  const contents = await readFile(path)
  return {
    path,
    gzippedBytes: gzipSync(contents).length,
  }
}))
const totalGzippedBytes = assets.reduce((total, asset) => total + asset.gzippedBytes, 0)
const firstLoadJsBytes = assets
  .filter(asset => asset.path.includes('/assets/') && asset.path.endsWith('.js'))
  .reduce((total, asset) => total + asset.gzippedBytes, 0)
const cssBytes = assets
  .filter(asset => asset.path.includes('/assets/') && asset.path.endsWith('.css'))
  .reduce((total, asset) => total + asset.gzippedBytes, 0)

const report = {
  generatedAt: new Date().toISOString(),
  commit: process.env.GITHUB_SHA ?? 'local',
  node: process.version,
  thresholds: {
    totalGzippedBytes: MAX_GZIPPED_BYTES,
    firstLoadJsBytes: MAX_FIRST_LOAD_JS_BYTES,
    cssBytes: MAX_CSS_BYTES,
  },
  measured: {
    totalGzippedBytes,
    firstLoadJsBytes,
    cssBytes,
  },
  assets,
}

console.log(`Gzipped dist assets: ${(totalGzippedBytes / 1024).toFixed(1)} KiB`)
console.log(`JavaScript assets: ${(firstLoadJsBytes / 1024).toFixed(1)} KiB`)
console.log(`CSS assets: ${(cssBytes / 1024).toFixed(1)} KiB`)

if (REPORT_PATH) {
  await mkdir(dirname(REPORT_PATH), { recursive: true })
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`)
  console.log(`Performance report: ${REPORT_PATH}`)
}

if (totalGzippedBytes > MAX_GZIPPED_BYTES || firstLoadJsBytes > MAX_FIRST_LOAD_JS_BYTES || cssBytes > MAX_CSS_BYTES) {
  process.exitCode = 1
  console.error('Performance budget exceeded. See PERFORMANCE.md for thresholds.')
}
