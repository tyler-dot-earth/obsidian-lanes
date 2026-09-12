import { assert, describe, it } from '@effect/vitest'
import { Effect } from 'effect'
import { memoryPluginDataStoreLayer } from 'effect-obsidian'

import { defaultLanesPluginSettings, loadLanesPluginSettings } from '#src/lanes-plugin-settings'

describe('Lanes plugin settings', () => {
	it.effect('uses defaults when plugin data is missing', () =>
		Effect.gen(function* () {
			const settings = yield* loadLanesPluginSettings
			assert.deepStrictEqual(settings, defaultLanesPluginSettings)
		}).pipe(Effect.provide(memoryPluginDataStoreLayer())),
	)

	it.effect('accepts an empty stored object', () =>
		Effect.gen(function* () {
			const settings = yield* loadLanesPluginSettings
			assert.deepStrictEqual(settings, {})
		}).pipe(Effect.provide(memoryPluginDataStoreLayer({}))),
	)

	it.effect('falls back when stored data is not an object', () =>
		Effect.gen(function* () {
			const settings = yield* loadLanesPluginSettings
			assert.deepStrictEqual(settings, defaultLanesPluginSettings)
		}).pipe(Effect.provide(memoryPluginDataStoreLayer('nope'))),
	)
})
