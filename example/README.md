# Sample vault

A tiny bowling-league vault so you can open Lanes and take screenshots without dragging in a real vault. Same cards, six boards with different settings.

## Open it

From the plugin repo root, after `pnpm build`:

```bash
bash example/setup-plugin.sh
```

In Obsidian, **Open folder as vault** and pick `example/vault`. Settings → Community plugins → turn **Restricted mode** off, then enable **Lanes**.

If you see `Unknown view type: lanes`, Restricted mode is still on, Lanes is disabled, or the setup script did not run. Fix that and reload.

Do not symlink the whole plugin repo into `.obsidian/plugins`.

## Boards

| File             | What it shows                                                    |
| ---------------- | ---------------------------------------------------------------- |
| `board.base`     | Fill width, centered, covers, badges, links, empty `parked`      |
| `narrow.base`    | `sm` columns, left, covers only                                  |
| `collapsed.base` | `lg` columns, `idea` / `parked` / `done` collapsed               |
| `areas.base`     | Group by `area`, no covers, status badges                        |
| `text.base`      | No covers, file-name titles, hex lane colors, `xl` left          |
| `active.base`    | `backlog` / `active` / `done`, only `active` open, `lg` centered |

`parked` has no cards on purpose.
