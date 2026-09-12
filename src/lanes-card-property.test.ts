import { assert, describe, it } from '@effect/vitest'

import {
	lanesPropertyFieldFromTexts,
	lanesUrlButtonLabel,
	lanesUrlButtonLabels,
	parseLanesPropertyLink,
} from '#src/lanes-card-property'

describe('lanesUrlButtonLabel', () => {
	it('uses the last short path segment', () => {
		assert.strictEqual(lanesUrlButtonLabel('https://example.com/org/repo/pulls/29'), '29')
	})

	it('falls back to hostname when the path is empty', () => {
		assert.strictEqual(lanesUrlButtonLabel('https://example.com/'), 'example.com')
	})
})

describe('lanesUrlButtonLabels', () => {
	it('keeps a lone pull URL as the last path segment', () => {
		assert.deepStrictEqual(lanesUrlButtonLabels(['https://example.com/org/repo/pulls/29']), ['29'])
	})

	it('strips a shared origin prefix so same-host URLs stay distinct', () => {
		const labels = lanesUrlButtonLabels([
			'http://127.0.0.1:6006/?path=/story/list-page--wide',
			'http://127.0.0.1:6006/?path=/story/list-page--narrow',
			'https://app.example.localhost/list',
		])

		assert.deepStrictEqual(labels, ['list-page--wide', 'list-page--narrow', 'list'])
	})
})

describe('parseLanesPropertyLink', () => {
	it('parses http URLs', () => {
		const link = parseLanesPropertyLink('https://example.com/a')

		assert.strictEqual(link?.kind, 'url')
		assert.strictEqual(link?.href, 'https://example.com/a')
	})

	it('parses image wikilinks as thumbnails', () => {
		const link = parseLanesPropertyLink('[[covers/home.png|Cover]]')

		assert.strictEqual(link?.kind, 'image')
		assert.strictEqual(link?.href, 'covers/home.png')
		assert.strictEqual(link?.label, 'Cover')
	})

	it('parses note wikilinks', () => {
		const link = parseLanesPropertyLink('[[docs/sessions/001-foo]]')

		assert.strictEqual(link?.kind, 'wiki')
		assert.strictEqual(link?.href, 'docs/sessions/001-foo')
		assert.strictEqual(link?.label, '001-foo')
	})

	it('returns null for plain text', () => {
		assert.strictEqual(parseLanesPropertyLink('running'), null)
	})
})

describe('lanesPropertyFieldFromTexts', () => {
	it('collects URL buttons when asLinks is true', () => {
		const field = lanesPropertyFieldFromTexts({
			name: 'PR',
			texts: ['https://example.com/pulls/29'],
			asLinks: true,
			monospace: false,
		})

		assert.strictEqual(field?.links[0]?.kind, 'url')
		assert.strictEqual(field?.links[0]?.label, '29')
	})

	it('keeps URLs as text when asLinks is false', () => {
		const field = lanesPropertyFieldFromTexts({
			name: 'PR',
			texts: ['https://example.com/pulls/29'],
			asLinks: false,
		})

		assert.strictEqual(field?.links.length, 0)
		assert.deepStrictEqual(field?.texts, ['https://example.com/pulls/29'])
	})

	it('turns screenshot wikilinks into images even when not Link fields', () => {
		const field = lanesPropertyFieldFromTexts({
			name: 'screenshots',
			texts: ['[[covers/note.png]], [[screenshots/note-desktop.png]]'],
			asLinks: false,
		})

		assert.deepStrictEqual(field?.texts, [])
		assert.strictEqual(field?.links.length, 2)
		assert.strictEqual(field?.links[0]?.kind, 'image')
		assert.strictEqual(field?.links[0]?.href, 'covers/note.png')
		assert.strictEqual(field?.links[1]?.href, 'screenshots/note-desktop.png')
	})

	it('keeps list leftovers as separate lines', () => {
		const field = lanesPropertyFieldFromTexts({
			name: 'domains',
			texts: ['apps/web', 'packages/ui', 'packages/engine'],
			asLinks: false,
		})

		assert.deepStrictEqual(field?.texts, ['apps/web', 'packages/ui', 'packages/engine'])
	})

	it('marks a field as monospace', () => {
		const field = lanesPropertyFieldFromTexts({
			name: 'id',
			texts: ['NOTE-001'],
			asLinks: false,
			monospace: true,
		})

		assert.strictEqual(field?.monospace, true)
	})
})
