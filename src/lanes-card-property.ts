import { Array, Schema } from 'effect'

/** File extensions treated as image thumbnails on cards. */
export const LANES_IMAGE_PROPERTY_EXTENSIONS = [
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.webp',
	'.svg',
	'.avif',
] as const

/** Last path segment of a worktree directory, for card buttons. */
export const lanesWorktreeButtonLabel = (path: string): string => {
	const parts = path.split('/').filter((part) => part !== '')
	const last = parts[parts.length - 1]

	return last === undefined || last === '' ? path : last
}

/** True when a vault path should render as a thumbnail, not a text link. */
export const isLanesImagePropertyPath = (path: string): boolean => {
	const bare = path.trim().toLowerCase()

	return Array.some(LANES_IMAGE_PROPERTY_EXTENSIONS, (extension) => bare.endsWith(extension))
}

/** A clickable URL, vault link, or image shown on a card. */
export const LanesCardPropertyLink = Schema.Struct({
	label: Schema.String,
	href: Schema.String,
	kind: Schema.Literals(['url', 'wiki', 'image']),
})

export interface LanesCardPropertyLink extends Schema.Schema.Type<typeof LanesCardPropertyLink> {}

/** One configured property row on a card. */
export const LanesCardPropertyField = Schema.Struct({
	name: Schema.String,
	texts: Schema.Array(Schema.String),
	monospace: Schema.Boolean,
	badge: Schema.Boolean,
	worktree: Schema.Boolean,
	propertyId: Schema.String,
})

export interface LanesCardPropertyField extends Schema.Schema.Type<typeof LanesCardPropertyField> {
	readonly links: readonly LanesCardPropertyLink[]
}

const decodeUriLabel = (value: string): string => {
	try {
		return decodeURIComponent(value)
	} catch {
		return value
	}
}

const snapPrefixToSeparator = (prefix: string): string => {
	const separators = ['/', '?', '#', '&', '=']
	let last = -1

	for (const separator of separators) {
		const at = prefix.lastIndexOf(separator)

		if (at > last) {
			last = at
		}
	}

	if (last === -1) {
		return prefix
	}

	return prefix.slice(0, last + 1)
}

const longestCommonPrefix = (values: readonly string[]): string => {
	const first = values[0]

	if (first === undefined) {
		return ''
	}

	let end = first.length

	for (const value of values) {
		let index = 0

		while (index < end && index < value.length && value[index] === first[index]) {
			index += 1
		}

		end = index

		if (end === 0) {
			return ''
		}
	}

	return first.slice(0, end)
}

const lastSlashSegment = (value: string): string | null => {
	const parts = value.split('/').filter((part) => part !== '')
	const last = parts[parts.length - 1]

	if (last === undefined || last.length === 0 || last.length >= 48) {
		return null
	}

	return decodeUriLabel(last)
}

const urlOriginOrEmpty = (href: string): string => {
	try {
		return new URL(href).origin
	} catch {
		return ''
	}
}

/** Short label for one URL. Last path segment, else last query segment, else hostname. */
export const lanesUrlButtonLabel = (href: string): string => {
	let url: URL

	try {
		url = new URL(href)
	} catch {
		return href
	}

	const fromPath = lastSlashSegment(url.pathname)

	if (fromPath !== null) {
		return fromPath
	}

	const query = url.search.startsWith('?') ? url.search.slice(1) : url.search
	const fromQuery = lastSlashSegment(query)

	if (fromQuery !== null) {
		return fromQuery
	}

	return url.hostname
}

/** Labels for a row of URLs. Same-origin groups drop the shared prefix so buttons stay distinct. */
export const lanesUrlButtonLabels = (hrefs: readonly string[]): readonly string[] => {
	const labels: string[] = []
	const indexesByOrigin = new Map<string, number[]>()

	for (const [index, href] of hrefs.entries()) {
		labels.push(lanesUrlButtonLabel(href))

		const origin = urlOriginOrEmpty(href)
		const bucket = indexesByOrigin.get(origin)

		if (bucket === undefined) {
			indexesByOrigin.set(origin, [index])
		} else {
			bucket.push(index)
		}
	}

	for (const indexes of indexesByOrigin.values()) {
		applySharedOriginLabels(hrefs, labels, indexes)
	}

	return labels
}

const applySharedOriginLabels = (
	hrefs: readonly string[],
	labels: string[],
	indexes: readonly number[],
): void => {
	if (indexes.length < 2) {
		return
	}

	const groupHrefs: string[] = []

	for (const index of indexes) {
		const href = hrefs[index]

		if (href !== undefined) {
			groupHrefs.push(href)
		}
	}

	const prefix = snapPrefixToSeparator(longestCommonPrefix(groupHrefs))

	if (prefix.length < 8) {
		return
	}

	for (const index of indexes) {
		const href = hrefs[index]

		if (href === undefined) {
			continue
		}

		const rest = decodeUriLabel(href.slice(prefix.length).replace(/^[/?#&=._-]+/, ''))

		if (rest !== '') {
			labels[index] = rest
		}
	}
}

const relabelUrlPropertyLinks = (
	links: readonly LanesCardPropertyLink[],
): readonly LanesCardPropertyLink[] => {
	const urlHrefs: string[] = []

	for (const link of links) {
		if (link.kind === 'url') {
			urlHrefs.push(link.href)
		}
	}

	const urlLabels = lanesUrlButtonLabels(urlHrefs)
	let urlIndex = 0
	const relabeled: LanesCardPropertyLink[] = []

	for (const link of links) {
		if (link.kind !== 'url') {
			relabeled.push(link)
			continue
		}

		const label = urlLabels[urlIndex] ?? link.label
		urlIndex += 1
		relabeled.push(
			LanesCardPropertyLink.make({
				label,
				href: link.href,
				kind: 'url',
			}),
		)
	}

	return relabeled
}

/** Parses a single property string into a URL or wikilink, if it is one. */
export const parseLanesPropertyLink = (text: string): LanesCardPropertyLink | null => {
	const trimmed = text.trim()

	if (trimmed === '') {
		return null
	}

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return LanesCardPropertyLink.make({
			label: lanesUrlButtonLabel(trimmed),
			href: trimmed,
			kind: 'url',
		})
	}

	return parseLanesWikiPropertyLink(trimmed)
}

const lanesWikiPropertyLinkFromParts = (
	pathRaw: string,
	aliasRaw: string | undefined,
): LanesCardPropertyLink | null => {
	const path = pathRaw.trim()

	if (path === '') {
		return null
	}

	const alias = aliasRaw?.trim()
	const fromPath = lastSlashSegment(path)
	const label = alias === undefined || alias === '' ? (fromPath ?? path) : alias

	return LanesCardPropertyLink.make({
		label,
		href: path,
		kind: isLanesImagePropertyPath(path) ? 'image' : 'wiki',
	})
}

const parseLanesWikiPropertyLink = (trimmed: string): LanesCardPropertyLink | null => {
	const wiki = /^\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]$/.exec(trimmed)

	if (wiki?.[1] === undefined) {
		return null
	}

	return lanesWikiPropertyLinkFromParts(wiki[1], wiki[2])
}

/** Wikilinks pulled from a property string, plus any leftover plain text. */
export interface LanesWikiLinksInText {
	readonly links: readonly LanesCardPropertyLink[]
	readonly leftover: string
}

/** Pulls wikilinks out of a property string, including comma-separated lists. */
export const lanesWikiLinksInText = (text: string): LanesWikiLinksInText => {
	const links: LanesCardPropertyLink[] = []
	const pattern = /\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/g
	let match = pattern.exec(text)

	while (match !== null) {
		const pathRaw = match[1]

		if (pathRaw !== undefined) {
			const link = lanesWikiPropertyLinkFromParts(pathRaw, match[2])

			if (link !== null) {
				links.push(link)
			}
		}

		match = pattern.exec(text)
	}

	const leftover = text
		.replace(/\[\[[^\]]*\]\]/g, ' ')
		.replace(/[\s,]+/g, ' ')
		.trim()

	return {
		links,
		leftover,
	}
}

const lanesPropertyPiecesFromText = (text: string, asLinks: boolean): LanesWikiLinksInText => {
	const extracted = lanesWikiLinksInText(text)

	if (extracted.links.length > 0) {
		return extracted
	}

	if (asLinks) {
		const link = parseLanesPropertyLink(text)

		if (link !== null) {
			return {
				links: [link],
				leftover: '',
			}
		}
	}

	return {
		links: [],
		leftover: text.trim(),
	}
}

/** Builds a card property row from raw property strings. */
export const lanesPropertyFieldFromTexts = (input: {
	readonly name: string
	readonly texts: readonly string[]
	readonly asLinks: boolean
	readonly monospace?: boolean
	readonly badge?: boolean
	readonly worktree?: boolean
	readonly propertyId?: string
}): LanesCardPropertyField | null => {
	const links: LanesCardPropertyLink[] = []
	const leftovers: string[] = []

	for (const text of input.texts) {
		const pieces = lanesPropertyPiecesFromText(text, input.asLinks)

		for (const link of pieces.links) {
			links.push(link)
		}

		if (pieces.leftover !== '') {
			leftovers.push(pieces.leftover)
		}
	}

	if (links.length === 0 && leftovers.length === 0) {
		return null
	}

	return {
		name: input.name,
		texts: leftovers,
		monospace: input.monospace === true,
		badge: input.badge === true,
		worktree: input.worktree === true,
		propertyId: input.propertyId ?? '',
		links: relabelUrlPropertyLinks(links),
	}
}
