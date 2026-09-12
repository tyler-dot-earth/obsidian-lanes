import { Order, Predicate, Schema } from 'effect'
import { generateKeyBetween } from 'fractional-indexing'

/** Frontmatter value used for manual card order. */
export const LanesOrderValue = Schema.NullOr(Schema.Union([Schema.String, Schema.Number]))

export type LanesOrderValue = typeof LanesOrderValue.Type

/** Generates a fractional index between two existing order keys. */
export const generateLanesOrderKey = (before: string | null, after: string | null): string =>
	generateKeyBetween(before, after)

const compareNullLast = (left: LanesOrderValue, right: LanesOrderValue): number => {
	if (left === null && right === null) {
		return 0
	}

	if (left === null) {
		return 1
	}

	return -1
}

/** Lexicographic compare for fractional keys; numbers compare numerically. Null sorts last. */
export const compareLanesOrderValues = (left: LanesOrderValue, right: LanesOrderValue): number => {
	if (left === null || right === null) {
		return compareNullLast(left, right)
	}

	if (Predicate.isNumber(left) && Predicate.isNumber(right)) {
		return Order.Number(left, right)
	}

	return Order.String(
		Predicate.isString(left) ? left : String(left),
		Predicate.isString(right) ? right : String(right),
	)
}
