import { basePath, sgWorld } from "./Axiom";
import { Button } from "./Button";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { ModelsControl } from "./UIControls/ModelsControl";

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
    return; 

    // this.menus.push([
    //   new Menu(0.8, 0.2, new Vector<3>([-0.4, -1.2, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true),
    //   new Menu(0.4, 1.5, new Vector<3>([-1, -0.1, 0.25]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false)
    // ]);

    // const bookmarkManager = new BookmarkManager();
    // this.menus[0][0].addButton(new Button("PreviousBookmark", sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomPrevious()));
    // this.menus[0][0].addButton(new Button("NextBookmark", sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => bookmarkManager.ZoomNext()));
    // const yLine1 = -1.05;

    // this.menus[0][0].addButton(new Button("Measurement", sgWorld.Creator.CreatePosition(0, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleMeasurementMode()));
    // this.menus[0][0].addButton(new Button("RangeRing", sgWorld.Creator.CreatePosition(-0.08, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleRangeRingMode()));
    // this.menus[0][0].addButton(new Button("Artillery", sgWorld.Creator.CreatePosition(0.24, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("Support by Fire")));
    // this.menus[0][0].addButton(new Button("ArtilleryRange", sgWorld.Creator.CreatePosition(0.4, yLine1, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleModelMode("HowitzerWithRangeIndicator")));

    // // scale models
    // this.menus[0][0].addButton(new Button("ScaleModelUp", sgWorld.Creator.CreatePosition(0.4, 0, 0.7, 3), basePath + "ui/plus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(+1)));
    // this.menus[0][0].addButton(new Button("ScaleModelDown", sgWorld.Creator.CreatePosition(0.24, 0, 0.7, 3), basePath + "ui/minus.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.scaleModel(-1)));

    // // delete selected model
    // this.menus[0][0].addButton(new Button("DeleteSelected", sgWorld.Creator.CreatePosition(0.08, 0, 0.7, 3), basePath + "ui/delete.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.deleteModel()));

    // // undo
    // this.menus[0][0].addButton(new Button("Undo", sgWorld.Creator.CreatePosition(-0.08, 0, 0.7, 3), basePath + "ui/undo.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.undo()));

    // // add line
    // this.menus[0][0].addButton(new Button("DrawLine", sgWorld.Creator.CreatePosition(-0.24, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => ProgramManager.getInstance().userModeManager?.toggleDrawLine()));

    // // model selector
    // try {
    //   const modelsControl = new ModelsControl();

    //   this.menus[0][0].addButton(new Button("Model Selector", sgWorld.Creator.CreatePosition(-0.4, 0, 0.7, 3), basePath + "ui/blank.xpl2", groupId, () => {
    //     modelsControl.show(!modelsControl.isShown)
    //   }));

    //   modelsControl.on("onShow", (b) => {
    //     // do we want to hide the bottom buttons at this point?
    //     console.log("modelsControl:: onShow" + b)
    //   })
    //   // // we have to put all the buttons into the buttons of the UI control as this manages the click of the buttons
    // } catch (error) {
    //   console.log("Error creating paging control" + error);
    // }

    // // All of the buttons in the table menu should go into the wall menu in the same order
    // for (let button of this.menus[0][0].buttons) {
    //   this.menus[0][1].addButton(button);
    // }
  }

  createMenus() {
    // create the main control menu. Each menu must be replicated twice, once for wall once for table

    // tools menu
    const toolsMenuTable = new Menu(0.2, 0.1, new Vector<3>([-0.55, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);
    const toolsMenuWall = new Menu(0.3, 0.2, new Vector<3>([-0.55, -1.15, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], true, true, true);

    toolsMenuTable.createButton("Draw", "blank.xpl2", (id) => this.onButtonClick("Draw"));
    toolsMenuTable.createButton("Measure", "blank.xpl2", (id) => this.onButtonClick("Measure"));
    toolsMenuTable.createButton("Undo", "undo.xpl2", (id) => this.onButtonClick("Undo"));
    toolsMenuTable.createButton("Delete", "delete.xpl2", (id) => this.onButtonClick("Delete"));
    toolsMenuTable.createButton("ScaleModelUp", "plus.xpl2", (id) => this.onButtonClick("ScaleModelUp"));
    toolsMenuTable.createButton("ScaleModelDown", "minus.xpl2", (id) => this.onButtonClick("ScaleModelDown"));
    toolsMenuTable.createButton("PreviousBookmark", "blank.xpl2", (id) => this.onButtonClick("PreviousBookmark"));
    toolsMenuTable.createButton("NextBookmark", "blank.xpl2", (id) => this.onButtonClick("NextBookmark"));

    this.menusTable.push(toolsMenuTable);
    this.menusWall.push(toolsMenuWall);

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

  onButtonClick(name: string) {
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
