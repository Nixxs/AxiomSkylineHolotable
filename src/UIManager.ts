import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { runConsole } from "./Debug";
import { ProgramManager } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { ModelsControl } from "./UIControls/ModelsControl";

export class UIManager {
  buttons: Button[] = [];

  constructor() { }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    ProgramManager.getInstance().deleteGroup("buttons");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");

    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2
    const yPos = [-1.05, -1.15]
    const xPos = [-0.4, -0.24, -0.08, 0.08, 0.24, 0.4]

    const bookmarkManager = new BookmarkManager();
    this.buttons.push(new Button("PreviousBookmark", sgWorld.Creator.CreatePosition(xPos[1], yPos[0], 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomPrevious()));
    this.buttons.push(new Button("NextBookmark", sgWorld.Creator.CreatePosition(xPos[0], yPos[0], 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomNext()));

    this.buttons.push(new Button("Measurement", sgWorld.Creator.CreatePosition(xPos[2], yPos[0], 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleMeasurementMode()));
    this.buttons.push(new Button("RangeRing", sgWorld.Creator.CreatePosition(xPos[3], yPos[0], 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleRangeRingMode()));
 
    // model selector
    try {
      const modelsControl = new ModelsControl();

      this.buttons.push(new Button("Model Selector", sgWorld.Creator.CreatePosition(-0.4, yPos[1], 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => {
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

    // scale models
    this.buttons.push(new Button("ScaleModelUp", sgWorld.Creator.CreatePosition(0.4, yPos[1], 0.7, 3), basePath + "ui/plus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(+1)));
    this.buttons.push(new Button("ScaleModelDown", sgWorld.Creator.CreatePosition(0.24, yPos[1], 0.7, 3), basePath + "ui/minus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(-1)));

    // delete selected model
    this.buttons.push(new Button("DeleteSelected", sgWorld.Creator.CreatePosition(0.08, yPos[1], 0.7, 3), basePath + "ui/delete.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.deleteModel()));

    // undo
    this.buttons.push(new Button("Undo", sgWorld.Creator.CreatePosition(-0.08, yPos[1], 0.7, 3), basePath + "ui/undo.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.undo()));

    // add line
    this.buttons.push(new Button("DrawLine", sgWorld.Creator.CreatePosition(-0.24, yPos[1], 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleDrawLine()));


  }

  Draw() {
    for (let button of this.buttons) {
      button.Draw();
    }
  }

  Update() {
    if (ProgramManager.getInstance().getButton1Pressed(1))
      console.log(`Pressed on ${ProgramManager.getInstance().userModeManager?.getCollisionID(1)}`);
    for (let button of this.buttons) {
      ProgramManager.getInstance().setButton1Pressed(1, button.Update(ProgramManager.getInstance().getButton1Pressed(1), ProgramManager.getInstance().userModeManager?.getCollisionID(1)));
    }
  }
}
