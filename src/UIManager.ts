import { basePath, sgWorld, sessionManager } from "./Axiom";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord, worldToRoomCoord, setFilmMode } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { MenuPaging } from "./UIControls/MenuPaging"
import { controlConfig } from "./config/ControlModels";
import { orbatConfig } from "./config/OrbatModels";
import { Button, SimulateSelectedButton } from "./Button";
import { verbsConfig } from "./config/verbs";
import { MenuVerbs } from "./UIControls/MenuVerbs";

export class UIManager {
  menusTable: Menu[] = [];
  menusWall: Menu[] = [];

  bookmarkManager = new BookmarkManager();
  polygonId: string = "";

  groupId: string = ""
  modelId: string = "";

  wallLs: number = -1; // left hand side for wall buttons
  wallPos: number = -0.2; // distance out from wall

  private orbatScaleFactor: number;

  constructor() {
    this.orbatScaleFactor = 1.2;
  }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    document.getElementById("filmMode")?.addEventListener("change", e => {
      if (!(e.currentTarget instanceof HTMLInputElement))
        throw new Error("Expected #filmMode to be a checkbox");
      setFilmMode(e.currentTarget.checked);
    });
    document.getElementById("simulate")?.addEventListener("click", SimulateSelectedButton);
    ProgramManager.getInstance().deleteGroup("buttons");
    ProgramManager.getInstance().deleteGroup("models");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");
    this.groupId = groupId;
    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2

    this.createMenus();
  }

  createMenus() {
    // create the main control menu. Each menu must be replicated twice, once for wall once for table
    // tools menu ============
    const toolsMenuTable = new Menu(0.2, 0.1, new Vector<3>([-0.5, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true, 0.05);
    // LR, FB, UD. Bottom left corner around -1.2, -0.5
    const wallLhs = this.wallLs;
    const wallPos = this.wallPos;; // distance out from wall
    const toolsMenuWall = new Menu(0.4, 0.4, new Vector<3>([wallLhs, wallPos, 0.8]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, 0.06);

    toolsMenuTable.createButton("Draw", "add_line.xpl2", (id) => this.onButtonClick("Draw"), "Draw Line");
    toolsMenuTable.createButton("Measure", "measure.xpl2", (id) => this.onButtonClick("Measure"), "Measure");
    toolsMenuTable.createButton("Undo", "undo.xpl2", (id) => this.onButtonClick("Undo"), "Undo");
    toolsMenuTable.createButton("Delete", "delete.xpl2", (id) => this.onButtonClick("Delete"), "Delete");
    toolsMenuTable.createButton("ScaleModelUp", "plus.xpl2", (id) => this.onButtonClick("ScaleModelUp"), "Scale up model");
    toolsMenuTable.createButton("ScaleModelDown", "minus.xpl2", (id) => this.onButtonClick("ScaleModelDown"),  "Scale down model");
    toolsMenuTable.createButton("PreviousBookmark", "BUTTON_Bookmark_Prev.xpl2", (id) => this.onButtonClick("PreviousBookmark"), "Next location");
    toolsMenuTable.createButton("NextBookmark", "BUTTON_Bookmark_Next.xpl2", (id) => this.onButtonClick("NextBookmark"), "Previous location");

    toolsMenuTable.buttons.forEach(b => toolsMenuWall.addButton(b));

    this.menusTable.push(toolsMenuTable);
    this.menusWall.push(toolsMenuWall);


    // orbat menu ============
    const orbatMenuTable = new Menu(0.04, 0.3, new Vector<3>([-0.5, -1.05, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05,);
    // LR, FB, UD. Bottom left corner around -1.3, -0.5, 0.5
    // const orbatMenuWall = new Menu(0.4, 0.4, new Vector<3>([-1.3, -0.5, 0.5]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false, 0.06);
    //const toolsMenuWall = new Menu(0.4, 0.4, new Vector<3>([-1.3, -0.5, 0.5]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, false, false, 0.06);
    const orbatMenuWall = new Menu(0.4, 0.4, new Vector<3>([wallLhs, wallPos, 1]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, 0.06);
    orbatMenuWall.rows = 4;
    orbatMenuWall.cols = 1
    orbatConfig.OrbatModels.forEach((model, i) => {
      orbatMenuTable.createButton(model.modelName, model.buttonIcon, () => this.onOrbatModelAdd(model));
    });

    this.menusTable.push(orbatMenuTable);
    orbatMenuTable.buttons.forEach(b => orbatMenuWall.addButton(b));
    this.menusWall.push(orbatMenuWall);

    // create the verb menu
    const VerbsMenuTable = new MenuVerbs(0.04, 0.6, new Vector<3>([-0.36, -1.1, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], true, true, true, 0.05, 10, 1);
    const VerbsMenuWall = new MenuVerbs(0.04, 0.1, new Vector<3>([wallLhs + 0.15, wallPos, 1]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, 0.06, 8, 1);
    VerbsMenuTable.show(false);
    VerbsMenuWall.show(false);
    this.menusTable.push(VerbsMenuTable);
    this.menusWall.push(VerbsMenuWall);

    // show hide verbs menus
    const showVerbsTable = new Menu(0.04, 0.2, new Vector<3>([-0.45, -1.05, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05);
    const showVerbsWall = new Menu(0.04, 0.2, new Vector<3>([wallLhs + 0.06, wallPos, 1]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, 0.06);

    showVerbsTable.createButton("TaskVerbs", "BUTTON_Task_Verb.xpl2", () => {
      this.onVerbMenuShow("TaskVerb", [VerbsMenuTable, VerbsMenuWall])
    }, "Task Verbs")
    showVerbsTable.createButton("MissionTaskVerbs", "BUTTON_Mission_Verb.xpl2", () => {
      this.onVerbMenuShow("MissionTaskVerb", [VerbsMenuTable, VerbsMenuWall])
    }, "Mission Task Verbs");
    showVerbsWall.createButton("TaskVerbs", "BUTTON_Task_Verb.xpl2", () => {
      this.onVerbMenuShow("TaskVerb", [VerbsMenuTable, VerbsMenuWall])
    }, "Task Verbs")
    showVerbsWall.createButton("MissionTaskVerbs", "BUTTON_Mission_Verb.xpl2", () => {
      this.onVerbMenuShow("MissionTaskVerb", [VerbsMenuTable, VerbsMenuWall])
    }, "Mission Task Verbs");
    this.menusTable.push(showVerbsTable);
    this.menusWall.push(showVerbsWall);

    this.createControlMeasuresMenu();
  }

  onVerbAdd(verb: { verbName: string; verbType: string; }, menus: MenuVerbs[]): void {
    menus.forEach(m => m.show(false));
    const pm = ProgramManager.getInstance().userModeManager;
    pm?.toggleLabel(verb.verbName);
  }

  private createControlMeasuresMenu() {

    // 4 buttons. black for control measures, red, blue green task measures, 

    // control measures menu ============
    const ControlsMenuTable = new MenuPaging(0.04, 0.1, new Vector<3>([-0.15, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], false, true, false, 0.05, 2, 10);
    const ControlsMenuWall = new MenuPaging(0.04, 1, new Vector<3>([this.wallLs + 0.5, this.wallPos, 0.8]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, true, 0.06, 2, 10);

    ControlsMenuTable.show(false);
    ControlsMenuWall.show(false);
    this.menusTable.push(ControlsMenuTable);
    this.menusWall.push(ControlsMenuWall);

    const menus = [ControlsMenuTable, ControlsMenuWall];
    // show hide verbs menus
    const showControlsTable = new Menu(0.04, 0.2, new Vector<3>([-0.3, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05, 2, 2);
    const showControlsWall = new Menu(0.04, 0.2, new Vector<3>([this.wallLs + 0.3, this.wallPos, 0.8]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, 0.06, 2, 2);


    showControlsTable.createButton("controlMeasures", "Button_CM_Green.xpl2", () => { this.onShowControlMeasures("controlMeasure", "black", menus) }, "Control Measures");
    showControlsTable.createButton("taskIndicatorsBlue", "Button_TM.xpl2", () => { this.onShowControlMeasures("taskIndicator", "blue", menus) }, "Task Indicators");
    showControlsTable.createButton("taskIndicatorsRed", "Button_TM.xpl2", () => { this.onShowControlMeasures("taskIndicator", "red", menus) }, "Task Indicators");
    showControlsTable.createButton("taskIndicatorsGreen", "Button_TM.xpl2", () => { this.onShowControlMeasures("taskIndicator", "green", menus) }, "Task Indicators");


    showControlsTable.buttons.forEach(b => showControlsWall.addButton(b));
    this.menusTable.push(showControlsTable);
    this.menusWall.push(showControlsWall);

  }

  onShowControlMeasures(controlType: string, color: string, menus: MenuPaging[]) {
    console.log(`show menu ${controlType} ${color}`);

    const getMenu = () => {
      const [ControlsMenuTable, ControlsMenuWall] = menus;
      switch (this.GetDeviceTypeOverride()) {
        case DeviceType.Desktop:
        case DeviceType.Table:
          return ControlsMenuTable
        case DeviceType.Wall:
          return ControlsMenuWall;
      }
    }

    const currentMenu = getMenu();
    if (currentMenu.isVisible) {
      currentMenu.show(false);
      return;
    }

    const controls: Button[] = [];
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const groupId = ProgramManager.getInstance().getGroupID("buttons");

    controlConfig.ControlModels.forEach((model) => {
      if (model.modelType === controlType) {
        // some weird logic here... if its blue or red then add the black models too.
        if (model.Black === 1 && color !== "green" ) {
          const buttonRGBA = ProgramManager.getInstance().userModeManager!.getColorFromString("black", 150);
          const btn = new Button(model.modelName, pos, basePath + "ui/" + model.buttonIcon, groupId, () => this.onControlModelAdd(model, "black"), false, model.modelName, buttonRGBA)
          controls.push(btn);
        }
        if (color === "blue" && model.Blue || color === "red" && model.Red || color === "green" && model.Green) {
          const buttonRGBA = ProgramManager.getInstance().userModeManager!.getColorFromString(color, 150);
          const btn = new Button(model.modelName, pos, basePath + "ui/" + model.buttonIcon, groupId, () => this.onControlModelAdd(model, color), false, model.modelName, buttonRGBA)
          controls.push(btn);
        }
      }
    });

    controls.sort((a, b) => a.tooltip < b.tooltip ? -1 : 0 );

    currentMenu.addButtons(controls);
  }

  onVerbMenuShow(verbType: string, menus: MenuVerbs[]) {
    try {
      let VerbsMenuTable = menus[0];
      let VerbsMenuWall = menus[1];
      if (VerbsMenuTable.isVisible) { // turn it off
        console.log("turn it off")
        VerbsMenuTable.show(false);
        VerbsMenuWall.show(false);
        return;
      }
      let verbControlsTable: Button[] = [];
      let verbControlsWall: Button[] = [];
      verbsConfig.verbs.forEach((verb) => {
        if (verb.verbType === verbType) {
          verbControlsTable.push(VerbsMenuTable.createButton(verb.verbName, "blank.xpl2", () => this.onVerbAdd(verb, [VerbsMenuTable, VerbsMenuWall])));
          verbControlsWall.push(VerbsMenuWall.createButton(verb.verbName, "blank.xpl2", () => this.onVerbAdd(verb, [VerbsMenuTable, VerbsMenuWall])));
        }
      });
      switch (this.GetDeviceTypeOverride()) {
        case DeviceType.Desktop:
        case DeviceType.Table:
          VerbsMenuTable.addButtons(verbControlsTable);
          break;
        case DeviceType.Wall:
          VerbsMenuWall.addButtons(verbControlsWall);
          break;
      }
    } catch (error) {
      console.log(JSON.stringify(error));
    }
  }

  drawTable() {
    this.drawDevice(new Vector<3>([-0.6, 0, 0.625]), new Vector<3>([0.6, -1.2, 0.625]));
  }

  drawDevice(min: Vector<3>, max: Vector<3>) {
    if (this.GetDeviceTypeOverride() !== DeviceType.Desktop) {
      throw new Error("Attempted to draw device while not on desktop");
    }
    const minXY = sgWorld.Creator.CreatePosition(min.data[0], min.data[1], min.data[2], 3);
    const maxXY = sgWorld.Creator.CreatePosition(max.data[0], max.data[1], max.data[2], 3);
    const minXY2 = roomToWorldCoord(minXY);
    const maxXY2 = roomToWorldCoord(maxXY);
    const cVerticesArray = [
      minXY2.X, minXY2.Y, minXY2.Altitude,
      minXY2.X, maxXY2.Y, maxXY2.Altitude,
      maxXY2.X, maxXY2.Y, maxXY2.Altitude,
      maxXY2.X, minXY2.Y, minXY2.Altitude,
      minXY2.X, minXY2.Y, minXY2.Altitude,
    ];
    const cRing = sgWorld.Creator.GeometryCreator.CreateLinearRingGeometry(cVerticesArray);
    const cPolygonGeometry = sgWorld.Creator.GeometryCreator.CreatePolygonGeometry(cRing, null);
    const nLineColor = 0xFF00FF00; // Abgr value -> solid green

    const nFillColor = 0x7FFF0000; // Abgr value -> 50% transparent blue

    const eAltitudeTypeCode = 3; //AltitudeTypeCode.ATC_TERRAIN_RELATIVE;
    // D2. Create polygon

    if (this.polygonId) {
      const poly: ITerrainPolygon = sgWorld.Creator.GetObject(this.polygonId) as ITerrainPolygon;
      poly.geometry = cPolygonGeometry;
    } else {
      const polygon = sgWorld.Creator.CreatePolygon(cPolygonGeometry, nLineColor, nFillColor, eAltitudeTypeCode, this.groupId, "Table");
      this.polygonId = polygon.ID;
    }
  }

  drawWall() {
    this.drawDevice(new Vector<3>([-1.78, 0, 0]), new Vector<3>([1.78, 0, 2]));
  }

  private onButtonClick(name: string) {
    console.log("onButtonClick " + name)
    const pm = ProgramManager.getInstance().userModeManager;
    if (pm === undefined) throw new Error("Could not find userModeManager");
    switch (name) {
      case "NextBookmark":
        this.bookmarkManager.ZoomNext();
        break;
      case "PreviousBookmark":
        this.bookmarkManager.ZoomPrevious();
        break;
      case "Draw":
        pm.toggleDrawLine()
        break;
      case "Measure":
        pm.toggleMeasurementMode();
        break;
      case "Undo":
        pm.undo();
        break;
      case "Delete":
        pm.deleteModel();
        break;
      case "ScaleModelUp":
        pm.scaleModel(+1);
        break;
      case "ScaleModelDown":
        pm.scaleModel(-1);
        break;
    }
  }

  onControlModelAdd(model: { modelName: string; modelType: string; buttonIcon: string; modelPath: string; }, color: string) {
    const pm = ProgramManager.getInstance().userModeManager;
    pm?.toggleModelMode(model.modelPath, model.modelName, color)
  }

  onOrbatModelAdd(model: { modelName: string; modelType: string; missionType: string; forceType: string; buttonIcon: string; models: { modelFile: string, modelName: string; }[]; }): void {
    // add the orbat model to world space in the centre of the screen
    const modelsToPlace: ITerrainModel[] = [];
    const grp = ProgramManager.getInstance().getCollaborationFolderID("models");
    model.models.forEach((orbatModel, i) => {
      const x = Math.floor(i / 6);
      const y = i % 6;
      let xspacing = 0.2;
      let yspacing = 0.12;
      if (model.forceType === "enemy") {
        xspacing = 0.1;
        yspacing = 0.13;
      }
      const pos = sgWorld.Creator.CreatePosition(-0.2 + (x * xspacing), -0.4 - (y * yspacing), 0.7, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);
      const roomPos = roomToWorldCoord(pos);
      const modelPath = basePath + `model/${orbatModel.modelFile}`;

      try {
        const modelObject = sgWorld.Creator.CreateModel(roomPos, modelPath, 1, 0, grp, orbatModel.modelName);
        // add the created model to the undo list
        ProgramManager.getInstance().userModeManager?.lineObjects.push(modelObject.ID);
        // set the scale value based on the current zoom level
        var scaleValue = roomPos.Altitude * this.orbatScaleFactor;
        modelObject.ScaleFactor = scaleValue;
        modelsToPlace.push(modelObject);
      } catch {
        console.log("could not add model: " + modelPath);
      }

      // this is to tint models on the way in
      // if (model.forceType === "enemy"){
      //   var redRGBA = ProgramManager.getInstance().userModeManager?.redRGBA;
      //   if (redRGBA !== undefined){
      //     modelObject.Terrain.Tint = sgWorld.Creator.CreateColor(redRGBA[0], redRGBA[1], redRGBA[2], redRGBA[3]);
      //   }
      // } else {
      //   var blueRGBA = ProgramManager.getInstance().userModeManager?.blueRGBA;
      //   if (blueRGBA !== undefined){
      //     modelObject.Terrain.Tint = sgWorld.Creator.CreateColor(blueRGBA[0], blueRGBA[1], blueRGBA[2], blueRGBA[3]);
      //   }
      // }
    });

  }

  Draw() {
    switch (this.GetDeviceTypeOverride()) {
      case DeviceType.Desktop:
        this.drawTable()
      // Fallthrough. Desktop renders the table button layout
      case DeviceType.Table:
        this.menusTable.forEach(m => m.Draw());
        break;

      case DeviceType.Wall:
        this.menusWall.forEach(m => m.Draw());
        break;
    }
  }

  GetDeviceTypeOverride() {
    return GetDeviceType();
    if (GetDeviceType() === DeviceType.Desktop) {
      return DeviceType.Wall;
    }
    return GetDeviceType();
  }

  Update() {
    switch (this.GetDeviceTypeOverride()) {
      case DeviceType.Desktop: // Desktop updates the table buttons
      case DeviceType.Table:
        this.menusTable.forEach(m => m.Update());
        break;

      case DeviceType.Wall:
        this.menusWall.forEach(m => m.Update());
        break;
    }
  }
}
