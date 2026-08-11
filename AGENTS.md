# AGENTS.md

Minimalist vanilla-JS portfolio for Võ Hữu Trường Quỳnh (Raymond). Deployed as static GitHub Pages at https://rolniuq.github.io/portfolio/ (repo: `rolniuq/portfolio`, branch `master`). No build tools — plain HTML/CSS/JS + marked.js from CDN.

## Layout

- `index.html` — single page. Empty `<section id="about|projects|blog|contact">` shells; content is injected at runtime.
- `src/js/script.js` — all logic. Loads markdown via `fetch` (`loadMarkdownFile`), parses `---` front matter (`parseFrontMatter`), renders with `marked.parse`. Handlers: `loadPortfolio`, `loadFeaturedProject`, `initNavScrollSpy`, `initStickyHeader`, `initGoToTop`.
- `src/css/style.css` — design tokens as CSS custom properties. `:root` = light theme, `@media (prefers-color-scheme: dark)` = dark override (driven by device setting, no toggle). Everything else is driven by `var(--*)`. Palette matches Claude Code (warm neutrals + coral accent `#C15F3C` / `#D97757`).
- `content/*.md` — source of truth for page content. Front matter holds metadata:
  - `about.md`: `name`, `title`, `skills` (comma-separated → rendered as pill tags)
  - `projects.md`: repeated blocks of front matter delimited by `---`; fields `name`, `description`, `link`, `tags`. Parser in `loadPortfolio` uses a 3-dash state machine; each block = one project card.
  - `blog.md`: `link` → external Next.js blog (https://rolniuqblogs.vercel.app/). `fetchBlogPosts` scrapes its RSC HTML payload with escaped-quote regexes to build cards.
  - `contact.md`: rendered as plain markdown body.
- `start-server.js` / `start-server.py` — local dev servers on port 8000 (only for serving static files + CORS-less fetches).

## Conventions / gotchas

- Data lives in markdown files, NOT markup — edit content there.
- No framework, no module bundler: plain script tags, globals, `DOMContentLoaded` init. `marked` is loaded via jsdelivr CDN in `index.html`.
- Projects "Show More/Less" toggle: first `INITIAL_VISIBLE = 4` projects render, rest collapse behind a button (`#projectsToggle`/`#projectsExtra`).
- Keep the project parser's 3-dash state machine in mind when touching `projects.md` formatting.
- Footer + header use inline SVG icons (no icon library).
- `npm dev` / `npm install` — none. Use `node start-server.js`.

## Automated pipelines

- `.github/workflows/featured-project.yml` — scheduled (weekly) + manual + on-push GitHub Action. Runs `scripts/featured.mjs`, which fetches `rolniuq`'s public repos (skips forks/archived/meta repos `portfolio`, `blog`), sends summaries to Gemini via `secrets.GEMINI_API_KEY`, and commits the picked project to `featured.json`. Geminis selects name/blurb/tags. `paths-ignore: [featured.json]` on the push trigger prevents a commit-loop.
- `scripts/featured.mjs` — Node (18+, zero deps). Needs `GH_TOKEN` + `GEMINI_API_KEY` env vars. Writes `featured.json`; on any failure it exits non-zero and leaves the previous file untouched.
- Site-side: `loadFeaturedProject()` fetches `featured.json` and renders a pinned "Featured Project" card (`.featured-project`) at the top of the Projects section. 404/fetch failure → card simply skipped, no error.