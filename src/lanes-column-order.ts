import { Array, Option, Schema } from 'effect'
import type { BasesViewConfig } from 'obsidian'

/** View config key for persisted lane titles, including empty lanes. */
export const LANES_BOARD_COLUMNS_CONFIG_KEY = 'boardColumns'

/** Configured lane titles first, then any live titles that are not yet listed. */
export const mergeLanesColumnOrder = (input: {
	readonly configured: readonly string[]
	readonly liveTitles: readonly string[]
}): readonly string[] => {
	const uniqueConfigured = Array.dedupe(Array.filter(input.configured, (title) => title !== ''))

	return Array.appendAll(
		uniqueConfigured,
		Array.filter(input.liveTitles, (title) => !uniqueConfigured.includes(title)),
	)
}

/** Reads persisted boardColumns from the view config. */
export const readLanesBoardColumns = (config: BasesViewConfig): readonly string[] =>
	Option.getOrElse(
		Schema.decodeUnknownOption(Schema.Array(Schema.String))(
			config.get(LANES_BOARD_COLUMNS_CONFIG_KEY),
		),
		() => [],
	)
