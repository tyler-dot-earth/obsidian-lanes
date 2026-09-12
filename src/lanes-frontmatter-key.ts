import type { BasesPropertyId } from 'obsidian'

/** Frontmatter key for a Bases note property id. File and formula properties cannot be written. */
export const lanesFrontmatterKey = (propertyId: BasesPropertyId): string | null => {
	if (propertyId.startsWith('note.')) {
		const key = propertyId.slice('note.'.length)

		return key === '' ? null : key
	}

	return null
}
