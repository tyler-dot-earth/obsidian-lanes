import { Layer, Logger, type ManagedRuntime } from 'effect'
import {
	disposePluginRuntime,
	makePluginRuntime,
	type PluginDataStore,
	pluginDataStoreLayerFromHost,
} from 'effect-obsidian'
import { Notice, Plugin } from 'obsidian'

import {
	defaultLanesPluginSettings,
	type LanesPluginSettings,
	loadLanesPluginSettings,
} from '#src/lanes-plugin-settings'
import { LanesSettingTab } from '#src/lanes-setting-tab'
import { LANES_VIEW_TYPE, LanesView } from '#src/lanes-view'
import { getLanesViewOptions } from '#src/lanes-view-options'

export default class LanesPlugin extends Plugin {
	override settings: LanesPluginSettings = defaultLanesPluginSettings
	private runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never> | undefined

	override async onload(): Promise<void> {
		const runtime = makePluginRuntime(
			Layer.mergeAll(
				pluginDataStoreLayerFromHost({
					loadData: () => this.loadData(),
					saveData: (data) => this.saveData(data),
				}),
				Logger.layer([Logger.consoleJson]),
			),
		)

		this.runtime = runtime
		this.settings = await runtime.runPromise(loadLanesPluginSettings)
		this.addSettingTab(new LanesSettingTab(this.app, this, this))
		this.registerLanesBasesView(runtime)
	}

	private registerLanesBasesView(
		runtime: ManagedRuntime.ManagedRuntime<PluginDataStore, never>,
	): void {
		const registered = this.registerBasesView(LANES_VIEW_TYPE, {
			name: 'Lanes',
			icon: 'lucide-columns',
			factory: (controller, containerEl): LanesView =>
				new LanesView(controller, containerEl, runtime, this),
			options: getLanesViewOptions,
		})

		if (!registered) {
			new Notice('Lanes: Bases is off in this vault, so the Lanes view was not registered.')
		}
	}

	async saveLanesPluginSettings(): Promise<void> {
		await this.saveData(this.settings)
	}

	override onunload(): void {
		void disposePluginRuntime(this.runtime)
		this.runtime = undefined
	}
}
