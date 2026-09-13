import { Schema } from 'effect'

import { LanesCardPropertyField } from '#/src/lanes-card-property'

/** Inputs for choosing a card title from a property or the file name. */
export const LanesCardTitleInput = Schema.Struct({
	propertyText: Schema.NullOr(Schema.String),
	fileBasename: Schema.String,
})

export interface LanesCardTitleInput extends Schema.Schema.Type<typeof LanesCardTitleInput> {}

/** Card title: property text when present, otherwise the file basename. */
export const lanesCardTitleText = (input: LanesCardTitleInput): string => {
	if (input.propertyText === null || input.propertyText === '') {
		return input.fileBasename
	}

	return input.propertyText
}

/**
 * Turns a cover property string into a path or URL. Accepts http(s) URLs, wikilinks, and bare
 * paths.
 */
export const parseLanesCoverHref = (text: string): string | null => {
	const trimmed = text.trim()

	if (trimmed === '') {
		return null
	}

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed
	}

	const wiki = /^\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]$/.exec(trimmed)

	if (wiki?.[1] !== undefined) {
		const path = wiki[1].trim()

		return path === '' ? null : path
	}

	return trimmed
}

/** What to render on a Lanes card. */
export const LanesCardDisplay = Schema.Struct({
	title: Schema.String,
	coverSrc: Schema.NullOr(Schema.String),
})

export interface LanesCardDisplay extends Schema.Schema.Type<typeof LanesCardDisplay> {
	readonly properties: readonly LanesCardPropertyField[]
}
