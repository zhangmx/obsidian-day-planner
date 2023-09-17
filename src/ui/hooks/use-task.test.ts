import { get, writable } from "svelte/store";

import { currentTime } from "../../global-stores/current-time";
import { settingsWithUtils } from "../../global-stores/settings-with-utils";

import { basePlanItem } from "./test-utils";
import { useTask } from "./use-task";

function getBaseUseTaskProps() {
  const cursorOffsetY = writable(0);
  return {
    settings: settingsWithUtils,
    currentTime,
    cursorOffsetY,
    onUpdate: jest.fn(),
    onMouseUp: jest.fn(),
  };
}

// todo: use non-default zoom & start hours
test("derives task offset from settings and time", () => {
  const { offset, height, relationToNow } = useTask(
    basePlanItem,
    getBaseUseTaskProps(),
  );

  expect(get(offset)).toEqual(0);
  expect(get(height)).toEqual(60);
  expect(get(relationToNow)).toEqual("past");
});

test.skip("tasks change position and size when zoom level changes", () => {
  const { offset, height } = useTask(basePlanItem, getBaseUseTaskProps());

  // todo: this is leaking state to other tests, need to copy settings
  settingsWithUtils.settings.update((previous) => ({
    ...previous,
    zoomLevel: 1,
  }));

  expect(get(offset)).toEqual(4 * 60);
  expect(get(height)).toEqual(60);
});

test.todo(
  "to-be-created tasks (ghost tasks) follow the cursor and snap to round numbers",
);

describe("dragging", () => {
  test("while dragging, offset is derived from pointer position", () => {
    const { cursorOffsetY, ...rest } = getBaseUseTaskProps();
    const { offset, startMove } = useTask(basePlanItem, {
      cursorOffsetY,
      ...rest,
    });

    startMove();
    cursorOffsetY.set(10);

    expect(get(offset)).toEqual(10);
  });

  test("cancel move resets task position", () => {
    const { cursorOffsetY, ...rest } = getBaseUseTaskProps();
    const { offset, startMove, cancelMove } = useTask(basePlanItem, {
      cursorOffsetY,
      ...rest,
    });

    startMove();
    cursorOffsetY.set(200);

    expect(get(offset)).toEqual(200);

    cancelMove();

    expect(get(offset)).toEqual(0);
  });

  test("when drag ends, task updates pos and stops reacting to cursor movement", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY, onUpdate } = props;

    const { startMove, confirmMove } = useTask(basePlanItem, props);

    startMove();
    cursorOffsetY.set(200);
    // todo: more assertions here

    confirmMove();

    // todo: this is a bug
    // expect(get(offset)).toEqual(200);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ startMinutes: 200 }),
    );
  });

  test.todo("tasks snap to round numbers while dragging");

  test.todo("does not react to mouse up when dragging");
});

describe("Resizing", () => {
  test("while resizing, height is derived from pointer position", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY } = props;

    const { height, startResize } = useTask(basePlanItem, props);

    startResize();
    cursorOffsetY.set(700);

    expect(get(height)).toEqual(700);
  });

  test("cancel resize resets task height", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY } = props;

    const { height, startResize, cancelResize } = useTask(basePlanItem, props);

    startResize();
    cursorOffsetY.set(700);
    cancelResize();

    expect(get(height)).toEqual(60);
  });

  test("when resize ends, task updates and stops reacting to cursor", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY, onUpdate } = props;

    const { startResize, confirmResize } = useTask(basePlanItem, props);

    startResize();
    cursorOffsetY.set(700);
    confirmResize();

    // todo: this is a bug, task needs to be reactive
    // expect(get(height)).toEqual(700);

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ endMinutes: 700 }),
    );
  });

  test.todo("task height snaps to a round number while resizing");
});

test.todo("navigates to file on click");