import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { modelsConfig } from "./config/models";
import { runConsole } from "./Debug";
import { ProgramManager } from "./ProgramManager";
import { ButtonPagingControl } from "./UIControls/ButtonPagingControl";

export class UIManager {
  buttons: Button[] = [];

  constructor() { }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    ProgramManager.getInstance().deleteGroup("buttons");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");

    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2
    const yLine1 = -1.05;
    this.buttons.push(new Button("Sydney", sgWorld.Creator.CreatePosition(-0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.jumpToSydney()));
    this.buttons.push(new Button("Measurement", sgWorld.Creator.CreatePosition(-0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleMeasurementMode()));
    this.buttons.push(new Button("RangeRing", sgWorld.Creator.CreatePosition(-0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleRangeRingMode()));
    this.buttons.push(new Button("Whyalla", sgWorld.Creator.CreatePosition(0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.jumpToWhyalla()));
    this.buttons.push(new Button("Artillery", sgWorld.Creator.CreatePosition(0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("Support by Fire")));
    this.buttons.push(new Button("ArtilleryRange", sgWorld.Creator.CreatePosition(0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("HowitzerWithRangeIndicator")));

    // scale models
    const yLine2 = -1.15
    this.buttons.push(new Button("ScaleModelUp", sgWorld.Creator.CreatePosition(0.4, yLine2, 0.7, 3), basePath + "ui/plus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(+1)));
    this.buttons.push(new Button("ScaleModelDown", sgWorld.Creator.CreatePosition(0.24, yLine2, 0.7, 3), basePath + "ui/minus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(-1)));

    // delete selected model
    this.buttons.push(new Button("DeleteSelected", sgWorld.Creator.CreatePosition(0.08, yLine2, 0.7, 3), basePath + "ui/delete.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.deleteModel()));

    // undo
    this.buttons.push(new Button("Undo", sgWorld.Creator.CreatePosition(-0.08, yLine2, 0.7, 3), basePath + "ui/undo.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.undo()));

    // add line
    this.buttons.push(new Button("DrawLine", sgWorld.Creator.CreatePosition(-0.24, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleDrawLine()));

    try {
      ProgramManager.getInstance().deleteGroup("pager");
      const groupIdPager = ProgramManager.getInstance().getGroupID("pager");
      console.log("ProgramManager:: ButtonPagingControl")
      let pos = sgWorld.Creator.CreatePosition(0, 0, -1000, 3);
      const pagerButtons: Button[] = [];
      modelsConfig.models.forEach(model => {
        const b = new Button("new" + model.modelName, pos, basePath + "ui/blank.xpl2", groupIdPager);
        b.show(false);
        this.buttons.push(b);
        pagerButtons.push(b);
      });

      const pager = new ButtonPagingControl(pagerButtons);

      // I know these really should be part of the paging control, but at the moment buttons have to 
      // exist in the buttons array for them to be clicked so creating them here
      // create the page left and right buttons
      pos = sgWorld.Creator.CreatePosition(-0.4, -0.6, 0.7, 3);
      const pageLeft = new Button("pageLeft", pos, basePath + "ui/blank.xpl2", groupIdPager, () => { pager.pageLeft() });
      pageLeft.show(false);
      pos = sgWorld.Creator.CreatePosition(0.4, -0.6, 0.7, 3);
      const pageRight = new Button("pageRight", pos, basePath + "ui/blank.xpl2", groupIdPager, () => { pager.pageRight(); });
      pageRight.show(false);
      this.buttons.push(pageLeft);
      this.buttons.push(pageRight);
      pager.pagers = [pageLeft, pageRight];

      // Select model
      this.buttons.push(new Button("Model Selector", sgWorld.Creator.CreatePosition(-0.4, yLine2, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => {
        pager.show(!pager.isShown)
      }));

    } catch (error) {
      console.log("Error creating paging control" + error);
    }
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
