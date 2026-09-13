import { Array, Option, Predicate, Result, Schema } from 'effect'
import type { App, BasesPropertyId, TFile } from 'obsidian'

import { lanesFrontmatterKey } from '#src/lanes-frontmatter-key'

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

/** The copy in that worktree, or null if this note is not there. */
export const forestCopyForWorktreePath = (
	copies: readonly ForestWorktreeCopy[],
	worktreePath: string,
): ForestWorktreeCopy | null => {
	const normalized = worktreePath.replace(/\/$/, '')

	return Option.getOrNull(
		Array.findFirst(copies, (copy) => copy.worktreePath.replace(/\/$/, '') === normalized),
	)
}

/** Directory strings stored on a worktree field. */
export const lanesWorktreePathsFromUnknown = (value: unknown): readonly string[] => {
	const asString = Schema.decodeUnknownOption(Schema.String)(value)

	if (Option.isSome(asString) && asString.value.trim() !== '') {
		return [asString.value.trim()]
	}

	const asList = Schema.decodeUnknownOption(Schema.Array(Schema.String))(value)

	if (Option.isNone(asList)) {
		return []
	}

	return Array.filterMap(asList.value, (path) => {
		const trimmed = path.trim()

		return trimmed === '' ? Result.failVoid : Result.succeed(trimmed)
	})
}

/** Worktree directories from the card's Worktree fields on a note. */
export const lanesWorktreePathsForFile = (
	app: App,
	file: TFile,
	propertyIds: readonly BasesPropertyId[],
): readonly string[] => {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter

	if (frontmatter === undefined) {
		return []
	}

	const paths: string[] = []

	for (const propertyId of propertyIds) {
		const key = lanesFrontmatterKey(propertyId)

		if (key === null || !Predicate.hasProperty(frontmatter, key)) {
			continue
		}

		paths.push(...lanesWorktreePathsFromUnknown(frontmatter[key]))
	}

	return paths
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
