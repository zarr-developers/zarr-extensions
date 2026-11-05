// Sidebar built from the registry's directory tree: one group per extension
// point, one item per registered extension. Nothing to update when an
// extension is added.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { DefaultTheme } from 'vitepress'
import { isRegistryEntry, root } from './plugins/registry'

function title(readme: string, fallback: string): string {
  const m = readFileSync(readme, 'utf8').match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : fallback
}

const subdirsWithReadme = (dir: string) =>
  readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isRegistryEntry(e.name))
    .filter((e) => existsSync(path.join(dir, e.name, 'README.md')))
    .map((e) => e.name)
    .sort()

export function registrySidebar(): DefaultTheme.SidebarItem[] {
  return [
    { text: 'Overview', link: '/' },
    ...subdirsWithReadme(root).map((point) => {
      const items = subdirsWithReadme(path.join(root, point)).map((name) => ({
        text: name,
        link: `/${point}/${name}/`,
      }))
      return {
        text: title(path.join(root, point, 'README.md'), point),
        link: `/${point}/`,
        ...(items.length ? { collapsed: true, items } : {}),
      }
    }),
  ]
}
