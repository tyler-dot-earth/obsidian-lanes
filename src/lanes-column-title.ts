import { Schema } from 'effect'

/** Column title used when groupBy has no value for a card. */
export const LANES_NO_VALUE_COLUMN = 'No value'

/** Input for turning a Bases groupBy key into a lane title. */
export const LanesColumnTitleInput = Schema.Struct({
	hasKey: Schema.Boolean,
	keyText: Schema.NullOr(Schema.String),
})

export interface LanesColumnTitleInput extends Schema.Schema.Type<typeof LanesColumnTitleInput> {}

/** Column title for a Bases groupBy key. Empty or missing keys become "No value". */
export const lanesColumnTitle = (group: LanesColumnTitleInput): string => {
	if (!group.hasKey || group.keyText === null || group.keyText === '') {
		return LANES_NO_VALUE_COLUMN
	}

	return group.keyText
}
