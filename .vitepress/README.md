# Registry website

The registry is published at https://extensions.zarr.dev with [VitePress](https://vitepress.dev/). The READMEs are rendered as they are, so they keep working on GitHub:

- each `README.md` becomes its directory's page, e.g. `codecs/jpeg/README.md` → `/codecs/jpeg/`
- every other file (`schema.json`, sample data, examples) is copied into the site unchanged, e.g. `/codecs/jpeg/schema.json`
- relative links to directories without a `README.md`, and to paths that don't exist, point to GitHub
- the sidebar is built from the directory tree, so adding an extension needs no website changes

The markdown handling lives in `plugins/registry.ts`, the sidebar in `sidebar.ts`.

## Local development

Requires Node.js 20+.

```bash
npm ci
npm run docs:dev      # dev server at http://localhost:5173/
npm run docs:build    # production build into .vitepress/dist/
npm run docs:preview  # preview the production build
```

## Deployment

`.github/workflows/website.yml` builds the site on every pull request and deploys it to GitHub Pages on every push to `main`.

## Look and navigation

The top nav, head tags, social links and brand colors come from [@zarr-developers/vitepress-theme](https://github.com/zarr-developers/vitepress-theme), which zarr.dev uses too. Change them there, not here. This site pins a release tag of the package in `package.json`.
