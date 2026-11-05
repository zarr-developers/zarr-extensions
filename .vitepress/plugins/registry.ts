// Adapts the registry's plain GitHub markdown for VitePress, so that the
// READMEs keep working on github.com and render on the website unchanged.

import { existsSync, statSync } from 'node:fs'
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
  md.render = (src, env) => `<div v-pre>\n${render(src, env)}</div>\n`
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
