import { assert, describe, it } from '@effect/vitest'

import { compareLanesCardSort, type LanesCardSortKey } from '#src/lanes-card-sort'

const key = (
	input: Partial<LanesCardSortKey> & Pick<LanesCardSortKey, 'basename'>,
): LanesCardSortKey => ({
	orderValue: null,
	mtime: 0,
	ctime: 0,
	...input,
})

describe('compareLanesCardSort', () => {
	it('sorts modified time newest first', () => {
		const newer = key({
			basename: 'new',
			mtime: 20,
		})

		const older = key({
			basename: 'old',
			mtime: 10,
		})

		assert.ok(compareLanesCardSort('mtime-desc', newer, older) < 0)
		assert.ok(compareLanesCardSort('mtime-asc', newer, older) > 0)
	})

	it('sorts file names A to Z', () => {
		const a = key({ basename: 'alpha' })
		const b = key({ basename: 'beta' })

		assert.ok(compareLanesCardSort('name-asc', a, b) < 0)
		assert.ok(compareLanesCardSort('name-desc', a, b) > 0)
	})
})
