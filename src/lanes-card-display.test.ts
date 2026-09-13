import { assert, describe, it } from '@effect/vitest'

import { lanesCardTitleText, parseLanesCoverHref } from '#/src/lanes-card-display'

describe('lanesCardTitleText', () => {
	it('uses property text when it is non-empty', () => {
		assert.strictEqual(
			lanesCardTitleText({
				propertyText: 'Conductor',
				fileBasename: '001-conductor',
			}),
			'Conductor',
		)
	})

	it('falls back to the file basename', () => {
		assert.strictEqual(
			lanesCardTitleText({
				propertyText: null,
				fileBasename: '001-conductor',
			}),
			'001-conductor',
		)
	})
})

describe('parseLanesCoverHref', () => {
	it('keeps http URLs', () => {
		assert.strictEqual(
			parseLanesCoverHref('https://example.com/cover.png'),
			'https://example.com/cover.png',
		)
	})

	it('unwraps wikilinks', () => {
		assert.strictEqual(
			parseLanesCoverHref('[[covers/001-conductor.png]]'),
			'covers/001-conductor.png',
		)
	})

	it('unwraps wikilinks with aliases', () => {
		assert.strictEqual(
			parseLanesCoverHref('[[covers/001-conductor.png|Cover]]'),
			'covers/001-conductor.png',
		)
	})

	it('returns null for empty text', () => {
		assert.strictEqual(parseLanesCoverHref('   '), null)
	})
})
