import {
    App,
    PluginSettingTab,
    Setting
} from 'obsidian';
import { DayPlannerMode }from './settings';
import MomentDateRegex from './moment-date-regex';
import DayPlanner from './main';
  
  export class DayPlannerSettingsTab extends PluginSettingTab {
    momentDateRegex = new MomentDateRegex();
    plugin: DayPlanner;
    constructor(app: App, plugin: DayPlanner) {
      super(app, plugin);
      this.plugin = plugin;
  }
  
    display(): void {
      const { containerEl } = this;
  
      containerEl.empty();

      new Setting(containerEl)
        .setName('Day Planner Mode')
        .setDesc(this.modeDescriptionContent())
        .addDropdown(dropDown => 
          dropDown
            .addOption(DayPlannerMode[DayPlannerMode.File], "File mode")
            .addOption(DayPlannerMode[DayPlannerMode.Command], "Command mode")
            .setValue(DayPlannerMode[this.plugin.settings.mode] || DayPlannerMode.File.toString())
            .onChange((value:string) => {
              this.plugin.settings.mode = DayPlannerMode[value as keyof typeof DayPlannerMode];
              this.plugin.saveData(this.plugin.settings);
            }));
    }

    private modeDescriptionContent(): DocumentFragment {
      const descEl = document.createDocumentFragment();
      descEl.appendText('Choose between 2 modes to use the Day Planner plugin:');
      descEl.appendChild(document.createElement('br'));
      descEl.appendChild(document.createElement('strong')).appendText('File mode');
      descEl.appendChild(document.createElement('br'));
      descEl.appendText('Plugin automatically generates day planner notes for each day within a Day Planners folder.');
      descEl.appendChild(document.createElement('br'));
      descEl.appendChild(document.createElement('strong')).appendText('Command mode');
      descEl.appendChild(document.createElement('br'));
      descEl.appendText('Command used to insert a Day Planner for today within the current note.');
      descEl.appendChild(document.createElement('br'));
      this.addDocsLink(descEl);
      return descEl;
    }

    private addDocsLink(descEl: DocumentFragment) {
      const a = document.createElement('a');
      a.href = 'https://github.com/lynchjames/obsidian-day-plannerhttps://github.com/lynchjames/obsidian-day-planner/blob/main/README.md';
      a.text = 'plugin README';
      a.target = '_blank';
      descEl.appendChild(a);
      descEl.appendChild(document.createElement('br'));
    }

  }