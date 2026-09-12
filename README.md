# Lanes

Kanban lanes for Obsidian Bases.

![Lanes logo](logo.svg)

Bowling, swimlanes, you get it.

Board options live on the Bases view, not in a giant plugin settings dump.

## Status

A Lanes view can be chosen on a Base. The board bar sets group-by, title, cover, in-lane order, and which fields draw as buttons. Visible card fields come from the Bases Properties toolbar. Drag a card to move it; a line shows the drop target. Drag a column title to reorder lanes. Collapse a lane or add a note to it from the column header. Right-click a header for a color.

## Install for development

Plugin id is `lanes` (from `manifest.json`), not the repo folder name. Obsidian loads `Vault/.obsidian/plugins/lanes/`.

This plugin depends on a sibling checkout of `effect-obsidian`:

```text
~/effect-obsidian
~/obsidian-lanes
```

```bash
cd ~/effect-obsidian && pnpm install
cd ~/obsidian-lanes && pnpm install && pnpm build
```

`pnpm dev` also writes `main.js` and watches. The files Obsidian actually loads sit at the plugin repo root:

- `main.js`
- `manifest.json`
- `styles.css`

Do not symlink the whole repo into the plugins folder. That dumps `node_modules` and `src` into the vault. Link or copy only those three files. Symlinks mean a later rebuild shows up without copying again:

```bash
mkdir -p /path/to/Vault/.obsidian/plugins/lanes
ln -sfn /path/to/obsidian-lanes/main.js /path/to/Vault/.obsidian/plugins/lanes/main.js
ln -sfn /path/to/obsidian-lanes/manifest.json /path/to/Vault/.obsidian/plugins/lanes/manifest.json
ln -sfn /path/to/obsidian-lanes/styles.css /path/to/Vault/.obsidian/plugins/lanes/styles.css
```

Enable it by adding `"lanes"` to the array in `Vault/.obsidian/community-plugins.json`, or under **Settings → Community plugins**. Reload Obsidian (or disable/enable Lanes) so it picks the files up.

Requires Obsidian 1.10.0 or newer (Bases).

## Scripts

```bash
pnpm check
pnpm dev
pnpm build
```
