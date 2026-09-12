import { Array, Option, Schema } from 'effect'
import type { BasesViewConfig } from 'obsidian'

import { isLanesLaneColorName, type LanesLaneColorName } from '#src/lanes-lane-colors'

/** View config key for per-value badge colors, nested as property id → value → color name. */
export const LANES_BADGE_COLORS_CONFIG_KEY = 'badgeColors'

const LanesBadgeColors = Schema.Record(Schema.String, Schema.Record(Schema.String, Schema.String))

/** Built-in value → color for common enum words. User colors still win. */
export const LANES_BADGE_WORD_COLORS: readonly {
	readonly word: string
	readonly color: LanesLaneColorName
}[] = [
	{ word: 'high', color: 'red' },
	{ word: 'hot', color: 'red' },
	{ word: 'blocked', color: 'red' },
	{ word: 'error', color: 'red' },
	{ word: 'failed', color: 'red' },
	{ word: 'critical', color: 'red' },
	{ word: 'medium', color: 'orange' },
	{ word: 'warn', color: 'orange' },
	{ word: 'warning', color: 'orange' },
	{ word: 'low', color: 'green' },
	{ word: 'ok', color: 'green' },
	{ word: 'done', color: 'green' },
	{ word: 'success', color: 'green' },
	{ word: 'running', color: 'yellow' },
	{ word: 'idea', color: 'purple' },
	{ word: 'parked', color: 'cyan' },
	{ word: 'cancelled', color: 'pink' },
]

/** Color from the built-in word list, or null if the value is unknown. */
export const lanesBadgeColorForWord = (value: string): LanesLaneColorName | null => {
	const word = value.trim().toLowerCase()

	return Option.getOrNull(
		Array.findFirst(LANES_BADGE_WORD_COLORS, (row) => row.word === word).pipe(
			Option.map((row) => row.color),
		),
	)
}

/** User color for a property value, else the built-in word color. */
export const readLanesBadgeColor = (
	config: BasesViewConfig,
	propertyId: string,
	value: string,
): LanesLaneColorName | null => {
	const stored = Schema.decodeUnknownOption(LanesBadgeColors)(
		config.get(LANES_BADGE_COLORS_CONFIG_KEY),
	)

	if (Option.isSome(stored)) {
		const fromUser = lanesBadgeColorFromStored(stored.value, propertyId, value)

		if (fromUser !== null) {
			return fromUser
		}
	}

	return lanesBadgeColorForWord(value)
}

const lanesBadgeColorFromStored = (
	stored: Readonly<Record<string, Readonly<Record<string, string>>>>,
	propertyId: string,
	value: string,
): LanesLaneColorName | null => {
	for (const [id, values] of Object.entries(stored)) {
		if (id !== propertyId) {
			continue
		}

		return lanesBadgeColorFromValueMap(values, value)
	}

	return null
}

const lanesBadgeColorFromValueMap = (
	values: Readonly<Record<string, string>>,
	value: string,
): LanesLaneColorName | null => {
	for (const [word, color] of Object.entries(values)) {
		if (word === value && isLanesLaneColorName(color)) {
			return color
		}
	}

	return null
}

/** Next badgeColors map after setting or clearing one value. */
export const lanesBadgeColorsWithValue = (input: {
	readonly stored: unknown
	readonly propertyId: string
	readonly value: string
	readonly color: string | null
}): Readonly<Record<string, Readonly<Record<string, string>>>> => {
	const decoded = Schema.decodeUnknownOption(LanesBadgeColors)(input.stored)
	const root = Option.isSome(decoded) ? decoded.value : {}
	const nextRoot: [string, Record<string, string>][] = []
	let foundProperty = false

	for (const [propertyId, values] of Object.entries(root)) {
		if (propertyId !== input.propertyId) {
			nextRoot.push([propertyId, Object.fromEntries(Object.entries(values))])
			continue
		}

		foundProperty = true
		const nextValues = lanesBadgeValuesWithColor(values, input.value, input.color)

		if (Object.keys(nextValues).length > 0) {
			nextRoot.push([propertyId, nextValues])
		}
	}

	if (!foundProperty && input.color !== null) {
		nextRoot.push([input.propertyId, { [input.value]: input.color }])
	}

	return Object.fromEntries(nextRoot)
}

const lanesBadgeValuesWithColor = (
	values: Readonly<Record<string, string>>,
	value: string,
	color: string | null,
): Record<string, string> => {
	const nextValues: [string, string][] = []

	for (const [word, existing] of Object.entries(values)) {
		if (word === value) {
			continue
		}

		nextValues.push([word, existing])
	}

	if (color !== null) {
		nextValues.push([value, color])
	}

	return Object.fromEntries(nextValues)
}
