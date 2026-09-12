import { assert, describe, it } from '@effect/vitest'

import { LANES_NO_VALUE_COLUMN, lanesColumnTitle } from '#src/lanes-column-title'

describe('lanesColumnTitle', () => {
	it('uses the groupBy key text', () => {
		assert.strictEqual(
			lanesColumnTitle({
				hasKey: true,
				keyText: 'running',
			}),
			'running',
		)
	})

	it('uses No value when the group has no key', () => {
		assert.strictEqual(
			lanesColumnTitle({
				hasKey: false,
				keyText: null,
			}),
			LANES_NO_VALUE_COLUMN,
		)
	})

	it('uses No value when the key text is empty', () => {
		assert.strictEqual(
			lanesColumnTitle({
				hasKey: true,
				keyText: '',
			}),
			LANES_NO_VALUE_COLUMN,
		)
	})
})
