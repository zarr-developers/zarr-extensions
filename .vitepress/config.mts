import { defineConfig } from 'vitepress'
import { copyRegistryFiles, registryMarkdown, REPO_URL } from './plugins/registry'
import { registrySidebar } from './sidebar'

// The site deploys to GitHub Pages at https://extensions.zarr.dev. Until the
// custom domain is set up, Pages serves it under zarr.dev/zarr-extensions/;
// the deploy workflow passes that prefix in (see .github/workflows/website.yml).
const base = process.env.VITEPRESS_BASE ? `${process.env.VITEPRESS_BASE.replace(/\/$/, '')}/` : '/'

const description = 'The registry of Zarr v3 extensions: codecs, data types, chunk grids, chunk key encodings and storage transformers.'

// Head, nav, social links and footer are duplicated from zarr.dev
// (zarr-developers/zarr-developers.github.io, .vitepress/config.mts) until
// they are extracted into a shared theme package. Links to zarr.dev are absolute.
export default defineConfig({
  base,
  title: 'Zarr Extensions',
  description,
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://extensions.zarr.dev' },
  // Every README.md becomes the index page of its directory, so
  // codecs/jpeg/README.md is served at /codecs/jpeg/.
  rewrites: (page) => page.replace(/(^|\/)README\.md$/, '$1index.md'),
  srcExclude: ['**/node_modules/**'],
  markdown: {
    config: registryMarkdown,
  },
  buildEnd: copyRegistryFiles,
  head: [
    ['link', { rel: 'icon', type: 'image/x-icon', href: 'https://zarr.dev/favicon.ico' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '16x16', href: 'https://zarr.dev/favicon-16x16.png' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'https://zarr.dev/favicon-32x32.png' }],
    ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: 'https://zarr.dev/apple-touch-icon.png' }],
    ['link', { rel: 'mask-icon', href: 'https://zarr.dev/safari-pinned-tab.svg', color: '#5bbad5' }],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'Zarr Extensions' }],
    ['meta', { property: 'og:title', content: 'Zarr Extensions' }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: 'https://zarr.dev/android-chrome-512x512.png' }],
    ['meta', { property: 'og:url', content: 'https://extensions.zarr.dev/' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-BCRR9QE7Z0' }],
    ['script', {}, `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-BCRR9QE7Z0');`],
  ],
  themeConfig: {
    logo: 'https://zarr.dev/android-chrome-192x192.png',
    search: { provider: 'local' },
    nav: [
      { text: 'Implementations', link: 'https://zarr.dev/implementations' },
      { text: 'Datasets', link: 'https://zarr.dev/datasets' },
      { text: 'Adopters', link: 'https://zarr.dev/adopters' },
      {
        text: 'Community',
        items: [
          { text: 'Overview', link: 'https://zarr.dev/community' },
          { text: 'Affiliated Projects', link: 'https://zarr.dev/affiliated-projects' },
          { text: 'Office Hours', link: 'https://zarr.dev/office-hours' },
          { text: 'ZEPs', link: 'https://zarr.dev/zeps/' },
          { text: 'Slides', link: 'https://zarr.dev/slides' },
        ],
      },
      {
        text: 'Resources',
        items: [
          { text: 'Specification', link: 'https://zarr-specs.readthedocs.io/' },
          { text: 'Documentation', link: 'https://zarr.readthedocs.io/en/stable/' },
          { text: 'Extensions', link: '/' },
          { text: 'Conventions', link: 'https://zarr.dev/conventions' },
          { text: 'Blog', link: 'https://zarr.dev/blog/' },
        ],
      },
    ],
    sidebar: registrySidebar(),
    socialLinks: [
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 530"><path d="M135.72 44.03C202.216 93.951 273.74 195.17 300 249.49c26.262-54.316 97.782-155.54 164.28-205.46C512.26 8.009 590-19.862 590 68.825c0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.38-3.69-10.832-3.708-7.896-.017-2.936-1.193.516-3.707 7.896-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.45-163.25-81.433C20.15 217.612 9.997 86.535 9.997 68.825c0-88.687 77.742-60.816 125.72-24.795z" fill="currentColor"/></svg>',
        },
        link: 'https://bsky.app/profile/zarr.dev',
        ariaLabel: 'Bluesky',
      },
      { icon: 'mastodon', link: 'https://fosstodon.org/@zarr' },
      { icon: 'github', link: REPO_URL },
      {
        icon: {
          svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.81.49 3.51 1.34 4.97L2 22l5.16-1.35A9.95 9.95 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" fill="currentColor"/></svg>',
        },
        link: 'https://ossci.zulipchat.com/',
        ariaLabel: 'Zulip',
      },
    ],
    editLink: {
      pattern: `${REPO_URL}/edit/main/:path`,
      text: 'Edit this page on GitHub',
    },
    footer: {
      message:
        `Extension documents are released under <a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>. Registered names are reviewed by the <a href="https://github.com/orgs/zarr-developers/teams/format-wg">Zarr Format Working Group</a>.`,
      copyright: 'Copyright © Zarr contributors',
    },
  },
})
