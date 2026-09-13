import { type App, Plugin, PluginSettingTab, Setting } from 'obsidian'

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

	override display(): void {
		const { containerEl } = this
		containerEl.empty()
		containerEl.createEl('p', {
			text: 'Defaults apply to Lanes views that have not set their own Group cards by or Card title.',
		})

		new Setting(containerEl)
			.setName('Default group-by property')
			.setDesc('Example: status. Used when a view has no Group cards by.')
			.addText((text) => {
				text.setPlaceholder('status')
				text.setValue(this.settingsHost.settings.defaultLanesProperty ?? '')
				text.onChange((value) => {
					this.updateDefault('defaultLanesProperty', value)
				})
			})

		new Setting(containerEl)
			.setName('Default card title property')
			.setDesc('Example: codename. Used when a view has no Card title. Empty means file name.')
			.addText((text) => {
				text.setPlaceholder('codename')
				text.setValue(this.settingsHost.settings.defaultCardTitleProperty ?? '')
				text.onChange((value) => {
					this.updateDefault('defaultCardTitleProperty', value)
				})
			})
	}

	private updateDefault(
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
