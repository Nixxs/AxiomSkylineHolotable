import { sgWorld } from "./Axiom";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";

export class UIManager {
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
    // create the main control menu for each device

    // tools menu
    const toolsMenuTable = new Menu(0.2, 0.1, new Vector<3>([-0.55, -1.15, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);
    const toolsMenuWall = new Menu(0.3, 0.1, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false);

    toolsMenuTable.createButton("Draw", "add_line.xpl2", (id) => this.onButtonClick("Draw"));
    toolsMenuTable.createButton("Measure", "measure.xpl2", (id) => this.onButtonClick("Measure"));
    toolsMenuTable.createButton("Undo", "undo.xpl2", (id) => this.onButtonClick("Undo"));
    toolsMenuTable.createButton("Delete", "delete.xpl2", (id) => this.onButtonClick("Delete"));
    toolsMenuTable.createButton("ScaleModelUp", "plus.xpl2", (id) => this.onButtonClick("ScaleModelUp"));
    toolsMenuTable.createButton("ScaleModelDown", "minus.xpl2", (id) => this.onButtonClick("ScaleModelDown"));
    toolsMenuTable.createButton("PreviousBookmark", "blank.xpl2", (id) => this.onButtonClick("PreviousBookmark"));
    toolsMenuTable.createButton("NextBookmark", "blank.xpl2", (id) => this.onButtonClick("NextBookmark"));

    for (let button of toolsMenuTable.buttons)
      toolsMenuWall.addButton(button);

    this.menusTable.push(toolsMenuTable);
    this.menusWall.push(toolsMenuWall);
  }

  drawTable() {
    this.drawDevice(new Vector<3>([-0.6, 0, 0.625]), new Vector<3>([0.6, -1.2, 0.625]));
  }

  drawDevice(min: Vector<3>, max: Vector<3>) {
    if (GetDeviceType() !== DeviceType.Desktop) {
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

  onButtonClick(name: string) {
    console.log("onButtonClick")
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

  Draw() {
    switch (GetDeviceType()) {
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
