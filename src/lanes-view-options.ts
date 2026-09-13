import { Array, Match, Option, Order, Result, Schema } from 'effect'
import type { BasesAllOptions, BasesPropertyId, BasesViewConfig } from 'obsidian'

/** View config key for the property that groups cards into lanes. */
export const LANES_PROPERTY_CONFIG_KEY = 'lanesProperty'

/** View config key for the property used as the card title. */
export const LANES_TITLE_PROPERTY_CONFIG_KEY = 'cardTitleProperty'

/** View config key for the property used as the card cover image. */
export const LANES_COVER_PROPERTY_CONFIG_KEY = 'coverProperty'

/** View config key for properties rendered as URL buttons or vault links. */
export const LANES_CARD_LINK_PROPERTIES_CONFIG_KEY = 'cardLinkProperties'

/** View config key for properties rendered in a monospace font. */
export const LANES_CARD_MONOSPACE_PROPERTIES_CONFIG_KEY = 'cardMonospaceProperties'

/** View config key for properties rendered as colored value chips. */
export const LANES_CARD_BADGE_PROPERTIES_CONFIG_KEY = 'cardBadgeProperties'

/** View config key for properties treated as worktree directories. */
export const LANES_CARD_WORKTREE_PROPERTIES_CONFIG_KEY = 'cardWorktreeProperties'

/** View config key for the frontmatter property that stores manual card order. */
export const LANES_ORDER_PROPERTY_CONFIG_KEY = 'orderProperty'

/** View config key for stretching lanes across the pane instead of a fixed width. */
export const LANES_FILL_WIDTH_CONFIG_KEY = 'fillWidth'

/** View config key for lane column width: sm, md, lg, or fill. */
export const LANES_LANE_WIDTH_CONFIG_KEY = 'laneWidth'

/** Lane column widths. */
export const LanesLaneWidth = Schema.Literals(['sm', 'md', 'lg', 'xl', 'fill'])

export type LanesLaneWidth = typeof LanesLaneWidth.Type

/** View config key for whether columns sit left or center. */
export const LANES_LANE_POSITION_CONFIG_KEY = 'lanePosition'

/** Column alignment on the board. */
export const LanesLanePosition = Schema.Literals(['left', 'center'])

export type LanesLanePosition = typeof LanesLanePosition.Type

/** Default frontmatter key for fractional card order. */
export const LANES_ORDER_PROPERTY_DEFAULT = 'lanes_order'

/** Property ids sorted by their display names, case-insensitive. */
export const lanesPropertyIdsByDisplayName = (
	propertyIds: readonly BasesPropertyId[],
	displayName: (propertyId: BasesPropertyId) => string,
): readonly BasesPropertyId[] =>
	Array.sortWith(
		propertyIds,
		(propertyId) => displayName(propertyId).toLocaleLowerCase(),
		Order.String,
	)

/** Builds a BasesPropertyId from a bare or prefixed property name. */
export const notePropertyIdFromName = (name: string): BasesPropertyId => {
	if (name.startsWith('note.')) {
		return `note.${name.slice('note.'.length)}`
	}

	if (name.startsWith('file.')) {
		return `file.${name.slice('file.'.length)}`
	}

	if (name.startsWith('formula.')) {
		return `formula.${name.slice('formula.'.length)}`
	}

	return `note.${name}`
}

const readLanesPropertyIdOrDefault = (
	config: BasesViewConfig,
	key: string,
	defaultName: string,
): BasesPropertyId | null => {
	if (config.get(key) === '') {
		return null
	}

	const fromView = config.getAsPropertyId(key)

	if (fromView !== null) {
		return fromView
	}

	if (defaultName.trim() === '') {
		return null
	}

	return notePropertyIdFromName(defaultName.trim())
}

/** Group-by property from the view, or a plugin default name such as status. */
export const readLanesGroupPropertyId = (
	config: BasesViewConfig,
	defaultName: string,
): BasesPropertyId | null =>
	readLanesPropertyIdOrDefault(config, LANES_PROPERTY_CONFIG_KEY, defaultName)

/** Card title property from the view, or a plugin default name such as codename. */
export const readLanesTitlePropertyId = (
	config: BasesViewConfig,
	defaultName: string,
): BasesPropertyId | null =>
	readLanesPropertyIdOrDefault(config, LANES_TITLE_PROPERTY_CONFIG_KEY, defaultName)

/**
 * Property used for card cover images. Prefers coverProperty, then the native Bases `image` view
 * field (as on the cards layout).
 */
export const readLanesCoverPropertyId = (config: BasesViewConfig): BasesPropertyId | null => {
	const fromCover = config.getAsPropertyId(LANES_COVER_PROPERTY_CONFIG_KEY)

	if (fromCover !== null) {
		return fromCover
	}

	const fromImage = config.getAsPropertyId('image')

	if (fromImage !== null) {
		return fromImage
	}

	const imageName = Schema.decodeUnknownOption(Schema.String)(config.get('image')).pipe(
		Option.getOrElse(() => ''),
	)

	if (imageName === '') {
		return null
	}

	return notePropertyIdFromName(imageName)
}

const readLanesPropertyIdList = (
	config: BasesViewConfig,
	key: string,
): readonly BasesPropertyId[] => {
	const decoded = Schema.decodeUnknownOption(Schema.Array(Schema.String))(config.get(key))

	if (Option.isNone(decoded)) {
		return []
	}

	return Array.filterMap(decoded.value, (name) => {
		const trimmed = name.trim()

		return trimmed === '' ? Result.failVoid : Result.succeed(notePropertyIdFromName(trimmed))
	})
}

/** Property ids listed under Link properties (URL buttons and vault links). */
export const readLanesCardLinkPropertyIds = (config: BasesViewConfig): readonly BasesPropertyId[] =>
	readLanesPropertyIdList(config, LANES_CARD_LINK_PROPERTIES_CONFIG_KEY)

/** Property ids listed under Monospace fields. */
export const readLanesCardMonospacePropertyIds = (
	config: BasesViewConfig,
): readonly BasesPropertyId[] =>
	readLanesPropertyIdList(config, LANES_CARD_MONOSPACE_PROPERTIES_CONFIG_KEY)

/** Property ids listed under Badges. */
export const readLanesCardBadgePropertyIds = (
	config: BasesViewConfig,
): readonly BasesPropertyId[] =>
	readLanesPropertyIdList(config, LANES_CARD_BADGE_PROPERTIES_CONFIG_KEY)

/** Property ids listed under Worktree fields. */
export const readLanesCardWorktreePropertyIds = (
	config: BasesViewConfig,
): readonly BasesPropertyId[] =>
	readLanesPropertyIdList(config, LANES_CARD_WORKTREE_PROPERTIES_CONFIG_KEY)

/** Frontmatter property that stores fractional indexes when sort is manual. */
export const readLanesOrderProperty = (config: BasesViewConfig): string => {
	const raw = Schema.decodeUnknownOption(Schema.String)(
		config.get(LANES_ORDER_PROPERTY_CONFIG_KEY),
	).pipe(Option.getOrElse(() => ''))

	if (raw.trim() === '') {
		return LANES_ORDER_PROPERTY_DEFAULT
	}

	return raw.trim()
}

/** Next lane width in the board-bar cycle. */
export const nextLanesLaneWidth = (current: LanesLaneWidth): LanesLaneWidth =>
	Match.value(current).pipe(
		Match.when('sm', () => 'md' as const),
		Match.when('md', () => 'lg' as const),
		Match.when('lg', () => 'xl' as const),
		Match.when('xl', () => 'fill' as const),
		Match.when('fill', () => 'sm' as const),
		Match.exhaustive,
	)

/** Lane width from laneWidth, with fillWidth: true as fill. Default md. */
export const lanesLaneWidthFromStored = (
	laneWidth: string | boolean | null | undefined,
	fillWidth: boolean | null | undefined,
): LanesLaneWidth => {
	const named = Schema.decodeUnknownOption(LanesLaneWidth)(laneWidth)

	if (Option.isSome(named)) {
		return named.value
	}

	const fill = Schema.decodeUnknownOption(Schema.Boolean)(fillWidth)

	if (Option.isSome(fill) && fill.value) {
		return 'fill'
	}

	return 'md'
}

/** Lane column width for this view. */
export const readLanesLaneWidth = (config: BasesViewConfig): LanesLaneWidth => {
	const named = Schema.decodeUnknownOption(LanesLaneWidth)(config.get(LANES_LANE_WIDTH_CONFIG_KEY))

	if (Option.isSome(named)) {
		return named.value
	}

	const fill = Schema.decodeUnknownOption(Schema.Boolean)(config.get(LANES_FILL_WIDTH_CONFIG_KEY))

	if (Option.isSome(fill) && fill.value) {
		return 'fill'
	}

	return 'md'
}

/** Next column position in the board-bar cycle. */
export const nextLanesLanePosition = (current: LanesLanePosition): LanesLanePosition =>
	Match.value(current).pipe(
		Match.when('left', () => 'center' as const),
		Match.when('center', () => 'left' as const),
		Match.exhaustive,
	)

/** Column alignment for this view. Default left. */
export const readLanesLanePosition = (config: BasesViewConfig): LanesLanePosition =>
	Option.getOrElse(
		Schema.decodeUnknownOption(LanesLanePosition)(config.get(LANES_LANE_POSITION_CONFIG_KEY)),
		() => 'left',
	)

/** Lanes board settings live on the board bar, not in Configure. */
export const getLanesViewOptions = (_config: BasesViewConfig): BasesAllOptions[] => []
