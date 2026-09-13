import { type App, type BasesPropertyId, Modal, Setting } from 'obsidian'

import { lanesPropertyIdsByDisplayName } from '#/src/lanes-view-options'

/** Checklist of card properties for a board-bar option such as Link fields. */
export class LanesPropertyChecklistModal extends Modal {
	private readonly title: string
	private readonly description: string
	private readonly propertyIds: readonly BasesPropertyId[]
	private readonly displayName: (propertyId: BasesPropertyId) => string
	private readonly checked: Set<BasesPropertyId>
	private readonly onSave: (ids: readonly BasesPropertyId[]) => void

	constructor(input: {
		readonly app: App
		readonly title: string
		readonly description: string
		readonly propertyIds: readonly BasesPropertyId[]
		readonly displayName: (propertyId: BasesPropertyId) => string
		readonly selectedIds: readonly BasesPropertyId[]
		readonly onSave: (ids: readonly BasesPropertyId[]) => void
	}) {
		super(input.app)
		this.title = input.title
		this.description = input.description
		this.propertyIds = lanesPropertyChecklistChoices(
			input.propertyIds,
			input.selectedIds,
			input.displayName,
		)
		this.displayName = input.displayName
		this.onSave = input.onSave
		this.checked = new Set(input.selectedIds)
	}

	override onOpen(): void {
		this.titleEl.setText(this.title)
		this.contentEl.empty()
		this.contentEl.createEl('p', {
			text: this.description,
		})

		for (const propertyId of this.propertyIds) {
			const id = propertyId

			new Setting(this.contentEl).setName(this.displayName(id)).addToggle((toggle) => {
				toggle.setValue(this.checked.has(id))
				toggle.onChange((value) => {
					this.setChecked(id, value)
				})
			})
		}
	}

	override onClose(): void {
		const ids: BasesPropertyId[] = []

		for (const propertyId of this.propertyIds) {
			if (this.checked.has(propertyId)) {
				ids.push(propertyId)
			}
		}

		this.onSave(ids)
	}

	private setChecked(propertyId: BasesPropertyId, value: boolean): void {
		if (value) {
			this.checked.add(propertyId)

			return
		}

		this.checked.delete(propertyId)
	}
}

const lanesPropertyChecklistChoices = (
	propertyIds: readonly BasesPropertyId[],
	selectedIds: readonly BasesPropertyId[],
	displayName: (propertyId: BasesPropertyId) => string,
): readonly BasesPropertyId[] => {
	const ids = [...propertyIds]

	for (const selectedId of selectedIds) {
		if (!ids.includes(selectedId)) {
			ids.push(selectedId)
		}
	}

	return lanesPropertyIdsByDisplayName(ids, displayName)
}
