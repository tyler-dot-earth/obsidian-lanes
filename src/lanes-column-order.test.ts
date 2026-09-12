import { assert, describe, it } from '@effect/vitest'

import { mergeLanesColumnOrder } from '#src/lanes-column-order'

describe('mergeLanesColumnOrder', () => {
	it('keeps configured order and appends new live titles', () => {
		assert.deepStrictEqual(
			mergeLanesColumnOrder({
				configured: ['idea', 'running', 'done'],
				liveTitles: ['done', 'blocked', 'idea'],
			}),
			['idea', 'running', 'done', 'blocked'],
		)
	})

	it('uses live titles when nothing is configured', () => {
		assert.deepStrictEqual(
			mergeLanesColumnOrder({
				configured: [],
				liveTitles: ['running', 'idea'],
			}),
			['running', 'idea'],
		)
	})
})
