import { assert, describe, it } from '@effect/vitest'

import {
	lanesCollapsedColumnsConfigValue,
	lanesCollapsedTitlesFromFlags,
} from '#/src/lanes-collapsed-columns'

describe('lanesCollapsedTitlesFromFlags', () => {
	it('keeps titles whose flag is true', () => {
		assert.deepStrictEqual(
			[
				...lanesCollapsedTitlesFromFlags(
					new Map([
						['done', true],
						['idea', false],
					]),
				),
			],
			['done'],
		)
	})
})

describe('lanesCollapsedColumnsConfigValue', () => {
	it('writes true flags', () => {
		assert.deepStrictEqual(lanesCollapsedColumnsConfigValue(new Set(['done'])), { done: true })
	})
})
