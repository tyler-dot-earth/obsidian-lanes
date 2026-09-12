import { Array, Effect, Result, Schema } from 'effect'
import { loadPluginSettings, type PluginDataStore } from 'effect-obsidian'

/** Global plugin settings. View options override these defaults. */
export const LanesPluginSettings = Schema.Struct({
	schemaVersion: Schema.optionalKey(Schema.Literal(1)),
	defaultLanesProperty: Schema.optionalKey(Schema.String),
	defaultCardTitleProperty: Schema.optionalKey(Schema.String),
})

export interface LanesPluginSettings extends Schema.Schema.Type<typeof LanesPluginSettings> {}

export const defaultLanesPluginSettings: LanesPluginSettings = LanesPluginSettings.make({})

/** Plugin surface the settings tab uses to persist defaults. */
export interface LanesPluginSettingsHost {
	settings: LanesPluginSettings
	saveLanesPluginSettings: () => Promise<void>
}

/** Rebuilds settings after a default field changes. Empty strings omit the key. */
export const lanesPluginSettingsFromDefaults = (input: {
	readonly current: LanesPluginSettings
	readonly defaultLanesProperty: string
	readonly defaultCardTitleProperty: string
}): LanesPluginSettings => {
	const entries = Array.filterMap(
		[
			['schemaVersion', input.current.schemaVersion] as const,
			['defaultLanesProperty', input.defaultLanesProperty] as const,
			['defaultCardTitleProperty', input.defaultCardTitleProperty] as const,
		],
		([key, value]) =>
			value === undefined || value === '' ? Result.failVoid : Result.succeed([key, value] as const),
	)

	return Schema.decodeUnknownSync(LanesPluginSettings)(Object.fromEntries(entries))
}

/** Loads Lanes plugin settings, falling back to defaults when data.json is missing or invalid. */
export const loadLanesPluginSettings: Effect.Effect<LanesPluginSettings, never, PluginDataStore> =
	loadPluginSettings({
		schema: LanesPluginSettings,
		fallback: defaultLanesPluginSettings,
	}).pipe(
		Effect.tapError((error) => Effect.logWarning(`Lanes: using default settings (${error._tag})`)),
		Effect.catchTags({
			PluginDataLoadError: () => Effect.succeed(defaultLanesPluginSettings),
			PluginSettingsDecodeError: () => Effect.succeed(defaultLanesPluginSettings),
		}),
	)
