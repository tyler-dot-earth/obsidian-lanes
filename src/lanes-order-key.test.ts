import { assert, describe, it } from '@effect/vitest'

import { compareLanesOrderValues, generateLanesOrderKey } from '#/src/lanes-order-key'

describe('generateLanesOrderKey', () => {
	it('creates keys that sort between neighbors', () => {
		const first = generateLanesOrderKey(null, null)
		const second = generateLanesOrderKey(first, null)
		const middle = generateLanesOrderKey(first, second)

		assert.ok(first < middle)
		assert.ok(middle < second)
	})
})

describe('compareLanesOrderValues', () => {
	it('sorts fractional keys lexicographically', () => {
		assert.ok(compareLanesOrderValues('a0', 'a1') < 0)
		assert.ok(compareLanesOrderValues('a1', 'a0') > 0)
	})

	it('sorts missing values last', () => {
		assert.ok(compareLanesOrderValues(null, 'a0') > 0)
		assert.ok(compareLanesOrderValues('a0', null) < 0)
	})
})
