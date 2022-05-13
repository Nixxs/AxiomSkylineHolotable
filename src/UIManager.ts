import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { MenuPaging } from "./UIControls/MenuPaging"
import { modelsConfig } from "./config/models";

export class UIManager {

  menus: [Menu, Menu][] = []; // [Table, Wall]
  menusTable: Menu[] = [];
  menusWall: Menu[] = [];

  bookmarkManager = new BookmarkManager();
  polygonId: string = "";

  groupId: string = ""

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

    // tools menu
    const toolsMenuTable = new Menu(0.2, 0.1, new Vector<3>([-0.55, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);
    const toolsMenuWall = new Menu(0.3, 0.2, new Vector<3>([-0.55, -1.15, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);

    toolsMenuTable.createButton("Draw", "add_line.xpl2", (id) => this.onButtonClick("Draw"));
    toolsMenuTable.createButton("Measure", "measure.xpl2", (id) => this.onButtonClick("Measure"));
    toolsMenuTable.createButton("Undo", "undo.xpl2", (id) => this.onButtonClick("Undo"));
    toolsMenuTable.createButton("Delete", "delete.xpl2", (id) => this.onButtonClick("Delete"));
    toolsMenuTable.createButton("ScaleModelUp", "plus.xpl2", (id) => this.onButtonClick("ScaleModelUp"));
    toolsMenuTable.createButton("ScaleModelDown", "minus.xpl2", (id) => this.onButtonClick("ScaleModelDown"));
    toolsMenuTable.createButton("PreviousBookmark", "blank.xpl2", (id) => this.onButtonClick("PreviousBookmark"));
    toolsMenuTable.createButton("NextBookmark", "blank.xpl2", (id) => this.onButtonClick("NextBookmark"));

    this.menusTable.push(toolsMenuTable);
    toolsMenuTable.buttons.forEach(b => toolsMenuWall.addButton(b));
    this.menusWall.push(toolsMenuWall);


    // create the Control measures menu. Doesn't need a width as we are centre aligning it
    const ControlsMenuTable = new MenuPaging(0, 0.1, new Vector<3>([0, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], true, true, true); //new MenuPaging(0.2, 0.1, new Vector<3>([-0.8, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);
    let controls: Button[] = []
    modelsConfig.models.forEach(model => {
      // filter this model?
      controls.push(new Button("new" + model.modelName, sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", this.groupId, () => { this.onControlModelAdd(model) }));
    });
    ControlsMenuTable.addButtons(controls);
    ControlsMenuTable.Draw();
    ControlsMenuTable.show(true)
 
    this.menusTable.push(ControlsMenuTable);

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

  onControlModelAdd(model: { modelName: string; modelType: string; missionType: string; buttonPath: string; modelPath: string; }) {
    throw new Error("Method not implemented.");
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
    this.drawTable()
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
