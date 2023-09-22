import { writable } from "svelte/store";

import type { DayPlannerSettings } from "../settings";
import { defaultSettings } from "../settings";

export const settings = writable<DayPlannerSettings>(defaultSettings);
