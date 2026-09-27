import { type App, Plugin, PluginSettingTab, type SettingDefinitionItem } from 'obsidian'

import {
	lanesPluginSettingsFromDefaults,
	type LanesPluginSettingsHost,
} from '#/src/lanes-plugin-settings'

/** Plugin settings tab for defaults used when a view has not set its own. */
export class LanesSettingTab extends PluginSettingTab {
	private readonly settingsHost: LanesPluginSettingsHost

	constructor(app: App, plugin: Plugin, settingsHost: LanesPluginSettingsHost) {
		super(app, plugin)
		this.settingsHost = settingsHost
	}

	override getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				name: 'Defaults',
				desc: 'Defaults apply to Lanes views that have not set their own Group cards by or Card title.',
			},
			{
				name: 'Default group-by property',
				desc: 'Example: status. Used when a view has no Group cards by.',
				control: {
					type: 'text',
					key: 'defaultLanesProperty',
					placeholder: 'status',
				},
			},
			{
				name: 'Default card title property',
				desc: 'Example: codename. Used when a view has no Card title. Empty means file name.',
				control: {
					type: 'text',
					key: 'defaultCardTitleProperty',
					placeholder: 'codename',
				},
			},
		]
	}

	override getControlValue(key: string): unknown {
		if (key === 'defaultLanesProperty') {
			return this.settingsHost.settings.defaultLanesProperty ?? ''
		}

		if (key === 'defaultCardTitleProperty') {
			return this.settingsHost.settings.defaultCardTitleProperty ?? ''
		}

		return undefined
	}

	override setControlValue(key: string, value: unknown): void {
		if (key !== 'defaultLanesProperty' && key !== 'defaultCardTitleProperty') {
			return
		}

		if (typeof value !== 'string') {
			return
		}

		this.writeDefault(key, value)
	}

	private writeDefault(
		key: 'defaultLanesProperty' | 'defaultCardTitleProperty',
		value: string,
	): void {
		const trimmed = value.trim()
		const current = this.settingsHost.settings

		const lanesProperty =
			key === 'defaultLanesProperty' ? trimmed : (current.defaultLanesProperty ?? '')

		const titleProperty =
			key === 'defaultCardTitleProperty' ? trimmed : (current.defaultCardTitleProperty ?? '')

		this.settingsHost.settings = lanesPluginSettingsFromDefaults({
			current,
			defaultLanesProperty: lanesProperty,
			defaultCardTitleProperty: titleProperty,
		})
		void this.settingsHost.saveLanesPluginSettings()
	}
}
