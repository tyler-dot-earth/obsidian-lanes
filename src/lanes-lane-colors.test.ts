import { assert, describe, it } from '@effect/vitest'

import { lanesLegacyColumnColorFromEntries } from '#/src/lanes-lane-colors'

describe('lanesLegacyColumnColorFromEntries', () => {
	it('reads a hex string for a lane title', () => {
		assert.strictEqual(
			lanesLegacyColumnColorFromEntries(
				[
					['running', '#f7ffbd'],
					['done', '#bdffd9'],
				],
				'running',
			),
			'#f7ffbd',
		)
	})

	it('is null when the title is missing', () => {
		assert.strictEqual(lanesLegacyColumnColorFromEntries([['running', '#f7ffbd']], 'idea'), null)
	})
})
