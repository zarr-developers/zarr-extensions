import { defineConfig } from 'vitepress'
import { zarrConfig } from '@zarr-developers/vitepress-theme/config'
import { copyRegistryFiles, registryMarkdown } from './plugins/registry'
import { registrySidebar } from './sidebar'

// The site deploys to GitHub Pages at https://extensions.zarr.dev. Until the
// custom domain is set up, Pages serves it under zarr.dev/zarr-extensions/;
// the deploy workflow passes that prefix in (see .github/workflows/website.yml).
const base = process.env.VITEPRESS_BASE ? `${process.env.VITEPRESS_BASE.replace(/\/$/, '')}/` : '/'

const description = 'The registry of Zarr v3 extensions: codecs, data types, chunk grids, chunk key encodings and storage transformers.'

export default defineConfig({
  extends: zarrConfig({
    site: 'extensions',
    title: 'Zarr Extensions',
    description,
    repo: 'zarr-developers/zarr-extensions',
  }),
  base,
  // Every README.md becomes the index page of its directory, so
  // codecs/jpeg/README.md is served at /codecs/jpeg/.
  rewrites: (page) => page.replace(/(^|\/)README\.md$/, '$1index.md'),
  srcExclude: ['**/node_modules/**'],
  markdown: {
    config: registryMarkdown,
  },
  buildEnd: copyRegistryFiles,
  themeConfig: {
    sidebar: registrySidebar(),
    footer: {
      message:
        `Extension documents are released under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Registered names are reviewed by the <a href="https://github.com/orgs/zarr-developers/teams/format-wg">Zarr Format Working Group</a>.`,
    },
  },
})
