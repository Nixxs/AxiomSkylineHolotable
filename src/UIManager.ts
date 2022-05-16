import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord, worldToRoomCoord } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { MenuPaging } from "./UIControls/MenuPaging"
import { controlConfig } from "./config/ControlModels";
import { orbatConfig } from "./config/OrbatModels";

export class UIManager {

  menus: [Menu, Menu][] = []; // [Table, Wall]
  menusTable: Menu[] = [];
  menusWall: Menu[] = [];

  bookmarkManager = new BookmarkManager();
  polygonId: string = "";

  groupId: string = ""
  modelId: string = "";

  constructor() { }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    ProgramManager.getInstance().deleteGroup("buttons");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");
    this.groupId = groupId;
    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2

    this.createMenus();

  }

  createMenus() {
    // create the main control menu. Each menu must be replicated twice, once for wall once for table
    // tools menu ============
    const toolsMenuTable = new Menu(0.2, 0.1, new Vector<3>([-0.55, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true, 0.05);
    const toolsMenuWall = new Menu(0.2, 0.1, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false, 0.05);

    toolsMenuTable.createButton("Draw", "add_line.xpl2", (id) => this.onButtonClick("Draw"));
    toolsMenuTable.createButton("Measure", "measure.xpl2", (id) => this.onButtonClick("Measure"));
    toolsMenuTable.createButton("Undo", "undo.xpl2", (id) => this.onButtonClick("Undo"));
    toolsMenuTable.createButton("Delete", "delete.xpl2", (id) => this.onButtonClick("Delete"));
    toolsMenuTable.createButton("ScaleModelUp", "plus.xpl2", (id) => this.onButtonClick("ScaleModelUp"));
    toolsMenuTable.createButton("ScaleModelDown", "minus.xpl2", (id) => this.onButtonClick("ScaleModelDown"));
    toolsMenuTable.createButton("PreviousBookmark", "blank.xpl2", (id) => this.onButtonClick("PreviousBookmark"));
    toolsMenuTable.createButton("NextBookmark", "blank.xpl2", (id) => this.onButtonClick("NextBookmark"));

    toolsMenuTable.buttons.forEach(b => toolsMenuWall.addButton(b));

    this.menusTable.push(toolsMenuTable);
    this.menusWall.push(toolsMenuWall);


    // control measures menu ============
    // create the Control measures menu. Doesn't need a width as we are centre aligning it
    const ControlsMenuTable = new MenuPaging(0, 0.1, new Vector<3>([0, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], true, true, true, 0.05);
    const ControlsMenuWall = new Menu(0, 0.1, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false, 0.05);
    let controls: Button[] = []
    controlConfig.ControlModels.forEach((model) => {
      controls.push(ControlsMenuTable.createButton(model.modelName, model.buttonIcon, ()=> this.onControlModelAdd(model)));
    });
    ControlsMenuTable.addButtons(controls);
    ControlsMenuTable.buttons.forEach(b => ControlsMenuWall.addButton(b));
    
    this.menusTable.push(ControlsMenuTable);
    this.menusWall.push(ControlsMenuWall);


    // orbat menu ============
    // why is this 0.005 out? Is that the 10% padding on the button? 
    const orbatMenuTable = new Menu(0, 0.2, new Vector<3>([-0.555, -1.0, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05);
    const orbatMenuWall = new Menu(0, 0.2, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, 0.05);
    controls = []
    orbatConfig.OrbatModels.forEach((model, i) => {
      orbatMenuTable.createButton(model.modelName,  model.buttonIcon, () => this.onOrbatModelAdd(model));
    });

   
    orbatMenuTable.buttons.forEach(b => orbatMenuWall.addButton(b));

    this.menusTable.push(orbatMenuTable);
    this.menusWall.push(orbatMenuWall);

  }

  drawTable() {

    if (GetDeviceType() !== DeviceType.Desktop) {
      return;
    }

    let minXY = sgWorld.Creator.CreatePosition(-0.6, 0, 0.69, 3);
    let maxXY = sgWorld.Creator.CreatePosition(0.6, -1.2, 0.69, 3);
    let minXY2 = roomToWorldCoord(minXY);
    let maxXY2 = roomToWorldCoord(maxXY);
    var cVerticesArray = [
      minXY2.X, minXY2.Y, minXY2.Altitude,
      minXY2.X, maxXY2.Y, minXY2.Altitude,
      maxXY2.X, maxXY2.Y, minXY2.Altitude,
      maxXY2.X, minXY2.Y, minXY2.Altitude,
      minXY2.X, minXY2.Y, minXY2.Altitude,
    ];
    var cRing = sgWorld.Creator.GeometryCreator.CreateLinearRingGeometry(cVerticesArray);
    var cPolygonGeometry = sgWorld.Creator.GeometryCreator.CreatePolygonGeometry(cRing, null);
    var nLineColor = 0xFF00FF00; // Abgr value -> solid green

    var nFillColor = 0x7FFF0000; // Abgr value -> 50% transparent blue

    var eAltitudeTypeCode = 3; //AltitudeTypeCode.ATC_TERRAIN_RELATIVE;
    // D2. Create polygon

    if (this.polygonId) {
      const poly: ITerrainPolygon = sgWorld.Creator.GetObject(this.polygonId) as ITerrainPolygon;
      poly.geometry = cPolygonGeometry;
    } else {
      const polygon = sgWorld.Creator.CreatePolygon(cPolygonGeometry, nLineColor, nFillColor, eAltitudeTypeCode, this.groupId, "Table");
      this.polygonId = polygon.ID;
    }

  }

  private onButtonClick(name: string) {
    console.log("onButtonClick")
    const pm = ProgramManager.getInstance().userModeManager;
    if (!pm) return;
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

  onControlModelAdd(model: { modelName: string; modelType: string; missionType: string; buttonIcon: string; modelPath: string; }) {
   console.log("Method not implemented.");
  }

  onOrbatModelAdd(model: { modelName: string; modelType: string; missionType: string; buttonIcon: string; models: { modelFile: string, modelName: string; }[]; }): void {
    // add the orbat model to world space in the centre of the screen
    const modelsToPlace: ITerrainModel[] = [];
    model.models.forEach((orbatModel, i) =>{
      const pos = sgWorld.Creator.CreatePosition(-0.05, -0.6, 0.7, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);
      const roomPos = roomToWorldCoord(pos);
      const modelPath = basePath + `model/${orbatModel.modelFile}`;
      const model = sgWorld.Creator.CreateModel(roomPos, modelPath, 1, 0, "", orbatModel.modelName);
      model.ScaleFactor = 0.0005;
      modelsToPlace.push(model);
    });
    this.placeModelsCenterRoom(modelsToPlace)
  }

  private placeModelsCenterRoom(models: ITerrainModel[]){
    models.forEach((m, i) =>{
      const pos = sgWorld.Creator.CreatePosition(-0.05, -0.6 - (i * 0.05), 0.7, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);
      const roomPos = roomToWorldCoord(pos);
      m.Position = roomPos;
    })
  }


  Draw() {
    switch (GetDeviceType()) {
      case DeviceType.Desktop: // Desktop renders the table button layout
      case DeviceType.Table:
        this.menusTable.forEach(m => m.Draw());
        break;
      case DeviceType.Wall:
        this.menusWall.forEach(m => m.Draw());
        break;
    }
    this.drawTable();
  }

  Update() {
    switch (GetDeviceType()) {
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
