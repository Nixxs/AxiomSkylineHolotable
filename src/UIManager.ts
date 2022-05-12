import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { ModelsControl } from "./UIControls/ModelsControl";

export class UIManager {
  buttons: Button[] = [];

  menus: [Menu, Menu][] = []; // [Table, Wall]
  modelsControl: ModelsControl | undefined;

  constructor() { }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    ProgramManager.getInstance().deleteGroup("buttons");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");

    this.menus.push([
      new Menu(0.8, 0.2, new Vector<3>([-0.4, -1.2, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true),
      new Menu(0.4, 1.5, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false)
    ]);

    const bookmarkManager = new BookmarkManager();
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    this.menus[0][0].addButton(new Button("PreviousBookmark", pos, basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomPrevious()));
    this.menus[0][0].addButton(new Button("NextBookmark", pos, basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomNext()));
    const yLine1 = -1.05;

  
    this.menus[0][0].addButton(new Button("Measurement", pos, basePath + "ui/blank.xpl2", groupId, (buttonId) => ProgramManager.getInstance().userModeManager?.toggleMeasurementMode(buttonId)));
    this.menus[0][0].addButton(new Button("RangeRing", pos, basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleRangeRingMode()));
    this.menus[0][0].addButton(new Button("Artillery", pos, basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("Support by Fire")));
    this.menus[0][0].addButton(new Button("ArtilleryRange", pos, basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("HowitzerWithRangeIndicator")));

    // scale models
    const yLine2 = -1.15
    this.menus[0][0].addButton(new Button("ScaleModelUp", pos, basePath + "ui/plus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(+1)));
    this.menus[0][0].addButton(new Button("ScaleModelDown", pos, basePath + "ui/minus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(-1)));

    // delete selected model
    this.menus[0][0].addButton(new Button("DeleteSelected", pos, basePath + "ui/delete.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.deleteModel()));

    // undo
    this.menus[0][0].addButton(new Button("Undo", pos, basePath + "ui/undo.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.undo()));

    // add line
    this.menus[0][0].addButton(new Button("DrawLine", pos, basePath + "ui/blank.xpl2", groupId, (buttonId) => ProgramManager.getInstance().userModeManager?.toggleDrawLine(buttonId)));

    // model selector
    try {
      this.modelsControl = new ModelsControl();
      this.menus[0][0].addButton(new Button("Model Selector", sgWorld.Creator.CreatePosition(-0.4, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => {
        this.modelsControl?.show(!this.modelsControl.isShown)
      }));

    } catch (error) {
      console.log("Error creating paging control" + error);
    }

    // All of the buttons in the table menu should go into the wall menu in the same order
    for (let button of this.menus[0][0].buttons) {
      this.menus[0][1].addButton(button);
    }
  }

  Draw() {
    for (let [tableMenu, wallMenu] of this.menus) {
      switch (GetDeviceType()) {
        case DeviceType.Desktop: // Desktop renders the table button layout
        case DeviceType.Table:
          tableMenu.Draw();
          break;
        case DeviceType.Wall:
          wallMenu.Draw();
          break;
      }
    }
    this.modelsControl?.Draw()
  }

  Update() {
    for (let [tableMenu, wallMenu] of this.menus) {
      switch (GetDeviceType()) {
        case DeviceType.Desktop: // Desktop updates the table buttons
        case DeviceType.Table:
          tableMenu.Update();
          break;
        case DeviceType.Wall:
          wallMenu.Update();
          break;
      }
    }
    this.modelsControl?.Update()
  }

}
