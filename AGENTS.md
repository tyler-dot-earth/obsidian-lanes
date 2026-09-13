# Lanes

Obsidian plugin. Kanban view for Bases. Plugin id `lanes`. View type `lanes`, not `kanban`.

`LanesView` groups cards by `lanesProperty`. Card title is `cardTitleProperty` (else file name). Cover is `coverProperty` or native `image`. In-lane sort is `cardSort`; manual order uses fractional indexes in `orderProperty` (default `lanes_order`). Those settings live on the board bar (Group by, Title, Cover, Card order, Link fields, Monospace, Badges, Worktree fields, Width), not Configure. `laneWidth` is `sm` / `md` / `lg` / `xl` / `fill` (legacy `fillWidth: true` is fill). Monospace writes `cardMonospaceProperties`. Badges write `cardBadgeProperties`; right-click a chip for `badgeColors`. Worktree fields write `cardWorktreeProperties`; click opens the folder via Forest. Column order is `boardColumns` (empty lanes stay). Collapsed lanes are `collapsedColumns`. Lane colors are `laneColors`, with hex fallback from `columnColors`. Visible card fields come from the Bases Properties toolbar (`order`). Link fields writes `cardLinkProperties`. Card click uses `cardOpenBehavior` (`current` / `tab` / `split` / `window`). Column plus creates a note with the lane group-by value. Plugin settings hold defaults when a view has not set group-by or title. Drops write group-by frontmatter and a new order key. Do not keep a reference to `this.data`.

## Layout

- `src/main.ts` is the Plugin host: onload/onunload, settings tab registration
- Package imports: `#/src/lanes-plugin-settings`
- Effect programs live in named modules, not in the Plugin class
- `effect-obsidian` is a sibling repo (`../effect-obsidian`), consumed via `file:`
- Release artifacts at repo root: `main.js`, `manifest.json`, `styles.css`

## Effect

- Latest Effect v4 rc. Installed modules we actually lean on: `Effect`, `Schema`, `Match`, `Option`, `Array`, `Result`, `Order`, `Predicate`, `Layer`, `Logger`.
- Plugin class is the host boundary. `onload` may `await runtime.runPromise(...)`
- Inside Effect modules: no `async`/`await`, no `try`/`catch`, no `Date.now`
- IO uses `Effect.fn("Lanes.operation")` and `Schema.TaggedError`. Vanilla DOM stays outside Effect.
- Tests: `@effect/vitest` `it.effect` and `assert`

## UI

- Vanilla DOM. No React
- Optional Forest plugin: Worktree fields and card right-click preview/open a worktree folder. Duck-typed via `getForestPluginApi`. Forest off means those items Notice or stay absent.
- Board config belongs on the Bases view (`config.get` / `config.set` and `BasesViewRegistration.options`)
- Global plugin settings stay empty until something is truly plugin-wide

## Install into a vault

Plugin id is `lanes`. After `pnpm build` or `pnpm dev`, symlink (preferred) or copy only `main.js`, `manifest.json`, and `styles.css` into `Vault/.obsidian/plugins/lanes/`. Do not symlink the whole repo. Add `"lanes"` to `community-plugins.json` without dropping other ids.

## Tooling

- pnpm, oxfmt, oxlint (type-aware), vitest, esbuild
- Vendored anti-slop at `tools/oxlint/anti-slop/` (generic + Effect plugins)
- `pnpm check` before push
