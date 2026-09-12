import { assert, describe, it } from '@effect/vitest'

import { lanesFrontmatterKey } from '#src/lanes-frontmatter-key'

describe('lanesFrontmatterKey', () => {
	it('strips the note. prefix', () => {
		assert.strictEqual(lanesFrontmatterKey('note.status'), 'status')
	})

	it('rejects file and formula properties', () => {
		assert.strictEqual(lanesFrontmatterKey('file.name'), null)
		assert.strictEqual(lanesFrontmatterKey('formula.layout'), null)
	})
})
