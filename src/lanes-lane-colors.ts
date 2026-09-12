import { Array, Option, Predicate, Result, Schema } from 'effect'
import type { BasesViewConfig } from 'obsidian'

/** View config key for per-lane accent colors. */
export const LANES_LANE_COLORS_CONFIG_KEY = 'laneColors'

/** Legacy Base Board / kanban hex map, e.g. `{ running: "#f7ffbd" }`. */
export const LANES_COLUMN_COLORS_CONFIG_KEY = 'columnColors'

/** Theme color names used as lane accents. */
export const LANES_LANE_COLOR_NAMES = [
	'red',
	'orange',
	'yellow',
	'green',
	'cyan',
	'blue',
	'purple',
	'pink',
] as const

export type LanesLaneColorName = (typeof LANES_LANE_COLOR_NAMES)[number]

const LanesLaneColors = Schema.Record(Schema.String, Schema.String)

/** Reads lane title → color name from view config. */
export const readLanesLaneColors = (config: BasesViewConfig): Readonly<Record<string, string>> => {
	const decoded = Schema.decodeUnknownOption(LanesLaneColors)(
		config.get(LANES_LANE_COLORS_CONFIG_KEY),
	)

	if (Option.isNone(decoded)) {
		return {}
	}

	return decoded.value
}

/** Hex or CSS color for a lane title from string entries, skipping object values. */
export const lanesLegacyColumnColorFromEntries = (
	entries: readonly (readonly [string, string])[],
	laneTitle: string,
): string | null =>
	Option.getOrNull(
		Array.findFirst(entries, ([title, value]) => title === laneTitle && value !== '').pipe(
			Option.map(([, value]) => value),
		),
	)

/** Hex or CSS color from legacy columnColors for a lane title. */
export const readLanesLegacyColumnColor = (
	config: BasesViewConfig,
	laneTitle: string,
): string | null => {
	const decoded = Schema.decodeUnknownOption(Schema.Record(Schema.String, Schema.Unknown))(
		config.get(LANES_COLUMN_COLORS_CONFIG_KEY),
	)

	if (Option.isNone(decoded)) {
		return null
	}

	const entries = Array.filterMap(Object.entries(decoded.value), ([title, value]) =>
		Predicate.isString(value) ? Result.succeed([title, value] as const) : Result.failVoid,
	)

	return lanesLegacyColumnColorFromEntries(entries, laneTitle)
}

/** True when the name is a supported lane accent. */
export const isLanesLaneColorName = (name: string): name is LanesLaneColorName =>
	Array.contains(LANES_LANE_COLOR_NAMES, name)
