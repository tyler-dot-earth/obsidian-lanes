import { assert, describe, it } from '@effect/vitest'

import { collectLanesColumns } from '#/src/lanes-collect-columns'
import { LANES_NO_VALUE_COLUMN } from '#/src/lanes-column-title'

describe('collectLanesColumns', () => {
	it('groups items by lane title and sorts titles alphabetically', () => {
		const columns = collectLanesColumns([
			{ laneTitle: 'running', item: 'a' },
			{ laneTitle: 'idea', item: 'b' },
			{ laneTitle: 'running', item: 'c' },
			{ laneTitle: 'done', item: 'd' },
		])

		assert.deepStrictEqual(
			columns.map((column) => ({
				laneTitle: column.laneTitle,
				items: column.items,
			})),
			[
				{ laneTitle: 'done', items: ['d'] },
				{ laneTitle: 'idea', items: ['b'] },
				{ laneTitle: 'running', items: ['a', 'c'] },
			],
		)
	})

	it('puts No value last', () => {
		const columns = collectLanesColumns([
			{ laneTitle: LANES_NO_VALUE_COLUMN, item: 'none' },
			{ laneTitle: 'idea', item: 'b' },
		])

		assert.deepStrictEqual(
			columns.map((column) => column.laneTitle),
			['idea', LANES_NO_VALUE_COLUMN],
		)
	})

	it('keeps empty configured lanes', () => {
		const columns = collectLanesColumns(
			[{ laneTitle: 'running', item: 'a' }],
			['idea', 'running', 'done'],
		)

		assert.deepStrictEqual(
			columns.map((column) => ({ laneTitle: column.laneTitle, n: column.items.length })),
			[
				{ laneTitle: 'idea', n: 0 },
				{ laneTitle: 'running', n: 1 },
				{ laneTitle: 'done', n: 0 },
			],
		)
	})
})
