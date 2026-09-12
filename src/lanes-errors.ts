import { Schema } from 'effect'

/** Frontmatter write failed after a card drop. */
export class LanesApplyCardDropError extends Schema.TaggedError<LanesApplyCardDropError>()(
	'LanesApplyCardDropError',
	{
		message: Schema.String,
	},
) {}

/** Bases new-note UI failed when creating a card in a lane. */
export class LanesCreateColumnNoteError extends Schema.TaggedError<LanesCreateColumnNoteError>()(
	'LanesCreateColumnNoteError',
	{
		message: Schema.String,
	},
) {}

/** Board DOM render failed. */
export class LanesRenderBoardError extends Schema.TaggedError<LanesRenderBoardError>()(
	'LanesRenderBoardError',
	{
		message: Schema.String,
	},
) {}

/** Turns an unknown throw into a message for a tagged Lanes error. */
export const lanesErrorMessage = (cause: unknown): string =>
	cause instanceof Error ? cause.message : String(cause)
