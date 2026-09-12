import { Array, Option, Result, Schema } from 'effect'
import type { BasesViewConfig } from 'obsidian'

/** View config key for which lanes are collapsed. Matches existing `.base` yaml. */
export const LANES_COLLAPSED_COLUMNS_CONFIG_KEY = 'collapsedColumns'

/** Lane titles whose flag is true. */
export const lanesCollapsedTitlesFromFlags = (
	flags: ReadonlyMap<string, boolean>,
): ReadonlySet<string> =>
	new Set(
		Array.filterMap([...flags], ([title, collapsed]) =>
			collapsed ? Result.succeed(title) : Result.failVoid,
		),
	)

/** Lane titles that should render as a slim collapsed column. */
export const readLanesCollapsedColumns = (config: BasesViewConfig): ReadonlySet<string> => {
	const raw = config.get(LANES_COLLAPSED_COLUMNS_CONFIG_KEY)
	const fromArray = Schema.decodeUnknownOption(Schema.Array(Schema.String))(raw)

	if (Option.isSome(fromArray)) {
		return new Set(Array.filter(fromArray.value, (title) => title !== ''))
	}

	const fromObject = Schema.decodeUnknownOption(Schema.Record(Schema.String, Schema.Boolean))(raw)

	if (Option.isNone(fromObject)) {
		return new Set()
	}

	return lanesCollapsedTitlesFromFlags(new Map(Object.entries(fromObject.value)))
}

/** Config value that keeps collapsed lanes as `{ title: true }` in the `.base` file. */
export const lanesCollapsedColumnsConfigValue = (
	titles: ReadonlySet<string>,
): Readonly<Record<string, true>> => Object.fromEntries([...titles].map((title) => [title, true]))
