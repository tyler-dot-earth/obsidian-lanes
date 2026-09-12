import { Effect, Match, type ManagedRuntime, Option, Predicate, Schema } from 'effect'
import type { PluginDataStore } from 'effect-obsidian'
import {
	type App,
	type BasesEntry,
	type BasesEntryGroup,
	type BasesPropertyId,
	BasesView,
	BooleanValue,
	ListValue,
	Menu,
	Modal,
	Notice,
	NullValue,
	NumberValue,
	type QueryController,
	Setting,
	setIcon,
	TFile,
} from 'obsidian'

import { applyLanesCardDrop, type LanesCardDropWrite } from '#src/lanes-apply-card-drop'
import {
	LANES_BADGE_COLORS_CONFIG_KEY,
	lanesBadgeColorsWithValue,
	readLanesBadgeColor,
} from '#src/lanes-badge-colors'
import { LanesCardDisplay, lanesCardTitleText, parseLanesCoverHref } from '#src/lanes-card-display'
import {
	insertDraggedPathAt,
	lanesGroupWriteValue,
	lanesOrderKeyAfterDrop,
	neighborOrderKeys,
} from '#src/lanes-card-drop'
import { readLanesCardOpenBehavior } from '#src/lanes-card-open'
import {
	type LanesCardPropertyField,
	type LanesCardPropertyLink,
	lanesPropertyFieldFromTexts,
} from '#src/lanes-card-property'
import {
	compareLanesCardSort,
	LANES_CARD_SORT_CONFIG_KEY,
	LANES_CARD_SORT_OPTIONS,
	type LanesCardSortKey,
	readLanesCardSort,
} from '#src/lanes-card-sort'
import {
	LANES_COLLAPSED_COLUMNS_CONFIG_KEY,
	lanesCollapsedColumnsConfigValue,
	readLanesCollapsedColumns,
} from '#src/lanes-collapsed-columns'
import {
	collectLanesColumns,
	type LanesColumn,
	type LanesColumnRow,
} from '#src/lanes-collect-columns'
import { LANES_BOARD_COLUMNS_CONFIG_KEY, readLanesBoardColumns } from '#src/lanes-column-order'
import { LANES_NO_VALUE_COLUMN, lanesColumnTitle } from '#src/lanes-column-title'
import { createLanesColumnNote } from '#src/lanes-create-column-note'
import {
	LanesApplyCardDropError,
	LanesRenderBoardError,
	lanesErrorMessage,
} from '#src/lanes-errors'
import {
	decodeForestWorktreeCopies,
	forestCopyMatchingWorktreePath,
	forestWorktreeDirectoryToOpen,
	type ForestPluginApi,
	getForestPluginApi,
	lanesNoteWorktreePath,
} from '#src/lanes-forest-plugin'
import { lanesFrontmatterKey } from '#src/lanes-frontmatter-key'
import {
	LANES_LANE_COLOR_NAMES,
	LANES_LANE_COLORS_CONFIG_KEY,
	isLanesLaneColorName,
	readLanesLaneColors,
	readLanesLegacyColumnColor,
} from '#src/lanes-lane-colors'
import { LanesOrderValue } from '#src/lanes-order-key'
import type { LanesPluginSettingsHost } from '#src/lanes-plugin-settings'
import { LanesPropertyChecklistModal } from '#src/lanes-property-checklist-modal'
import {
	LANES_CARD_BADGE_PROPERTIES_CONFIG_KEY,
	LANES_CARD_LINK_PROPERTIES_CONFIG_KEY,
	LANES_CARD_MONOSPACE_PROPERTIES_CONFIG_KEY,
	LANES_COVER_PROPERTY_CONFIG_KEY,
	LANES_FILL_WIDTH_CONFIG_KEY,
	LANES_ORDER_PROPERTY_CONFIG_KEY,
	LANES_ORDER_PROPERTY_DEFAULT,
	LANES_PROPERTY_CONFIG_KEY,
	LANES_TITLE_PROPERTY_CONFIG_KEY,
	readLanesCardBadgePropertyIds,
	readLanesCardLinkPropertyIds,
	readLanesCardMonospacePropertyIds,
	readLanesCoverPropertyId,
	readLanesFillWidth,
	readLanesGroupPropertyId,
	readLanesOrderProperty,
	readLanesTitlePropertyId,
} from '#src/lanes-view-options'

/** Bases view type id. Must match registerBasesView and the `type:` field in a .base file. */
export const LANES_VIEW_TYPE = 'lanes'

const lanesQueryHasGroupBy = (groups: readonly BasesEntryGroup[]): boolean => {
	if (groups.length > 1) {
		return true
	}

	const only = groups[0]

	return only !== undefined && only.hasKey()
}

const laneTitleForEntry = (entry: BasesEntry, propertyId: BasesPropertyId): string => {
	const value = entry.getValue(propertyId)

	if (value === null || value instanceof NullValue) {
		return LANES_NO_VALUE_COLUMN
	}

	return lanesColumnTitle({
		hasKey: true,
		keyText: value.toString(),
	})
}

const propertyTextForEntry = (
	entry: BasesEntry,
	propertyId: BasesPropertyId | null,
): string | null => {
	if (propertyId === null) {
		return null
	}

	const value = entry.getValue(propertyId)

	if (value === null || value instanceof NullValue) {
		return null
	}

	return value.toString()
}

const readOrderValueForFile = (app: App, file: TFile, property: string): LanesOrderValue => {
	const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter

	if (frontmatter === undefined) {
		return null
	}

	return Schema.decodeUnknownOption(LanesOrderValue)(frontmatter[property]).pipe(
		Option.getOrElse(() => null),
	)
}

const resolveCoverSrc = (app: App, entry: BasesEntry, href: string): string | null => {
	if (href.startsWith('http://') || href.startsWith('https://')) {
		return href
	}

	const dest = app.metadataCache.getFirstLinkpathDest(href, entry.file.path)

	if (dest instanceof TFile) {
		return app.vault.getResourcePath(dest)
	}

	return null
}

type LanesCardPropertyHandlers = {
	readonly openWiki: (href: string) => void
	readonly imageSrc: (href: string) => string | null
	readonly badgeColor: (propertyId: string, value: string) => string | null
	readonly onBadgeContextMenu: (propertyId: string, value: string, event: MouseEvent) => void
}

const renderLanesCard = (
	cardsEl: HTMLElement,
	entry: BasesEntry,
	display: LanesCardDisplay,
	handlers: LanesCardPropertyHandlers,
): void => {
	const cardEl = cardsEl.createDiv({
		cls: 'lanes-card',
		attr: {
			'data-file-path': entry.file.path,
			'draggable': 'true',
		},
	})

	if (display.coverSrc !== null) {
		const imageEl = cardEl.createEl('img', {
			cls: 'lanes-card-cover',
			attr: {
				src: display.coverSrc,
				alt: display.title,
				draggable: 'false',
			},
		})

		imageEl.addEventListener('error', () => {
			imageEl.remove()
		})
	}

	cardEl.createDiv({
		cls: 'lanes-card-title',
		text: display.title,
	})

	for (const field of display.properties) {
		renderLanesCardProperty(cardEl, field, handlers)
	}
}

/** Read-only Kanban board for a Bases query, grouped into columns. */
export class LanesView extends BasesView {
	override type = LANES_VIEW_TYPE
	private readonly viewEl: HTMLElement
	private readonly runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>
	private readonly settingsHost: LanesPluginSettingsHost
	private ignoreNextCardClick = false
	private draggingFilePath: string | null = null
	private draggingLaneTitle: string | null = null

	constructor(
		controller: QueryController,
		containerEl: HTMLElement,
		runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>,
		settingsHost: LanesPluginSettingsHost,
	) {
		super(controller)
		this.runtime = runtime
		this.settingsHost = settingsHost
		containerEl.addClass('lanes-view-host')
		this.viewEl = containerEl.createDiv({ cls: 'lanes-view' })
		this.viewEl.addEventListener('click', (event: MouseEvent) => {
			this.handleLanesCardClick(event)
		})
		this.viewEl.addEventListener('contextmenu', (event: MouseEvent) => {
			this.handleLanesCardForestMenu(event)
		})
		this.viewEl.addEventListener('dragstart', (event: DragEvent) => {
			this.handleLanesCardDragStart(event)
		})
		this.viewEl.addEventListener('dragover', (event: DragEvent) => {
			this.handleLanesCardDragOver(event)
		})
		this.viewEl.addEventListener('drop', (event: DragEvent) => {
			this.handleLanesCardDrop(event)
		})
		this.viewEl.addEventListener('dragend', () => {
			this.handleLanesCardDragEnd()
		})
	}

	override onload(): void {
		// Bases delivers rows through onDataUpdated. Rendering here races an empty query.
	}

	override onDataUpdated(): void {
		this.runtime.runFork(this.renderLanesBoardEffect())
	}

	private renderLanesBoardEffect(): Effect.Effect<void, LanesRenderBoardError> {
		return Effect.try({
			try: () => ({
				laneProperty: this.config.getAsPropertyId(LANES_PROPERTY_CONFIG_KEY) ?? 'none',
				entryCount: this.data.data.length,
				groupCount: this.data.groupedData.length,
				cardSort: readLanesCardSort(this.config),
			}),
			catch: (cause) =>
				new LanesRenderBoardError({
					message: `LanesView.renderLanesBoard failed: ${lanesErrorMessage(cause)}`,
				}),
		}).pipe(
			Effect.tap((info) =>
				Effect.logInfo('LanesView.renderLanesBoard').pipe(Effect.annotateLogs(info)),
			),
			Effect.andThen(
				Effect.try({
					try: () => {
						this.renderLanesBoardDom()
					},
					catch: (cause) =>
						new LanesRenderBoardError({
							message: `LanesView.renderLanesBoard failed: ${lanesErrorMessage(cause)}`,
						}),
				}),
			),
			Effect.tapError((error) =>
				Effect.sync(() => {
					this.showLanesMessage(`Lanes failed to render. ${error.message}`)
				}).pipe(Effect.andThen(Effect.logError(error.message))),
			),
			Effect.withSpan('LanesView.renderLanesBoard'),
		)
	}

	private showLanesMessage(text: string): void {
		this.viewEl.createDiv({
			cls: 'lanes-placeholder',
			text,
		})
	}

	private renderLanesBoardDom(): void {
		this.viewEl.empty()
		this.renderLanesBoardBar()

		const lanesPropertyId = readLanesGroupPropertyId(
			this.config,
			this.settingsHost.settings.defaultLanesProperty ?? '',
		)

		if (lanesPropertyId !== null) {
			this.renderLanesFromProperty(lanesPropertyId)

			return
		}

		this.renderLanesFromGroupedData()
	}

	private renderLanesFromProperty(propertyId: BasesPropertyId): void {
		const rows: LanesColumnRow<BasesEntry>[] = []

		for (const entry of this.data.data) {
			rows.push({
				laneTitle: laneTitleForEntry(entry, propertyId),
				item: entry,
			})
		}

		this.renderLanesColumnList(collectLanesColumns(rows, readLanesBoardColumns(this.config)))
	}

	private renderLanesFromGroupedData(): void {
		const groups = this.data.groupedData

		if (!lanesQueryHasGroupBy(groups)) {
			this.showLanesMessage('Pick Group by to make lanes.')

			return
		}

		const rows: LanesColumnRow<BasesEntry>[] = []

		for (const group of groups) {
			const laneTitle = lanesColumnTitle({
				hasKey: group.hasKey(),
				keyText: group.key?.toString() ?? null,
			})

			for (const entry of group.entries) {
				rows.push({
					laneTitle,
					item: entry,
				})
			}
		}

		this.renderLanesColumnList(collectLanesColumns(rows, readLanesBoardColumns(this.config)))
	}

	private renderLanesColumnList(columns: readonly LanesColumn<BasesEntry>[]): void {
		if (columns.length === 0) {
			this.showLanesMessage('No notes match this view.')

			return
		}

		const boardEl = this.viewEl.createDiv({
			cls: readLanesFillWidth(this.config) ? 'lanes-board lanes-board-fill-width' : 'lanes-board',
		})

		for (const column of columns) {
			this.renderLanesColumn(boardEl, column.laneTitle, this.sortLaneEntries(column.items))
		}
	}

	private sortLaneEntries(entries: readonly BasesEntry[]): BasesEntry[] {
		const sort = readLanesCardSort(this.config)
		const orderProperty = readLanesOrderProperty(this.config)
		const sorted = [...entries]

		sorted.sort((left, right) =>
			compareLanesCardSort(
				sort,
				this.cardSortKey(left, orderProperty),
				this.cardSortKey(right, orderProperty),
			),
		)

		return sorted
	}

	private cardSortKey(entry: BasesEntry, orderProperty: string): LanesCardSortKey {
		const stat = entry.file.stat

		return {
			orderValue: readOrderValueForFile(this.app, entry.file, orderProperty),
			mtime: stat.mtime,
			ctime: stat.ctime,
			basename: entry.file.basename,
		}
	}

	private lanesCardDisplay(entry: BasesEntry): LanesCardDisplay {
		const title = lanesCardTitleText({
			propertyText: propertyTextForEntry(
				entry,
				readLanesTitlePropertyId(
					this.config,
					this.settingsHost.settings.defaultCardTitleProperty ?? '',
				),
			),
			fileBasename: entry.file.basename,
		})

		const coverPropertyId = readLanesCoverPropertyId(this.config)
		const coverText = propertyTextForEntry(entry, coverPropertyId)
		const coverHref = coverText === null ? null : parseLanesCoverHref(coverText)
		const coverSrc = coverHref === null ? null : resolveCoverSrc(this.app, entry, coverHref)

		return {
			...LanesCardDisplay.make({
				title,
				coverSrc,
			}),
			properties: this.lanesCardProperties(entry),
		}
	}

	private lanesCardProperties(entry: BasesEntry): readonly LanesCardPropertyField[] {
		const fields: LanesCardPropertyField[] = []
		const linkIdSet = new Set(readLanesCardLinkPropertyIds(this.config))
		const monoIdSet = new Set(readLanesCardMonospacePropertyIds(this.config))
		const badgeIdSet = new Set(readLanesCardBadgePropertyIds(this.config))
		const skipIds = this.lanesCardSlotPropertyIds()

		for (const propertyId of this.config.getOrder()) {
			if (!skipIds.has(propertyId)) {
				this.pushLanesCardProperty(fields, entry, propertyId, {
					asLinks: linkIdSet.has(propertyId),
					monospace: monoIdSet.has(propertyId),
					badge: badgeIdSet.has(propertyId),
				})
			}
		}

		return fields
	}

	private lanesCardSlotPropertyIds(): Set<BasesPropertyId> {
		const ids = new Set<BasesPropertyId>()

		const groupId = readLanesGroupPropertyId(
			this.config,
			this.settingsHost.settings.defaultLanesProperty ?? '',
		)

		const titleId = readLanesTitlePropertyId(
			this.config,
			this.settingsHost.settings.defaultCardTitleProperty ?? '',
		)

		const coverId = readLanesCoverPropertyId(this.config)

		if (groupId !== null) {
			ids.add(groupId)
		}

		if (titleId !== null) {
			ids.add(titleId)
		}

		if (coverId !== null) {
			ids.add(coverId)
		}

		return ids
	}

	private pushLanesCardProperty(
		fields: LanesCardPropertyField[],
		entry: BasesEntry,
		propertyId: BasesPropertyId,
		flags: {
			readonly asLinks: boolean
			readonly monospace: boolean
			readonly badge: boolean
		},
	): void {
		const field = lanesPropertyFieldFromTexts({
			name: this.config.getDisplayName(propertyId),
			texts: lanesValueTexts(entry.getValue(propertyId)),
			asLinks: flags.asLinks,
			monospace: flags.monospace,
			badge: flags.badge,
			propertyId,
		})

		if (field !== null) {
			fields.push(field)
		}
	}

	private renderLanesColumn(
		boardEl: HTMLElement,
		laneTitle: string,
		entries: readonly BasesEntry[],
	): void {
		const collapsed = readLanesCollapsedColumns(this.config).has(laneTitle)

		const columnEl = boardEl.createDiv({
			cls: collapsed ? 'lanes-column lanes-column-collapsed' : 'lanes-column',
			attr: {
				'data-lane-title': laneTitle,
			},
		})

		this.applyLanesColumnAccent(columnEl, laneTitle)
		this.renderLanesColumnHeader(columnEl, laneTitle, entries.length, collapsed)

		const cardsEl = columnEl.createDiv({ cls: 'lanes-cards' })

		for (const entry of entries) {
			const cardEntry = entry

			renderLanesCard(cardsEl, cardEntry, this.lanesCardDisplay(cardEntry), {
				openWiki: (href: string): void => {
					void this.app.workspace.openLinkText(href, cardEntry.file.path)
				},
				imageSrc: (href: string): string | null => resolveCoverSrc(this.app, cardEntry, href),
				badgeColor: (propertyId: string, value: string): string | null =>
					readLanesBadgeColor(this.config, propertyId, value),
				onBadgeContextMenu: (propertyId: string, value: string, event: MouseEvent): void => {
					this.showLanesAccentColorMenu(event, (color) => {
						this.setLanesBadgeColor(propertyId, value, color)
					})
				},
			})
		}
	}

	private applyLanesColumnAccent(columnEl: HTMLElement, laneTitle: string): void {
		const named = readLanesLaneColors(this.config)[laneTitle]

		if (named !== undefined && isLanesLaneColorName(named)) {
			columnEl.setAttribute('data-lane-color', named)

			return
		}

		const hex = readLanesLegacyColumnColor(this.config, laneTitle)

		if (hex !== null) {
			columnEl.style.setProperty('--lanes-column-accent', hex)
		}
	}

	private renderLanesColumnHeader(
		columnEl: HTMLElement,
		laneTitle: string,
		cardCount: number,
		collapsed: boolean,
	): void {
		const headerEl = columnEl.createDiv({ cls: 'lanes-column-header' })

		const titleEl = headerEl.createDiv({
			cls: 'lanes-column-title',
			text: `${laneTitle} (${String(cardCount)})`,
			attr: {
				draggable: 'true',
			},
		})

		titleEl.addEventListener('contextmenu', (event: MouseEvent) => {
			event.preventDefault()
			this.showLanesColorMenu(event, laneTitle)
		})

		if (collapsed) {
			titleEl.addEventListener('click', (event: MouseEvent) => {
				event.stopPropagation()
				this.toggleLanesColumnCollapsed(laneTitle)
			})
		}

		const collapseEl = headerEl.createEl('button', { cls: 'lanes-column-collapse' })

		setIcon(collapseEl, collapsed ? 'chevron-right' : 'chevron-down')
		collapseEl.setAttribute('aria-label', collapsed ? 'Expand lane' : 'Collapse lane')
		collapseEl.addEventListener('click', (event: MouseEvent) => {
			event.stopPropagation()
			this.toggleLanesColumnCollapsed(laneTitle)
		})

		const addEl = headerEl.createEl('button', { cls: 'lanes-column-add' })

		setIcon(addEl, 'plus')
		addEl.setAttribute('aria-label', 'New note in lane')
		addEl.addEventListener('click', (event: MouseEvent) => {
			event.stopPropagation()
			this.createNoteInLanesColumn(laneTitle)
		})
	}

	private toggleLanesColumnCollapsed(laneTitle: string): void {
		const titles = new Set(readLanesCollapsedColumns(this.config))

		if (titles.has(laneTitle)) {
			titles.delete(laneTitle)
		} else {
			titles.add(laneTitle)
		}

		this.config.set(LANES_COLLAPSED_COLUMNS_CONFIG_KEY, lanesCollapsedColumnsConfigValue(titles))
		this.renderLanesBoardDom()
	}

	private createNoteInLanesColumn(laneTitle: string): void {
		const propertyId = readLanesGroupPropertyId(
			this.config,
			this.settingsHost.settings.defaultLanesProperty ?? '',
		)

		const groupKey = propertyId === null ? null : lanesFrontmatterKey(propertyId)

		const groupValue =
			groupKey === null
				? null
				: lanesGroupWriteValue({
						laneTitle,
						kind: 'string',
					})

		this.runtime.runFork(
			createLanesColumnNote(this, {
				groupKey,
				groupValue,
			}).pipe(Effect.tapError((error) => Effect.logError(error.message))),
		)
	}

	private handleLanesCardDragStart(event: DragEvent): void {
		if (event.target instanceof Element && event.target.closest('.lanes-column-title') !== null) {
			this.handleLanesColumnDragStart(event)

			return
		}

		const cardEl = lanesEventCard(event.target)

		if (cardEl === null || event.dataTransfer === null) {
			return
		}

		const filePath = cardEl.getAttribute('data-file-path')

		if (filePath === null) {
			return
		}

		this.ignoreNextCardClick = true
		this.draggingFilePath = filePath
		cardEl.classList.add('lanes-card-dragging')
		event.dataTransfer.setData('text/plain', filePath)
		event.dataTransfer.effectAllowed = 'move'
	}

	private handleLanesCardDragOver(event: DragEvent): void {
		if (!(event.target instanceof Element) || event.target.closest('.lanes-column') === null) {
			return
		}

		event.preventDefault()

		if (event.dataTransfer !== null) {
			event.dataTransfer.dropEffect = 'move'
		}

		if (this.draggingLaneTitle !== null) {
			this.updateLanesColumnDropTarget(event)

			return
		}

		this.updateLanesDropIndicator(event)
	}

	private handleLanesCardDragEnd(): void {
		this.draggingFilePath = null
		this.draggingLaneTitle = null
		this.clearLanesDropIndicator()

		const dragging = this.viewEl.querySelector('.lanes-card-dragging')

		if (dragging instanceof HTMLElement) {
			dragging.classList.remove('lanes-card-dragging')
		}

		const draggingColumn = this.viewEl.querySelector('.lanes-column-dragging')

		if (draggingColumn instanceof HTMLElement) {
			draggingColumn.classList.remove('lanes-column-dragging')
		}
	}

	private handleLanesColumnDragStart(event: DragEvent): void {
		if (!(event.target instanceof Element) || event.dataTransfer === null) {
			return
		}

		const columnEl = event.target.closest('.lanes-column')

		if (!(columnEl instanceof HTMLElement)) {
			return
		}

		const laneTitle = columnEl.getAttribute('data-lane-title')

		if (laneTitle === null) {
			return
		}

		this.draggingLaneTitle = laneTitle
		columnEl.classList.add('lanes-column-dragging')
		event.dataTransfer.setData('text/plain', laneTitle)
		event.dataTransfer.effectAllowed = 'move'
	}

	private updateLanesColumnDropTarget(event: DragEvent): void {
		this.clearLanesDropIndicator()

		const columnEl = event.target instanceof Element ? event.target.closest('.lanes-column') : null

		if (columnEl instanceof HTMLElement) {
			columnEl.classList.add('lanes-column-drop-target')
		}
	}

	private applyLanesColumnDrop(event: DragEvent): void {
		const boardEl = this.viewEl.querySelector('.lanes-board')
		const draggedTitle = this.draggingLaneTitle

		if (!(boardEl instanceof HTMLElement) || draggedTitle === null) {
			return
		}

		const titles = lanesBoardColumnTitles(boardEl)
		const insertIndex = lanesColumnInsertIndex(event, boardEl, draggedTitle)

		const next = insertDraggedPathAt({
			paths: titles,
			draggedPath: draggedTitle,
			index: insertIndex,
		})

		this.config.set(LANES_BOARD_COLUMNS_CONFIG_KEY, [...next])
		this.renderLanesBoardDom()
	}

	private showLanesColorMenu(event: MouseEvent, laneTitle: string): void {
		this.showLanesAccentColorMenu(event, (color) => {
			this.setLanesLaneColor(laneTitle, color)
		})
	}

	private showLanesAccentColorMenu(
		event: MouseEvent,
		onPick: (color: string | null) => void,
	): void {
		const menu = new Menu()

		for (const color of LANES_LANE_COLOR_NAMES) {
			const name = color

			menu.addItem((item) => {
				item.setTitle(name).onClick((): void => {
					onPick(name)
				})
			})
		}

		menu.addSeparator()
		menu.addItem((item) => {
			item.setTitle('Clear color').onClick((): void => {
				onPick(null)
			})
		})
		menu.showAtMouseEvent(event)
	}

	private setLanesBadgeColor(propertyId: string, value: string, color: string | null): void {
		this.config.set(
			LANES_BADGE_COLORS_CONFIG_KEY,
			lanesBadgeColorsWithValue({
				stored: this.config.get(LANES_BADGE_COLORS_CONFIG_KEY),
				propertyId,
				value,
				color,
			}),
		)
		this.renderLanesBoardDom()
	}

	private setLanesLaneColor(laneTitle: string, color: string | null): void {
		const colors = { ...readLanesLaneColors(this.config) }

		if (color === null) {
			delete colors[laneTitle]
		} else {
			colors[laneTitle] = color
		}

		this.config.set(LANES_LANE_COLORS_CONFIG_KEY, colors)
		this.renderLanesBoardDom()
	}

	private renderLanesBoardBar(): void {
		const barEl = this.viewEl.createDiv({ cls: 'lanes-board-bar' })

		this.addLanesBoardBarButton(barEl, 'Group by', (event) => {
			this.showLanesPropertyMenu(event, {
				configKey: LANES_PROPERTY_CONFIG_KEY,
				currentId: readLanesGroupPropertyId(
					this.config,
					this.settingsHost.settings.defaultLanesProperty ?? '',
				),
				noneLabel: 'None',
			})
		})
		this.addLanesBoardBarButton(barEl, 'Title', (event) => {
			this.showLanesPropertyMenu(event, {
				configKey: LANES_TITLE_PROPERTY_CONFIG_KEY,
				currentId: readLanesTitlePropertyId(
					this.config,
					this.settingsHost.settings.defaultCardTitleProperty ?? '',
				),
				noneLabel: 'File name',
			})
		})
		this.addLanesBoardBarButton(barEl, 'Cover', (event) => {
			this.showLanesPropertyMenu(event, {
				configKey: LANES_COVER_PROPERTY_CONFIG_KEY,
				currentId: readLanesCoverPropertyId(this.config),
				noneLabel: 'None',
			})
		})
		this.addLanesBoardBarButton(barEl, 'Card order', (event) => {
			this.showLanesSortMenu(event)
		})
		this.addLanesBoardBarButton(barEl, 'Link fields', () => {
			this.openLanesPropertyChecklist({
				title: 'Link fields',
				description:
					'Checked fields draw as buttons. Which fields show is still the Properties toolbar.',
				configKey: LANES_CARD_LINK_PROPERTIES_CONFIG_KEY,
				selectedIds: readLanesCardLinkPropertyIds(this.config),
			})
		})
		this.addLanesBoardBarButton(barEl, 'Monospace', () => {
			this.openLanesPropertyChecklist({
				title: 'Monospace fields',
				description: 'Checked fields draw in a monospace font.',
				configKey: LANES_CARD_MONOSPACE_PROPERTIES_CONFIG_KEY,
				selectedIds: readLanesCardMonospacePropertyIds(this.config),
			})
		})
		this.addLanesBoardBarButton(barEl, 'Badges', () => {
			this.openLanesPropertyChecklist({
				title: 'Badge fields',
				description: 'Checked fields draw as chips. Right-click a chip to set a color.',
				configKey: LANES_CARD_BADGE_PROPERTIES_CONFIG_KEY,
				selectedIds: readLanesCardBadgePropertyIds(this.config),
			})
		})

		const fillWidth = readLanesFillWidth(this.config)

		const fillButton = this.addLanesBoardBarButton(barEl, 'Fill width', () => {
			this.config.set(LANES_FILL_WIDTH_CONFIG_KEY, !fillWidth)
			this.renderLanesBoardDom()
		})

		fillButton.setAttribute('aria-pressed', fillWidth ? 'true' : 'false')
	}

	private addLanesBoardBarButton(
		barEl: HTMLElement,
		label: string,
		onClick: (event: MouseEvent) => void,
	): HTMLButtonElement {
		const button = barEl.createEl('button', {
			cls: 'lanes-board-bar-button',
			text: label,
		})

		button.addEventListener('click', (event: MouseEvent) => {
			event.stopPropagation()
			onClick(event)
		})

		return button
	}

	private showLanesPropertyMenu(
		event: MouseEvent,
		input: {
			readonly configKey: string
			readonly currentId: BasesPropertyId | null
			readonly noneLabel: string
		},
	): void {
		const menu = new Menu()
		const propertyIds = [...this.allProperties]

		if (input.currentId !== null && !propertyIds.includes(input.currentId)) {
			propertyIds.push(input.currentId)
		}

		for (const propertyId of propertyIds) {
			const id = propertyId

			menu.addItem((item) => {
				item.setTitle(this.config.getDisplayName(id))
				item.setChecked(id === input.currentId)
				item.onClick((): void => {
					this.config.set(input.configKey, id)
					this.renderLanesBoardDom()
				})
			})
		}

		menu.addSeparator()
		menu.addItem((item) => {
			item.setTitle(input.noneLabel)
			item.setChecked(input.currentId === null)
			item.onClick((): void => {
				this.config.set(input.configKey, '')
				this.renderLanesBoardDom()
			})
		})
		menu.showAtMouseEvent(event)
	}

	private showLanesSortMenu(event: MouseEvent): void {
		const menu = new Menu()
		const current = readLanesCardSort(this.config)

		for (const option of LANES_CARD_SORT_OPTIONS) {
			const sort = option.sort

			menu.addItem((item) => {
				item.setTitle(option.label)
				item.setChecked(sort === current)
				item.onClick((): void => {
					this.config.set(LANES_CARD_SORT_CONFIG_KEY, sort)
					this.renderLanesBoardDom()
				})
			})
		}

		menu.addSeparator()
		menu.addItem((item) => {
			item.setTitle('Order property').onClick((): void => {
				this.openLanesOrderPropertyModal()
			})
		})
		menu.showAtMouseEvent(event)
	}

	private openLanesOrderPropertyModal(): void {
		const modal = new Modal(this.app)

		modal.titleEl.setText('Order property')
		new Setting(modal.contentEl).setName('Frontmatter key').addText((text) => {
			text.setPlaceholder(LANES_ORDER_PROPERTY_DEFAULT)
			text.setValue(readLanesOrderProperty(this.config))
			text.onChange((value) => {
				const trimmed = value.trim()

				this.config.set(
					LANES_ORDER_PROPERTY_CONFIG_KEY,
					trimmed === '' ? LANES_ORDER_PROPERTY_DEFAULT : trimmed,
				)
			})
		})
		modal.open()
	}

	private openLanesPropertyChecklist(input: {
		readonly title: string
		readonly description: string
		readonly configKey: string
		readonly selectedIds: readonly BasesPropertyId[]
	}): void {
		new LanesPropertyChecklistModal({
			app: this.app,
			title: input.title,
			description: input.description,
			propertyIds: this.allProperties,
			displayName: (propertyId: BasesPropertyId): string => this.config.getDisplayName(propertyId),
			selectedIds: input.selectedIds,
			onSave: (ids: readonly BasesPropertyId[]): void => {
				this.config.set(input.configKey, [...ids])
				this.renderLanesBoardDom()
			},
		}).open()
	}

	private handleLanesCardDrop(event: DragEvent): void {
		event.preventDefault()

		if (this.draggingLaneTitle !== null) {
			this.applyLanesColumnDrop(event)
			this.handleLanesCardDragEnd()

			return
		}

		const sourceLaneTitle = lanesLaneTitleFromCard(
			this.viewEl.querySelector('.lanes-card-dragging'),
		)

		this.handleLanesCardDragEnd()

		const filePath = event.dataTransfer?.getData('text/plain')
		const columnEl = event.target instanceof Element ? event.target.closest('.lanes-column') : null

		if (filePath === undefined || filePath === '' || !(columnEl instanceof HTMLElement)) {
			return
		}

		this.runtime.runFork(this.applyLanesCardDropEffect(event, filePath, columnEl, sourceLaneTitle))
	}

	private applyLanesCardDropEffect(
		event: DragEvent,
		filePath: string,
		columnEl: HTMLElement,
		sourceLaneTitle: string | null,
	): Effect.Effect<void, LanesApplyCardDropError> {
		return Effect.try({
			try: () => this.lanesCardDropWrite(event, filePath, columnEl, sourceLaneTitle),
			catch: (cause) =>
				new LanesApplyCardDropError({
					message: `LanesView.applyCardDrop failed: ${lanesErrorMessage(cause)}`,
				}),
		}).pipe(
			Effect.flatMap((write) => {
				if (write === null) {
					return Effect.void
				}

				return applyLanesCardDrop(write).pipe(
					Effect.tap(() =>
						Effect.logInfo('LanesView.applyCardDrop').pipe(
							Effect.annotateLogs({
								filePath: write.file.path,
								orderKey: write.orderKey,
								groupKey: write.groupKey ?? 'none',
							}),
						),
					),
				)
			}),
			Effect.tapError((error) => Effect.logError(error.message)),
			Effect.withSpan('LanesView.handleCardDrop'),
		)
	}

	private lanesCardDropWrite(
		event: DragEvent,
		filePath: string,
		columnEl: HTMLElement,
		sourceLaneTitle: string | null,
	): LanesCardDropWrite | null {
		const file = this.app.vault.getAbstractFileByPath(filePath)

		if (!(file instanceof TFile)) {
			return null
		}

		const laneTitle = columnEl.getAttribute('data-lane-title')

		if (laneTitle === null) {
			return null
		}

		const cardsEl = columnEl.querySelector('.lanes-cards')

		if (!(cardsEl instanceof HTMLElement)) {
			return null
		}

		const currentPaths = lanesColumnFilePaths(columnEl)
		const insertIndex = lanesDropInsertIndex(event, cardsEl, filePath)

		const orderedPaths = insertDraggedPathAt({
			paths: currentPaths,
			draggedPath: filePath,
			index: insertIndex,
		})

		if (currentPaths.join('\0') === orderedPaths.join('\0')) {
			return null
		}

		const orderProperty = readLanesOrderProperty(this.config)

		const neighbors = neighborOrderKeys({
			orderedPaths,
			draggedPath: filePath,
			keysByPath: lanesOrderKeysByPath(this.app, orderedPaths, orderProperty),
		})

		const groupKey = sourceLaneTitle === laneTitle ? null : this.lanesDropGroupKey()

		const groupValue =
			groupKey === null
				? null
				: lanesGroupWriteValue({
						laneTitle,
						kind: this.lanesGroupKindForColumn(orderedPaths, filePath),
					})

		return {
			app: this.app,
			file,
			orderProperty,
			orderKey: lanesOrderKeyAfterDrop(neighbors),
			groupKey,
			groupValue,
		}
	}

	private lanesDropGroupKey(): string | null {
		const propertyId = this.config.getAsPropertyId(LANES_PROPERTY_CONFIG_KEY)

		return propertyId === null ? null : lanesFrontmatterKey(propertyId)
	}

	private lanesGroupKindForColumn(
		orderedPaths: readonly string[],
		draggedPath: string,
	): 'boolean' | 'number' | 'string' {
		const propertyId = this.config.getAsPropertyId(LANES_PROPERTY_CONFIG_KEY)

		if (propertyId === null) {
			return 'string'
		}

		for (const path of orderedPaths) {
			if (path === draggedPath) {
				continue
			}

			for (const entry of this.data.data) {
				if (entry.file.path !== path) {
					continue
				}

				const value = entry.getValue(propertyId)

				if (value instanceof BooleanValue) {
					return 'boolean'
				}

				if (value instanceof NumberValue) {
					return 'number'
				}

				return 'string'
			}
		}

		return 'string'
	}

	private clearLanesDropIndicator(): void {
		const indicators = this.viewEl.querySelectorAll('.lanes-drop-indicator')

		for (const indicator of indicators) {
			indicator.remove()
		}

		const columns = this.viewEl.querySelectorAll('.lanes-column-drop-target')

		for (const column of columns) {
			column.classList.remove('lanes-column-drop-target')
		}
	}

	private updateLanesDropIndicator(event: DragEvent): void {
		this.clearLanesDropIndicator()

		const columnEl = event.target instanceof Element ? event.target.closest('.lanes-column') : null

		if (!(columnEl instanceof HTMLElement)) {
			return
		}

		columnEl.classList.add('lanes-column-drop-target')
		const cardsEl = columnEl.querySelector('.lanes-cards')

		if (!(cardsEl instanceof HTMLElement)) {
			return
		}

		const insertIndex = lanesDropInsertIndex(event, cardsEl, this.draggingFilePath ?? '')
		const before = lanesVisibleDropCards(cardsEl, this.draggingFilePath)[insertIndex]
		const indicator = cardsEl.createDiv({ cls: 'lanes-drop-indicator' })

		if (before !== undefined) {
			cardsEl.insertBefore(indicator, before)
		}
	}

	private handleLanesCardForestMenu(event: MouseEvent): void {
		const forest = getForestPluginApi(this.app)
		const file = this.lanesCardFileFromEvent(event)

		if (forest === null || file === null) {
			return
		}

		if (event.target instanceof Element && event.target.closest('a') !== null) {
			return
		}

		event.preventDefault()

		const menu = new Menu()

		menu.addItem((item) => {
			item.setTitle('Preview worktree session').onClick(() => {
				void this.previewLanesCardForestCopy(forest, file)
			})
		})
		menu.addItem((item) => {
			item.setTitle('Open worktree folder').onClick(() => {
				void this.openLanesCardForestFolder(forest, file)
			})
		})
		menu.showAtMouseEvent(event)
	}

	private async previewLanesCardForestCopy(forest: ForestPluginApi, file: TFile): Promise<void> {
		const copies = decodeForestWorktreeCopies(await forest.listCopiesForFile(file.path))
		const copy = forestCopyMatchingWorktreePath(copies, lanesNoteWorktreePath(this.app, file))

		if (copy === null) {
			new Notice('Forest: no worktree copy of this note.')

			return
		}

		forest.previewWorktreeCopy(copy)
	}

	private async openLanesCardForestFolder(forest: ForestPluginApi, file: TFile): Promise<void> {
		const copies = decodeForestWorktreeCopies(await forest.listCopiesForFile(file.path))

		const directory = forestWorktreeDirectoryToOpen({
			copies,
			worktreePath: lanesNoteWorktreePath(this.app, file),
		})

		if (directory === null) {
			new Notice('Forest: no worktree folder for this note.')

			return
		}

		forest.openWorktreeDirectory(directory)
	}

	private lanesCardFileFromEvent(event: MouseEvent): TFile | null {
		const target = event.target

		if (!(target instanceof Element)) {
			return null
		}

		const cardEl = target.closest('.lanes-card')

		if (!(cardEl instanceof HTMLElement)) {
			return null
		}

		const filePath = cardEl.getAttribute('data-file-path')

		if (filePath === null) {
			return null
		}

		const file = this.app.vault.getAbstractFileByPath(filePath)

		return file instanceof TFile ? file : null
	}

	private handleLanesCardClick(event: MouseEvent): void {
		if (this.ignoreNextCardClick) {
			this.ignoreNextCardClick = false

			return
		}

		if (event.target instanceof Element && event.target.closest('a') !== null) {
			return
		}

		const target = event.target

		if (!(target instanceof Element)) {
			return
		}

		const cardEl = target.closest('.lanes-card')

		if (!(cardEl instanceof HTMLElement)) {
			return
		}

		const filePath = cardEl.getAttribute('data-file-path')

		if (filePath === null) {
			return
		}

		const file = this.app.vault.getAbstractFileByPath(filePath)

		if (file instanceof TFile) {
			this.openLanesCardFile(file)
		}
	}

	private openLanesCardFile(file: TFile): void {
		const leaf = Match.value(readLanesCardOpenBehavior(this.config)).pipe(
			Match.when('current', () => this.app.workspace.getLeaf(false)),
			Match.when('tab', () => this.app.workspace.getLeaf('tab')),
			Match.when('split', () => this.app.workspace.getLeaf('split')),
			Match.when('window', () => this.app.workspace.getLeaf('window')),
			Match.exhaustive,
		)

		void leaf.openFile(file)
	}
}

const lanesOrderKeysByPath = (
	app: App,
	paths: readonly string[],
	orderProperty: string,
): Map<string, string | null> => {
	const keysByPath = new Map<string, string | null>()

	for (const path of paths) {
		const neighbor = app.vault.getAbstractFileByPath(path)

		if (neighbor instanceof TFile) {
			const orderValue = readOrderValueForFile(app, neighbor, orderProperty)
			keysByPath.set(path, Predicate.isString(orderValue) ? orderValue : null)
		}
	}

	return keysByPath
}

const lanesValueTexts = (value: ReturnType<BasesEntry['getValue']>): readonly string[] => {
	if (value === null || value instanceof NullValue) {
		return []
	}

	if (value instanceof ListValue) {
		const texts: string[] = []

		for (let index = 0; index < value.length(); index += 1) {
			const item = value.get(index)

			if (!(item instanceof NullValue)) {
				texts.push(item.toString())
			}
		}

		return texts
	}

	return [value.toString()]
}

const renderLanesCardProperty = (
	cardEl: HTMLElement,
	field: LanesCardPropertyField,
	handlers: LanesCardPropertyHandlers,
): void => {
	const rowEl = cardEl.createDiv({
		cls: field.monospace ? 'lanes-card-property lanes-card-property-mono' : 'lanes-card-property',
	})

	rowEl.createDiv({
		cls: 'lanes-card-property-label',
		text: field.name,
	})

	const valuesEl = rowEl.createDiv({ cls: 'lanes-card-property-values' })

	for (const link of field.links) {
		renderLanesCardPropertyLink(valuesEl, link, handlers)
	}

	for (const text of field.texts) {
		if (field.badge) {
			renderLanesCardPropertyBadge(valuesEl, field.propertyId, text, handlers)
		} else {
			valuesEl.createDiv({
				cls: 'lanes-card-property-text',
				text,
			})
		}
	}
}

const renderLanesCardPropertyBadge = (
	valuesEl: HTMLElement,
	propertyId: string,
	value: string,
	handlers: LanesCardPropertyHandlers,
): void => {
	const color = handlers.badgeColor(propertyId, value)

	const badgeEl = valuesEl.createDiv({
		cls: 'lanes-card-property-badge',
		text: value,
	})

	if (color !== null) {
		badgeEl.setAttribute('data-badge-color', color)
	}

	badgeEl.addEventListener('contextmenu', (event: MouseEvent) => {
		event.preventDefault()
		event.stopPropagation()
		handlers.onBadgeContextMenu(propertyId, value, event)
	})
}

const renderLanesCardPropertyLink = (
	valuesEl: HTMLElement,
	link: LanesCardPropertyLink,
	handlers: LanesCardPropertyHandlers,
): void => {
	if (link.kind === 'image') {
		const src = handlers.imageSrc(link.href)

		if (src === null) {
			return
		}

		const imageEl = valuesEl.createEl('img', {
			cls: 'lanes-card-property-image',
			attr: {
				src,
				alt: link.label,
				title: link.href,
				draggable: 'false',
			},
		})

		imageEl.addEventListener('error', () => {
			imageEl.remove()
		})
		imageEl.addEventListener('click', (event: MouseEvent) => {
			event.stopPropagation()
			handlers.openWiki(link.href)
		})

		return
	}

	const isUrl = link.kind === 'url'

	const anchorEl = valuesEl.createEl('a', {
		cls: isUrl ? 'lanes-card-property-button' : 'lanes-card-property-link',
		text: link.label,
		attr: {
			href: isUrl ? link.href : '#',
			title: link.href,
			draggable: 'false',
		},
	})

	if (isUrl) {
		anchorEl.setAttribute('target', '_blank')
		anchorEl.setAttribute('rel', 'noopener')
	}

	anchorEl.addEventListener('click', (event: MouseEvent) => {
		event.stopPropagation()

		if (!isUrl) {
			event.preventDefault()
			handlers.openWiki(link.href)
		}
	})
}

const lanesLaneTitleFromCard = (card: EventTarget | null): string | null => {
	if (!(card instanceof HTMLElement)) {
		return null
	}

	return card.closest('.lanes-column')?.getAttribute('data-lane-title') ?? null
}

const lanesEventCard = (target: EventTarget | null): HTMLElement | null => {
	if (!(target instanceof Element)) {
		return null
	}

	const cardEl = target.closest('.lanes-card')

	return cardEl instanceof HTMLElement ? cardEl : null
}

const lanesVisibleDropCards = (cardsEl: HTMLElement, draggedPath: string | null): HTMLElement[] => {
	const visible: HTMLElement[] = []
	const cards = cardsEl.querySelectorAll('.lanes-card')

	for (const card of cards) {
		if (card instanceof HTMLElement && card.getAttribute('data-file-path') !== draggedPath) {
			visible.push(card)
		}
	}

	return visible
}

const lanesColumnFilePaths = (columnEl: HTMLElement): string[] => {
	const paths: string[] = []
	const cards = columnEl.querySelectorAll('.lanes-card')

	for (const card of cards) {
		if (!(card instanceof HTMLElement)) {
			continue
		}

		const path = card.getAttribute('data-file-path')

		if (path !== null) {
			paths.push(path)
		}
	}

	return paths
}

const lanesDropInsertIndex = (
	event: DragEvent,
	cardsEl: HTMLElement,
	draggedPath: string,
): number => {
	const cards = cardsEl.querySelectorAll('.lanes-card')
	const overCard = lanesEventCard(event.target)
	let index = 0

	for (const card of cards) {
		if (!(card instanceof HTMLElement)) {
			continue
		}

		const path = card.getAttribute('data-file-path')

		if (path === draggedPath) {
			continue
		}

		if (overCard !== null && card === overCard) {
			const rect = overCard.getBoundingClientRect()
			const before = event.clientY < rect.top + rect.height / 2

			return before ? index : index + 1
		}

		index += 1
	}

	return index
}

const lanesBoardColumnTitles = (boardEl: HTMLElement): string[] => {
	const titles: string[] = []
	const columns = boardEl.querySelectorAll('.lanes-column')

	for (const column of columns) {
		if (!(column instanceof HTMLElement)) {
			continue
		}

		const title = column.getAttribute('data-lane-title')

		if (title !== null) {
			titles.push(title)
		}
	}

	return titles
}

const lanesColumnInsertIndex = (
	event: DragEvent,
	boardEl: HTMLElement,
	draggedTitle: string,
): number => {
	const columns = boardEl.querySelectorAll('.lanes-column')

	const overColumn = event.target instanceof Element ? event.target.closest('.lanes-column') : null

	let index = 0

	for (const column of columns) {
		if (!(column instanceof HTMLElement)) {
			continue
		}

		const title = column.getAttribute('data-lane-title')

		if (title === draggedTitle) {
			continue
		}

		if (overColumn !== null && column === overColumn) {
			const rect = overColumn.getBoundingClientRect()
			const before = event.clientX < rect.left + rect.width / 2

			return before ? index : index + 1
		}

		index += 1
	}

	return index
}
