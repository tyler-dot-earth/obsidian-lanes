import { assert, describe, it } from '@effect/vitest'

import { lanesPropertyIdsByDisplayName, notePropertyIdFromName } from '#src/lanes-view-options'

describe('lanesPropertyIdsByDisplayName', () => {
	it('sorts by display name, case-insensitive', () => {
		const sorted = lanesPropertyIdsByDisplayName(
			[
				notePropertyIdFromName('status'),
				notePropertyIdFromName('date'),
				notePropertyIdFromName('Worktree'),
			],
			(propertyId) => propertyId.replace('note.', ''),
		)

		assert.deepStrictEqual(sorted, [
			notePropertyIdFromName('date'),
			notePropertyIdFromName('status'),
			notePropertyIdFromName('Worktree'),
		])
	})
})
