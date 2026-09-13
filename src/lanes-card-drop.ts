import { Array, Match, Option, Schema } from 'effect'

import { LANES_NO_VALUE_COLUMN } from '#/src/lanes-column-title'
import { generateLanesOrderKey } from '#/src/lanes-order-key'

/** Fractional keys of the cards immediately before and after a drop. */
export const LanesNeighborOrderKeys = Schema.Struct({
	before: Schema.NullOr(Schema.String),
	after: Schema.NullOr(Schema.String),
})

export interface LanesNeighborOrderKeys extends Schema.Schema.Type<typeof LanesNeighborOrderKeys> {}

/** Kind of value stored in the group-by frontmatter field. */
export const LanesGroupValueKind = Schema.Literals(['boolean', 'number', 'string'])

export type LanesGroupValueKind = typeof LanesGroupValueKind.Type

/** Value to write for a lane, or null to remove the property. */
export const lanesGroupWriteValue = (input: {
	readonly laneTitle: string
	readonly kind: LanesGroupValueKind
}): string | number | boolean | null => {
	if (input.laneTitle === LANES_NO_VALUE_COLUMN) {
		return null
	}

	return Match.value(input.kind).pipe(
		Match.when('boolean', () => input.laneTitle === 'true'),
		Match.when('number', () => {
			const parsed = Number(input.laneTitle)

			return Number.isFinite(parsed) ? parsed : input.laneTitle
		}),
		Match.when('string', () => input.laneTitle),
		Match.exhaustive,
	)
}

/** Inserts draggedPath at index among paths, removing it first if present. */
export const insertDraggedPathAt = (input: {
	readonly paths: readonly string[]
	readonly draggedPath: string
	readonly index: number
}): readonly string[] => {
	const without = Array.filter(input.paths, (path) => path !== input.draggedPath)
	const clamped = Math.max(0, Math.min(input.index, without.length))

	return Option.getOrElse(Array.insertAt(without, clamped, input.draggedPath), () =>
		Array.append(without, input.draggedPath),
	)
}

/** Fractional keys of the cards immediately before and after the dragged path. */
export const neighborOrderKeys = (input: {
	readonly orderedPaths: readonly string[]
	readonly draggedPath: string
	readonly keysByPath: ReadonlyMap<string, string | null>
}): LanesNeighborOrderKeys => {
	const index = input.orderedPaths.indexOf(input.draggedPath)

	if (index === -1) {
		return LanesNeighborOrderKeys.make({
			before: null,
			after: null,
		})
	}

	const beforePath = input.orderedPaths[index - 1]
	const afterPath = input.orderedPaths[index + 1]

	return LanesNeighborOrderKeys.make({
		before: beforePath === undefined ? null : (input.keysByPath.get(beforePath) ?? null),
		after: afterPath === undefined ? null : (input.keysByPath.get(afterPath) ?? null),
	})
}

/** Fractional index for the dragged card given neighbor keys. */
export const lanesOrderKeyAfterDrop = (input: {
	readonly before: string | null
	readonly after: string | null
}): string => generateLanesOrderKey(input.before, input.after)
