import { Effect } from 'effect'
import type { App, TFile } from 'obsidian'

import { LanesApplyCardDropError, lanesErrorMessage } from '#src/lanes-errors'

/** Frontmatter updates to apply after a card drop. */
export interface LanesCardDropWrite {
	readonly app: App
	readonly file: TFile
	readonly orderProperty: string
	readonly orderKey: string
	readonly groupKey: string | null
	readonly groupValue: string | number | boolean | null
}

type LanesYamlScalar = string | number | boolean | null | undefined

const patchLanesFrontMatter = (
	frontmatter: Record<string, LanesYamlScalar>,
	input: LanesCardDropWrite,
): void => {
	frontmatter[input.orderProperty] = input.orderKey

	if (input.groupKey === null) {
		return
	}

	if (input.groupValue === null) {
		delete frontmatter[input.groupKey]

		return
	}

	frontmatter[input.groupKey] = input.groupValue
}

/** Writes fractional order and optional group-by frontmatter after a card drop. */
export const applyLanesCardDrop: (
	input: LanesCardDropWrite,
) => Effect.Effect<void, LanesApplyCardDropError> = Effect.fn('Lanes.applyCardDrop')(
	function* (input) {
		yield* Effect.tryPromise({
			try: () =>
				input.app.fileManager.processFrontMatter(input.file, (frontmatter) => {
					// SAFETY: Obsidian types processFrontMatter as (frontmatter: any) => void.
					patchLanesFrontMatter(frontmatter as Record<string, LanesYamlScalar>, input)
				}),
			catch: (cause) =>
				new LanesApplyCardDropError({
					message: `Lanes.applyCardDrop failed: ${lanesErrorMessage(cause)}`,
				}),
		})
	},
)
