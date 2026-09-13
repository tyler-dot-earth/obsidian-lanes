import { assert, describe, it } from '@effect/vitest'

import {
	insertDraggedPathAt,
	lanesGroupWriteValue,
	lanesOrderKeyAfterDrop,
	neighborOrderKeys,
} from '#/src/lanes-card-drop'
import { LANES_NO_VALUE_COLUMN } from '#/src/lanes-column-title'

describe('insertDraggedPathAt', () => {
	it('moves a path to the requested index', () => {
		assert.deepStrictEqual(
			insertDraggedPathAt({
				paths: ['a', 'b', 'c'],
				draggedPath: 'c',
				index: 0,
			}),
			['c', 'a', 'b'],
		)
	})
})

describe('lanesGroupWriteValue', () => {
	it('clears the property for No value', () => {
		assert.strictEqual(
			lanesGroupWriteValue({
				laneTitle: LANES_NO_VALUE_COLUMN,
				kind: 'string',
			}),
			null,
		)
	})

	it('writes booleans for checkbox lanes', () => {
		assert.strictEqual(
			lanesGroupWriteValue({
				laneTitle: 'false',
				kind: 'boolean',
			}),
			false,
		)
	})
})

describe('neighborOrderKeys', () => {
	it('reads fractional keys beside the dragged card', () => {
		const keysByPath = new Map<string, string | null>([
			['a', 'a0'],
			['b', 'a1'],
			['c', 'a2'],
		])

		assert.deepStrictEqual(
			neighborOrderKeys({
				orderedPaths: ['a', 'b', 'c'],
				draggedPath: 'b',
				keysByPath,
			}),
			{
				before: 'a0',
				after: 'a2',
			},
		)
	})
})

describe('lanesOrderKeyAfterDrop', () => {
	it('sorts between neighbors', () => {
		const key = lanesOrderKeyAfterDrop({
			before: 'a0',
			after: 'a2',
		})

		assert.ok(key > 'a0')
		assert.ok(key < 'a2')
	})
})
