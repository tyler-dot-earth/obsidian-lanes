import { Effect } from 'effect'
import type { BasesView } from 'obsidian'

import { LanesCreateColumnNoteError, lanesErrorMessage } from '#/src/lanes-errors'

type LanesYamlScalar = string | number | boolean | null | undefined

/** Frontmatter to stamp on a note created from a lane plus button. */
export interface LanesNewColumnNoteFrontMatter {
	readonly groupKey: string | null
	readonly groupValue: string | number | boolean | null
}

const patchLanesNewNoteFrontMatter = (
	frontmatter: Record<string, LanesYamlScalar>,
	input: LanesNewColumnNoteFrontMatter,
): void => {
	if (input.groupKey === null) {
		return
	}

	if (input.groupValue === null) {
		delete frontmatter[input.groupKey]

		return
	}

	frontmatter[input.groupKey] = input.groupValue
}

/** Opens the Bases new-note UI with the lane's group-by value already set. */
export const createLanesColumnNote: (
	view: BasesView,
	input: LanesNewColumnNoteFrontMatter,
) => Effect.Effect<void, LanesCreateColumnNoteError> = Effect.fn('Lanes.createColumnNote')(
	function* (view, input) {
		yield* Effect.tryPromise({
			try: () =>
				view.createFileForView(undefined, (frontmatter) => {
					// SAFETY: Obsidian types createFileForView as (frontmatter: any) => void.
					patchLanesNewNoteFrontMatter(frontmatter as Record<string, LanesYamlScalar>, input)
				}),
			catch: (cause) =>
				new LanesCreateColumnNoteError({
					message: `Lanes.createColumnNote failed: ${lanesErrorMessage(cause)}`,
				}),
		})
	},
)
