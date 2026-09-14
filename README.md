# Lanes 🎳 an Obsidian kanban plugin

Bowling, swimlanes, you get it. For Bases.

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

## Screenshots

<img width="2364" height="2138" alt="Lanes board grouped by area into league, practice, and gear, with colored status badges." src="https://github.com/user-attachments/assets/8cf287f3-5a07-498b-b537-649efbfa499e" />
<img width="2364" height="2138" alt="Lanes board with five status columns, cover images, tag chips, and an empty parked lane." src="https://github.com/user-attachments/assets/0f1549fc-0ddb-4f5e-95f6-c1b61072eb5b" />
<img width="2364" height="2138" alt="Lanes board with idea, parked, and done collapsed. Running and blocked are open with large covers." src="https://github.com/user-attachments/assets/736ff106-e527-4dc4-97de-0b6cf2ce815b" />
<img width="2364" height="2138" alt="Lanes board with five skinny status columns aligned left. Cards show covers and an empty parked lane." src="https://github.com/user-attachments/assets/225f6add-11da-436c-b1f0-2dfe023df026" />
<img width="2364" height="2138" alt="Lanes board without covers. File-name titles, a wide idea column, and a running column on the left." src="https://github.com/user-attachments/assets/81cc3b5f-cba9-4d75-a230-fc6119483f38" />
<img width="2364" height="2138" alt="Lanes board with backlog and done collapsed. The active column is centered and open, with cover images." src="https://github.com/user-attachments/assets/4b7f1c80-ed84-46b5-bda0-1eec22e5548f" />

## Sample vault

`example/vault` is a bowling-league vault with six boards (`board`, `narrow`, `collapsed`, `areas`, `text`, `active`). See `example/README.md`.

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

Add `"lanes"` to `Vault/.obsidian/community-plugins.json`. Reload Obsidian. Turn **Restricted mode** off (Settings → Community plugins) or the plugin will not load.

## Scripts

```bash
pnpm check
pnpm dev
pnpm build
pnpm release -- patch
```
