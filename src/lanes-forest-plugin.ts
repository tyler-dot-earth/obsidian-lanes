import { Array, Option, Predicate, Schema } from 'effect'
import type { App, TFile } from 'obsidian'

/** Structural copy object Forest.listCopiesForFile returns. */
export const ForestWorktreeCopy = Schema.Struct({
	worktreePath: Schema.String,
	head: Schema.String,
	branch: Schema.NullOr(Schema.String),
	absolutePath: Schema.String,
	vaultRelativePath: Schema.String,
})

export interface ForestWorktreeCopy extends Schema.Schema.Type<typeof ForestWorktreeCopy> {}

/** Duck-typed Forest plugin methods Lanes may call. Missing plugin means Forest is off. */
export interface ForestPluginApi {
	readonly listCopiesForFile: (vaultRelativePath: string) => Promise<readonly ForestWorktreeCopy[]>
	readonly previewWorktreeCopy: (copy: ForestWorktreeCopy) => void
	readonly openWorktreeDirectory: (absolutePath: string) => void
}

const FOREST_PLUGIN_ID = 'forest'

/** Picks the copy whose worktree matches frontmatter, else the first copy. */
export const forestCopyMatchingWorktreePath = (
	copies: readonly ForestWorktreeCopy[],
	worktreePath: string | null,
): ForestWorktreeCopy | null => {
	if (worktreePath === null) {
		return copies[0] ?? null
	}

	const normalized = worktreePath.replace(/\/$/, '')

	const matched = Array.findFirst(
		copies,
		(copy) => copy.worktreePath.replace(/\/$/, '') === normalized,
	)

	return Option.getOrElse(matched, () => copies[0] ?? null)
}

/** Frontmatter worktree_path on a session note. */
export const lanesNoteWorktreePath = (app: App, file: TFile): string | null => {
	const value = app.metadataCache.getFileCache(file)?.frontmatter?.['worktree_path']

	return Predicate.isString(value) && value !== '' ? value : null
}

export const decodeForestWorktreeCopies = (value: unknown): readonly ForestWorktreeCopy[] =>
	Option.getOrElse(Schema.decodeUnknownOption(Schema.Array(ForestWorktreeCopy))(value), () => [])

export const forestWorktreeDirectoryToOpen = (input: {
	readonly copies: readonly ForestWorktreeCopy[]
	readonly worktreePath: string | null
}): string | null => {
	if (input.worktreePath !== null) {
		return input.worktreePath
	}

	return forestCopyMatchingWorktreePath(input.copies, null)?.worktreePath ?? null
}

/** Forest plugin instance when that plugin is enabled and exposes the expected methods. */
export const getForestPluginApi = (app: App): ForestPluginApi | null => {
	if (!Predicate.hasProperty(app, 'plugins')) {
		return null
	}

	const plugins = app.plugins

	if (!Predicate.hasProperty(plugins, 'getPlugin')) {
		return null
	}

	// SAFETY: Obsidian PluginManager.getPlugin(id) is not in the public typings.
	const plugin = (plugins.getPlugin as (id: string) => unknown)(FOREST_PLUGIN_ID)

	if (
		!Predicate.hasProperty(plugin, 'listCopiesForFile') ||
		!Predicate.hasProperty(plugin, 'previewWorktreeCopy') ||
		!Predicate.hasProperty(plugin, 'openWorktreeDirectory')
	) {
		return null
	}

	// SAFETY: ForestPlugin implements these three methods when the plugin is enabled.
	return plugin as ForestPluginApi
}
