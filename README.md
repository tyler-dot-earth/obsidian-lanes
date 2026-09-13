# Lanes

Kanban board for Obsidian Bases. Bowling, swimlanes, you get it.

## Use

Requires Obsidian 1.10.0 or newer, with Bases enabled.

1. Open a `.base` file.
2. Add a view and choose **Lanes**.
3. Use the board bar to set group-by, title, cover, card order, link fields, monospace, badges, worktree fields, width, and position.
4. Visible card fields come from the Bases Properties toolbar.
5. Drag a card to move it. Drag a column title to reorder lanes. Collapse a lane or add a note from the column header. Right-click a header for a color.
6. Click a cover or screenshot thumb for a lightbox. Arrow keys step through that property.

Board options live on the view, not in a giant plugin settings dump. Plugin settings only hold defaults when a view has not set group-by or title.

If the Forest plugin is enabled, Worktree fields open that checkout's folder or preview this note from it.

License is 0BSD.

## Install for development

Plugin id is `lanes`. Obsidian loads `Vault/.obsidian/plugins/lanes/`.

Depends on a sibling checkout of [effect-obsidian](https://github.com/tyler-dot-earth/effect-obsidian):

```text
effect-obsidian/
obsidian-lanes/
```

```bash
cd effect-obsidian && pnpm install
cd ../obsidian-lanes && pnpm install && pnpm build
```

Symlink only `main.js`, `manifest.json`, and `styles.css`. Do not symlink the whole repo.

```bash
mkdir -p /path/to/Vault/.obsidian/plugins/lanes
ln -sfn /path/to/obsidian-lanes/main.js /path/to/Vault/.obsidian/plugins/lanes/main.js
ln -sfn /path/to/obsidian-lanes/manifest.json /path/to/Vault/.obsidian/plugins/lanes/manifest.json
ln -sfn /path/to/obsidian-lanes/styles.css /path/to/Vault/.obsidian/plugins/lanes/styles.css
```

Add `"lanes"` to `Vault/.obsidian/community-plugins.json`. Reload Obsidian.

## Scripts

```bash
pnpm check
pnpm dev
pnpm build
```
