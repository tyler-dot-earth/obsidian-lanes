import { assert, describe, it } from '@effect/vitest'

import { lanesGalleryIndexAfterStep } from '#/src/lanes-image-gallery'

describe('lanesGalleryIndexAfterStep', () => {
	it('wraps forward and backward', () => {
		assert.strictEqual(lanesGalleryIndexAfterStep(0, 3, 1), 1)
		assert.strictEqual(lanesGalleryIndexAfterStep(2, 3, 1), 0)
		assert.strictEqual(lanesGalleryIndexAfterStep(0, 3, -1), 2)
	})

	it('returns 0 when empty', () => {
		assert.strictEqual(lanesGalleryIndexAfterStep(0, 0, 1), 0)
	})
})
