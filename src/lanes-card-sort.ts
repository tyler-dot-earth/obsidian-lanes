import { Match, Option, Schema } from 'effect'
import type { BasesViewConfig } from 'obsidian'

import { compareLanesOrderValues, LanesOrderValue } from '#/src/lanes-order-key'

/** View config key for how cards are sorted inside a lane. */
export const LANES_CARD_SORT_CONFIG_KEY = 'cardSort'

/** How cards are ordered within a lane. */
export const LanesCardSort = Schema.Literals([
	'manual',
	'mtime-desc',
	'mtime-asc',
	'ctime-desc',
	'ctime-asc',
	'name-asc',
	'name-desc',
])

export type LanesCardSort = typeof LanesCardSort.Type

/** Labels for the board Sort menu. */
export const LANES_CARD_SORT_OPTIONS: readonly {
	readonly sort: LanesCardSort
	readonly label: string
}[] = [
	{ sort: 'manual', label: 'Manual' },
	{ sort: 'mtime-desc', label: 'Modified, newest first' },
	{ sort: 'mtime-asc', label: 'Modified, oldest first' },
	{ sort: 'ctime-desc', label: 'Created, newest first' },
	{ sort: 'ctime-asc', label: 'Created, oldest first' },
	{ sort: 'name-asc', label: 'File name, A to Z' },
	{ sort: 'name-desc', label: 'File name, Z to A' },
]

/** Sort keys for one card when ordering a lane. */
export const LanesCardSortKey = Schema.Struct({
	orderValue: LanesOrderValue,
	mtime: Schema.Number,
	ctime: Schema.Number,
	basename: Schema.String,
})

export interface LanesCardSortKey extends Schema.Schema.Type<typeof LanesCardSortKey> {}

/** Reads the lane sort mode from view config. Missing or invalid values are manual. */
export const readLanesCardSort = (config: BasesViewConfig): LanesCardSort =>
	Schema.decodeUnknownOption(LanesCardSort)(config.get(LANES_CARD_SORT_CONFIG_KEY)).pipe(
		Option.getOrElse(() => 'manual' as const),
	)

/** Compares two cards for the selected lane sort mode. */
export const compareLanesCardSort = (
	sort: LanesCardSort,
	left: LanesCardSortKey,
	right: LanesCardSortKey,
): number =>
	Match.value(sort).pipe(
		Match.when('manual', () => compareLanesOrderValues(left.orderValue, right.orderValue)),
		Match.when('mtime-desc', () => right.mtime - left.mtime),
		Match.when('mtime-asc', () => left.mtime - right.mtime),
		Match.when('ctime-desc', () => right.ctime - left.ctime),
		Match.when('ctime-asc', () => left.ctime - right.ctime),
		Match.when('name-asc', () => left.basename.localeCompare(right.basename)),
		Match.when('name-desc', () => right.basename.localeCompare(left.basename)),
		Match.exhaustive,
	)
