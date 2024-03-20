import { groupBy } from "lodash/fp";
import { Moment } from "moment";
import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { settings } from "../../global-store/settings";
import { TasksForDay } from "../../types";
import { getScheduledDay } from "../../util/dataview";
import { mapToTasksForDay } from "../../util/get-tasks-for-day";
import { getDayKey, getEmptyRecordsForDay } from "../../util/tasks-utils";

export function useVisibleDataviewTasks(
  dataviewTasks: Readable<STask[]>,
  visibleDays: Readable<Moment[]>,
) {
  return derived(
    [visibleDays, dataviewTasks, settings],
    ([$visibleDays, $dataviewTasks, $settings]) => {
      const dayToSTasks = groupBy(getScheduledDay, $dataviewTasks);

      return $visibleDays.reduce<Record<string, TasksForDay>>((result, day) => {
        const key = getDayKey(day);
        const sTasksForDay = dayToSTasks[key];

        if (sTasksForDay) {
          // todo: process errors
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { errors, ...tasks } = mapToTasksForDay(
            day,
            sTasksForDay,
            $settings,
          );

          result[key] = tasks;
        } else {
          result[key] = getEmptyRecordsForDay();
        }

        return result;
      }, {});
    },
  );
}
