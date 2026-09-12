import { assert, describe, it } from '@effect/vitest'
import { Option, Schema } from 'effect'

import { LanesCardOpenBehavior } from '#src/lanes-card-open'

describe('LanesCardOpenBehavior', () => {
	it('accepts split', () => {
		assert.strictEqual(Schema.decodeUnknownSync(LanesCardOpenBehavior)('split'), 'split')
	})

	it('rejects garbage', () => {
		assert.ok(Option.isNone(Schema.decodeUnknownOption(LanesCardOpenBehavior)('nope')))
	})
})
