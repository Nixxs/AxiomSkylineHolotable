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
  menusTable: Menu[] = [];
  menusWall: Menu[] = [];

  constructor() { }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    ProgramManager.getInstance().deleteGroup("buttons");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");

    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2

    this.menus.push([
      new Menu(0.8, 0.2, new Vector<3>([-0.4, -1.2, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true),
      new Menu(0.4, 1.5, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false)
    ]);

    const bookmarkManager = new BookmarkManager();
    this.menus[0][0].addButton(new Button("PreviousBookmark", sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomPrevious()));
    this.menus[0][0].addButton(new Button("NextBookmark", sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomNext()));
    const yLine1 = -1.05;

    this.menus[0][0].addButton(new Button("Measurement", sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleMeasurementMode()));
    this.menus[0][0].addButton(new Button("RangeRing", sgWorld.Creator.CreatePosition(-0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleRangeRingMode()));
    this.menus[0][0].addButton(new Button("Artillery", sgWorld.Creator.CreatePosition(0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("Support by Fire")));
    this.menus[0][0].addButton(new Button("ArtilleryRange", sgWorld.Creator.CreatePosition(0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("HowitzerWithRangeIndicator")));

    // scale models
    this.menus[0][0].addButton(new Button("ScaleModelUp", sgWorld.Creator.CreatePosition(0.4, 0, 0.7, 3), basePath + "ui/plus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(+1)));
    this.menus[0][0].addButton(new Button("ScaleModelDown", sgWorld.Creator.CreatePosition(0.24, 0, 0.7, 3), basePath + "ui/minus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(-1)));

    // delete selected model
    this.menus[0][0].addButton(new Button("DeleteSelected", sgWorld.Creator.CreatePosition(0.08, 0, 0.7, 3), basePath + "ui/delete.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.deleteModel()));

    // undo
    this.menus[0][0].addButton(new Button("Undo", sgWorld.Creator.CreatePosition(-0.08, 0, 0.7, 3), basePath + "ui/undo.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.undo()));

    // add line
    this.menus[0][0].addButton(new Button("DrawLine", sgWorld.Creator.CreatePosition(-0.24, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleDrawLine()));

    // model selector
    try {
      const modelsControl = new ModelsControl();

      this.menus[0][0].addButton(new Button("Model Selector", sgWorld.Creator.CreatePosition(-0.4, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => {
        modelsControl.show(!modelsControl.isShown)
      }));

      modelsControl.on("onShow", (b) => {
        // do we want to hide the bottom buttons at this point?
        console.log("modelsControl:: onShow" + b)
      })
      // // we have to put all the buttons into the buttons of the UI control as this manages the click of the buttons
      this.buttons.push(...modelsControl.buttons)
    } catch (error) {
      console.log("Error creating paging control" + error);
    }

    // All of the buttons in the table menu should go into the wall menu in the same order
    for (let button of this.menus[0][0].buttons) {
      this.menus[0][1].addButton(button);
    }
  }

  createMenus(){
    // create the main control menu. Each menu must be replicated twice, once for wall once for table

    // tools menu
    const toolsMenuTable = new Menu(0.8, 0.2, new Vector<3>([-0.4, -1.2, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);
    const toolsMenuWall = new Menu(0.8, 0.2, new Vector<3>([-0.4, -1.2, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);

    toolsMenuTable.createButton("Draw", "blank.xpl2", ()=>{})

    this.menusTable.push(toolsMenuTable);
    this.menusWall.push(toolsMenuWall);

    

  }

  Draw() {
    for (let button of this.buttons) {
      button.Draw();
    }
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
  }

  Update() {
    for (let button of this.buttons) {
      button.Update();
    }
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
  }
}
