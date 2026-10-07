# Sahayak AI — frontend

## Sharing the UI without a backend

`preview.html` / `src/devPreview.tsx` mount the real components against
hardcoded data — no API, no Cognito, no S3. Use it to get UI feedback from
someone who cannot run the backend.

```bash
npm run build:preview     # -> dist-preview/ (index.html + assets)
```

Then share `dist-preview/`:

- **Netlify Drop** — drag the folder onto <https://app.netlify.com/drop> for a
  public URL in seconds. Easiest for a non-technical reviewer.
- **Locally** — `npx serve dist-preview` and open the printed URL.

The bundle must be served from a **domain root**, not a subpath: shared
components reference `/logo.png` and `/header.png` root-absolute. That rules out
GitHub Pages *project* sites (`user.github.io/repo/`) unless those paths are made
relative first.

A floating switcher (bottom of the screen) moves between Chat, Welcome and BI
wizard. Two dev-only harnesses stay off the switcher and are reachable by query
param: `?view=banner` and `?view=md`.

## Dev

```bash
npm run dev      # app at /, preview at /preview.html; proxies /api to :8501
npm run build    # production build of the real app (also emits preview.html)
```

---

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
