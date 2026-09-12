import { Option, Schema } from 'effect'
import type { BasesViewConfig } from 'obsidian'

/** View config key for how a card click opens the note. */
export const LANES_CARD_OPEN_BEHAVIOR_CONFIG_KEY = 'cardOpenBehavior'

/** Where a card click opens the note. */
export const LanesCardOpenBehavior = Schema.Literals(['current', 'tab', 'split', 'window'])

export type LanesCardOpenBehavior = typeof LanesCardOpenBehavior.Type

/** Reads card open behavior from view config. Missing or invalid values are current. */
export const readLanesCardOpenBehavior = (config: BasesViewConfig): LanesCardOpenBehavior =>
	Schema.decodeUnknownOption(LanesCardOpenBehavior)(
		config.get(LANES_CARD_OPEN_BEHAVIOR_CONFIG_KEY),
	).pipe(Option.getOrElse(() => 'current' as const))
