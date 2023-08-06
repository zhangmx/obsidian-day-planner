import { Plugin, TAbstractFile, Vault, WorkspaceLeaf } from "obsidian";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { DayPlannerSettings, NoteForDateQuery } from "./settings";
import StatusBar from "./ui/status-bar";
import Progress from "./progress";
import PlannerMarkdown from "./planner-markdown";
import DayPlannerFile from "./file";
import { VIEW_TYPE_TIMELINE } from "./constants";
import TimelineView from "./ui/timeline-view";
import { PlanSummaryData } from "./plan/plan-summary-data";
import { appHasDailyNotesPluginLoaded } from "obsidian-daily-notes-interface";
import { DayPlannerMode } from "./types";

export default class DayPlanner extends Plugin {
  settings: DayPlannerSettings;
  vault: Vault;
  file: DayPlannerFile;
  plannerMD: PlannerMarkdown;
  statusBar: StatusBar;
  notesForDatesQuery: NoteForDateQuery;
  timelineView: TimelineView;

  async onload() {
    this.vault = this.app.vault;
    this.settings = Object.assign(
      new DayPlannerSettings(),
      await this.loadData(),
    );
    this.notesForDatesQuery = new NoteForDateQuery();
    this.file = new DayPlannerFile(this.vault, this.settings);
    const progress = new Progress();
    this.plannerMD = new PlannerMarkdown(
      this.app.workspace,
      this.app.metadataCache,
      this.settings,
      this.file,
    );
    this.statusBar = new StatusBar(
      this.settings,
      this.addStatusBarItem(),
      this.app.workspace,
      progress,
      new PlannerMarkdown(
        this.app.workspace,
        this.app.metadataCache,
        this.settings,
        this.file,
      ),
      this.file,
    );

    // todo: trigger on metadataCacheUpdate
    this.registerEvent(this.app.vault.on("modify", this.codeMirror, ""));

    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show the Day Planner Timeline",
      callback: async () => await this.initLeaf(),
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: () =>
        this.app.workspace.openLinkText(
          this.file.getTodayPlannerFilePath(),
          "",
          true,
        ),
    });

    this.addCommand({
      id: "insert-planner-heading-at-cursor",
      name: "Insert Planner Heading at Cursor",
      editorCallback: (editor) =>
        editor.replaceSelection(this.createPlannerHeading()),
    });

    this.registerView(
      VIEW_TYPE_TIMELINE,
      // todo: this is a bad idea, use getViewOfType()
      (leaf: WorkspaceLeaf) =>
        (this.timelineView = new TimelineView(leaf, this.settings, this)),
    );

    this.addSettingTab(new DayPlannerSettingsTab(this.app, this));
    this.registerInterval(
      // todo: most of it should not be updated with a timer
      window.setInterval(async () => {
        if (await this.file.hasTodayNote()) {
          const planSummary = await this.plannerMD.parseDayPlanner();
          planSummary.updatePlanItemProps();
          await this.statusBar.refreshStatusBar(planSummary);
          await this.plannerMD.updateDayPlannerMarkdown(planSummary);
          this.timelineView?.update(planSummary);
        } else if (
          this.settings.mode == DayPlannerMode.DAILY &&
          appHasDailyNotesPluginLoaded()
        ) {
          const planSummary = new PlanSummaryData([]);
          await this.statusBar.refreshStatusBar(planSummary);
          this.timelineView && this.timelineView.update(planSummary);
        } else {
          // console.log('No active note, skipping file processing')
        }
      }, 2000),
    );
  }

  private createPlannerHeading() {
    const headingTokens = "#".repeat(this.settings.plannerHeadingLevel);

    return `${headingTokens} ${this.settings.plannerHeading}

- 
`;
  }

  async initLeaf() {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TIMELINE).length > 0) {
      return;
    }
    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TIMELINE,
      active: true,
    });
  }

  codeMirror = (file: TAbstractFile) => {
    if (this.file.hasTodayNote()) {
      // console.log('Active note found, starting CodeMirror monitoring')
      this.plannerMD.checkIsDayPlannerEditing();
    } else {
      // console.log('No active note, skipping CodeMirror monitoring')
    }
  };

  onunload() {
    console.log("Unloading Day Planner plugin");
    this.app.workspace
      .getLeavesOfType(VIEW_TYPE_TIMELINE)
      .forEach((leaf) => leaf.detach());
  }
}
