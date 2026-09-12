import { assert, describe, it } from '@effect/vitest'

import { lanesBadgeColorForWord, lanesBadgeColorsWithValue } from '#src/lanes-badge-colors'

describe('lanesBadgeColorForWord', () => {
	it('maps high to red', () => {
		assert.strictEqual(lanesBadgeColorForWord('High'), 'red')
	})

	it('is null for unknown words', () => {
		assert.strictEqual(lanesBadgeColorForWord('grok-4.5'), null)
	})
})

describe('lanesBadgeColorsWithValue', () => {
	it('sets a color under a property id', () => {
		assert.deepStrictEqual(
			lanesBadgeColorsWithValue({
				stored: {},
				propertyId: 'note.primary_reasoning',
				value: 'high',
				color: 'red',
			}),
			{
				'note.primary_reasoning': {
					high: 'red',
				},
			},
		)
	})

	it('clears a value and drops empty properties', () => {
		assert.deepStrictEqual(
			lanesBadgeColorsWithValue({
				stored: {
					'note.primary_reasoning': {
						high: 'red',
					},
				},
				propertyId: 'note.primary_reasoning',
				value: 'high',
				color: null,
			}),
			{},
		)
	})
})
