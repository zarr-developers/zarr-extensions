// Adapts the registry's plain GitHub markdown for VitePress, so that the
// READMEs keep working on github.com and render on the website unchanged.

import { existsSync, readFileSync, statSync } from 'node:fs'
import { cp, readdir } from 'node:fs/promises'
import path from 'node:path'
import type MarkdownIt from 'markdown-it'
import type { SiteConfig } from 'vitepress'

export const REPO_URL = 'https://github.com/zarr-developers/zarr-extensions'

export const root = path.resolve(__dirname, '..', '..')

// Files and directories in the repo that are not part of the registry.
const NOT_REGISTRY = new Set([
  'node_modules',
  'package.json',
  'package-lock.json',
])

export const isRegistryEntry = (name: string) => !name.startsWith('.') && !NOT_REGISTRY.has(name)

// Rewrites relative link targets for the website:
// - a README.md, or a directory with one → that directory's page
// - a directory without one, or a missing path → GitHub
// Links to other files are left alone: buildEnd() copies them into the site.
function rewriteHref(href: string, fromFile: string): string {
  if (/^([a-z][a-z0-9+.-]*:|#|\/)/i.test(href)) return href
  const [, pathPart, suffix] = href.match(/^([^#?]*)(.*)$/)!
  if (!pathPart) return href
  const target = path.resolve(path.dirname(fromFile), decodeURI(pathPart))
  const repoPath = path.relative(root, target).split(path.sep).join('/')
  if (repoPath.startsWith('..')) return href
  if (!existsSync(target)) return `${REPO_URL}/blob/main/${repoPath}${suffix}`
  if (statSync(target).isDirectory()) {
    if (existsSync(path.join(target, 'README.md'))) {
      return pathPart.replace(/\/?$/, '/') + suffix
    }
    return `${REPO_URL}/tree/main/${repoPath}${suffix}`
  }
  if (path.basename(target) === 'README.md') {
    return pathPart.replace(/README\.md$/, '') + suffix
  }
  return href
}

export function registryMarkdown(md: MarkdownIt) {
  md.core.ruler.push('registry-links', (state) => {
    const file = state.env.path
    if (!file) return
    for (const block of state.tokens) {
      for (const token of block.children ?? []) {
        if (token.type !== 'link_open') continue
        const href = token.attrGet('href')
        if (href) token.attrSet('href', rewriteHref(href, file))
      }
    }
  })

  // The READMEs are GitHub markdown, not Vue templates: render `{{ }}` and
  // friends literally.
  const render = md.render.bind(md)
  md.render = (src, env) => {
    // VitePress fills env.frontmatter while rendering, so render first.
    const html = render(src, env)
    // realPath is the README itself; path may be the rewritten index.md.
    const file = env?.realPath ?? env?.path
    const banner = file ? statusBanner(readStatus(env.frontmatter ?? {}, file)) : ''
    return `<div v-pre>\n${banner}${html}</div>\n`
  }
}

// An extension's status, from the front matter of its README.md. See
// "Extension status" in the repository README.
export type Status = { status: 'active' } | { status: 'superseded'; supersededBy: string[] }

// Checks the status front matter of `file` and throws if it is invalid, so
// that the website build fails.
export function readStatus(frontmatter: Record<string, unknown>, file: string): Status {
  const fail = (message: string): never => {
    throw new Error(`${path.relative(root, file)}: ${message} (see "Extension status" in README.md)`)
  }
  const { status = 'active', superseded_by: supersededBy } = frontmatter
  if (status === 'active') {
    if (supersededBy !== undefined) fail('superseded_by is only allowed when status is "superseded"')
    return { status }
  }
  if (status !== 'superseded') fail(`unknown status ${JSON.stringify(status)}`)
  if (
    !Array.isArray(supersededBy) ||
    supersededBy.length === 0 ||
    !supersededBy.every((name) => typeof name === 'string')
  ) {
    fail('superseded_by must be a non-empty list of extension names')
  }
  const names = supersededBy as string[]
  for (const name of names) {
    if (!existsSync(path.join(path.dirname(file), '..', name, 'README.md'))) {
      fail(`superseded_by names ${JSON.stringify(name)}, which is not registered here`)
    }
  }
  return { status: 'superseded', supersededBy: names }
}

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

function statusBanner(status: Status): string {
  if (status.status === 'active') return ''
  const links = status.supersededBy
    .map((name) => `<a href="../${encodeURI(name)}/"><code>${escapeHtml(name)}</code></a>`)
    .join(', ')
  const what = status.supersededBy.length > 1 ? `the sequence ${links}` : links
  return (
    `<div class="warning custom-block"><p class="custom-block-title">Superseded</p>` +
    `<p>New data should use ${what} instead. Implementations should still read data that uses this extension.</p></div>\n`
  )
}

// The status a README declares, read from its front matter without a YAML
// parser. The page build checks the full front matter with readStatus().
export function declaredStatus(readme: string): string {
  const frontmatter = readFileSync(readme, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const m = frontmatter?.[1].match(/^status:\s*["']?([\w-]+)/m)
  return m ? m[1] : 'active'
}

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!isRegistryEntry(entry.name)) continue
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(p)
    else if (entry.isFile() && !entry.name.endsWith('.md')) yield p
  }
}

// Serves the registry's non-markdown files (schema.json, sample data,
// examples) verbatim next to the pages, e.g. /codecs/jpeg/schema.json.
export async function copyRegistryFiles(siteConfig: SiteConfig) {
  for await (const file of walk(root)) {
    await cp(file, path.join(siteConfig.outDir, path.relative(root, file)))
  }
}
