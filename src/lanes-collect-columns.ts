import { Array, Order } from 'effect'

import { mergeLanesColumnOrder } from '#src/lanes-column-order'
import { LANES_NO_VALUE_COLUMN } from '#src/lanes-column-title'

/** One grouped row before it is collected into a lane. */
export type LanesColumnRow<T> = {
	readonly laneTitle: string
	readonly item: T
}

/** One lane on the board after grouping. */
export type LanesColumn<T> = {
	readonly laneTitle: string
	readonly items: readonly T[]
}

const LaneTitleOrder: Order.Order<string> = (left, right) => {
	if (left === LANES_NO_VALUE_COLUMN) {
		return 1
	}

	if (right === LANES_NO_VALUE_COLUMN) {
		return -1
	}

	const compared = left.localeCompare(right)

	return compared < 0 ? -1 : compared > 0 ? 1 : 0
}

/** Groups rows into named lanes. With laneOrder, empty configured lanes are kept. */
export const collectLanesColumns = <T>(
	rows: readonly LanesColumnRow<T>[],
	laneOrder: readonly string[] = [],
): readonly LanesColumn<T>[] => {
	const grouped = Array.groupBy(rows, (row) => row.laneTitle)
	const liveTitles = Object.keys(grouped)

	const titles =
		laneOrder.length === 0
			? Array.sort(liveTitles, LaneTitleOrder)
			: mergeLanesColumnOrder({
					configured: laneOrder,
					liveTitles,
				})

	return Array.map(titles, (laneTitle) => {
		const bucket = grouped[laneTitle]

		return {
			laneTitle,
			items: bucket === undefined ? [] : Array.map(bucket, (row) => row.item),
		}
	})
}
