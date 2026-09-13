import { assert, describe, it } from '@effect/vitest'

import {
	lanesLaneWidthFromStored,
	lanesPropertyIdsByDisplayName,
	nextLanesLaneWidth,
	notePropertyIdFromName,
} from '#/src/lanes-view-options'

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

describe('nextLanesLaneWidth', () => {
	it('cycles sm md lg xl fill', () => {
		assert.strictEqual(nextLanesLaneWidth('sm'), 'md')
		assert.strictEqual(nextLanesLaneWidth('md'), 'lg')
		assert.strictEqual(nextLanesLaneWidth('lg'), 'xl')
		assert.strictEqual(nextLanesLaneWidth('xl'), 'fill')
		assert.strictEqual(nextLanesLaneWidth('fill'), 'sm')
	})
})

describe('lanesLaneWidthFromStored', () => {
	it('prefers laneWidth', () => {
		assert.strictEqual(lanesLaneWidthFromStored('lg', true), 'lg')
	})

	it('treats fillWidth true as fill', () => {
		assert.strictEqual(lanesLaneWidthFromStored(undefined, true), 'fill')
	})

	it('defaults to md', () => {
		assert.strictEqual(lanesLaneWidthFromStored(undefined, false), 'md')
	})
})
