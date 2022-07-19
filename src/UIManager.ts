import { basePath, sgWorld } from "./Axiom";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord, setFilmMode, GetObject, GetItemIDByName } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { MenuPaging } from "./UIControls/MenuPaging"
import { controlConfig } from "./config/ControlModels";
import { IOrbatMenuItem, IOrbatSubMenuItem, orbatConfig } from "./config/OrbatModels";
import { Button, SimulateSelectedButton } from "./Button";
import { verbsConfig } from "./config/verbs";
import { MenuVerbs } from "./UIControls/MenuVerbs";
import { UserMode } from "./UserManager";
import { ButtonModel } from "./UIControls/ButtonModel";
import { bookmarksConfig } from "./config/bookmarks";
import { FixedSizeArray } from "./math/fixedSizeArray";

export class UIManager {
  menusTable: Menu[] = [];
  menusWall: Menu[] = [];

  bookmarkManager = new BookmarkManager();
  polygonId: string = "";

  groupId: string = ""
  modelId: string = "";

  wallLs: number = -1; // left hand side for wall buttons
  wallPos: number = -0.3; // distance out from wall
  buttonSizeWAll = 0.1;

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
    ProgramManager.getInstance().deleteGroup("drawings");
    const groupId = ProgramManager.getInstance().getGroupID("buttons");
    this.groupId = groupId;
    // the table has an origin at the top centre of the table. minX = -0.6 maxX = 0.6. minY = 0 maxY = -1.2

    this.createMenus();

    // when we start the app ensure we are pointing true north (yaw = 0) and with a tilt
    const currentPos = sgWorld.Navigate.GetPosition(AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);
    const tilt = this.GetDeviceTypeOverride() === DeviceType.Desktop ? -37 : -50; // desktop needs a higher tilt to see the table
    // todo DW test this is ok on the wall?
    const pos = sgWorld.Creator.CreatePosition(currentPos.X, currentPos.Y, currentPos.Altitude, currentPos.AltitudeType, 0, tilt, 0, currentPos.Distance);
    sgWorld.Navigate.JumpTo(pos);

  }

  createMenus() {
    // create the main control menu. Each menu must be replicated twice, once for wall once for table

    // LR, FB, UD. Bottom left corner around -1.2, -0.5
    const wallLhs = this.wallLs;
    const wallPos = this.wallPos;; // distance out from wall

    // create a sub menu for the bookmarks.
    const BookmarksMenuTable = new MenuVerbs(0.04, 0.6, new Vector<3>([-0.36, -1.1, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], false, true, true, 0.05, 10, 1);
    const BookmarksMenuWall = new MenuVerbs(0.04, 0.1, new Vector<3>([wallLhs + 0.35, wallPos, 0.9]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, true, this.buttonSizeWAll, 8, 1);
    const bookmarkMenus = [BookmarksMenuTable, BookmarksMenuWall];
    bookmarkMenus.forEach(m => m.show(false));
    this.menusTable.push(BookmarksMenuTable);
    this.menusWall.push(BookmarksMenuWall);

    // tools menu ============
    const toolsMenuTable = new Menu(0.2, 0.1, new Vector<3>([-0.5, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, true, 0.05, 2, 4);
    const toolsMenuWall = new Menu(0.4, 1, new Vector<3>([wallLhs, wallPos, 0.7]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, true, this.buttonSizeWAll);
    toolsMenuWall.rows = 2;
    toolsMenuWall.cols = 5;
    toolsMenuTable.createButton("Undo", "undo.xpl2", (id) => this.onButtonClick("Undo"), "Undo");
    toolsMenuTable.createButton("Delete", "delete.xpl2", (id) => this.onButtonClick("Delete"), "Delete");
    toolsMenuTable.createButton("ScaleModelUp", "plus.xpl2", (id) => this.onButtonClick("ScaleModelUp"), "Scale up model");
    toolsMenuTable.createButton("ScaleModelDown", "minus.xpl2", (id) => this.onButtonClick("ScaleModelDown"), "Scale down model");
    toolsMenuTable.createButton("Draw", "add_line.xpl2", (id) => this.onButtonClick("Draw:Line"), "Draw Line");
    toolsMenuTable.createButton("Measure", "measure.xpl2", (id) => this.onButtonClick("Measure"), "Measure");
    toolsMenuTable.createButton("Basemap", "BUTTON_BASEMAP.dae", (id) => { this.changeBasemap() }, "Show basemap");
    toolsMenuTable.createButton("NextBookmark", "BUTTON_Bookmark_Next.xpl2", (id) => this.onBookmarkShow(bookmarkMenus), "Show bookmarks");

    toolsMenuTable.buttons.forEach(b => toolsMenuWall.addButton(b));

    // wall has two extra buttons for controlling view angle
    toolsMenuWall.createButton("ViewAbove", "BUTTON_NADIR.dae", (id) => this.onButtonClick("ViewAbove"), "View from nadir");
    toolsMenuWall.createButton("ViewOblique", "BUTTON_OBLIQUE.dae", (id) => this.onButtonClick("ViewOblique"), "View from oblique");

    this.menusTable.push(toolsMenuTable);
    this.menusWall.push(toolsMenuWall);

    // orbat menu ============
    const orbatMenuTable = new Menu(0.04, 0.3, new Vector<3>([-0.5, -1.05, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05,);
    // LR, FB, UD. Bottom left corner around -1.3, -0.5, 0.5
    // const orbatMenuWall = new Menu(0.4, 0.4, new Vector<3>([-1.3, -0.5, 0.5]), Quaternion.FromYPR(0, 0, 0), [0, 0], true, false, false, 0.06);
    //const toolsMenuWall = new Menu(0.4, 0.4, new Vector<3>([-1.3, -0.5, 0.5]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, false, false, 0.06);
    const orbatMenuWall = new Menu(0.4, 0.6, new Vector<3>([wallLhs, wallPos, 0.9]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, this.buttonSizeWAll);
    orbatMenuWall.rows = 6;
    orbatMenuWall.cols = 1

    // Sub menus
    const subMenuOrbatTable = new Menu(0.04, 0.2, new Vector<3>([-0.4, -1.05, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05);
    const subMenuOrbatWall = new Menu(0.04, 0.5, new Vector<3>([this.wallLs + 0.2, this.wallPos, 0.9]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, this.buttonSizeWAll);
    this.menusTable.push(subMenuOrbatTable);
    this.menusWall.push(subMenuOrbatWall);
    orbatConfig.OrbatModels.forEach((model, i) => {
      orbatMenuTable.createButton(model.modelName, model.buttonIcon, () => this.onOrbatShowMenu(model, [subMenuOrbatTable, subMenuOrbatWall]), model.modelName);
    });

    this.menusTable.push(orbatMenuTable);
    orbatMenuTable.buttons.forEach(b => orbatMenuWall.addButton(b));
    this.menusWall.push(orbatMenuWall);

    // create the verb menu
    const VerbsMenuTable = new MenuVerbs(0.04, 0.6, new Vector<3>([-0.36, -1.1, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [-0.5, 0], true, true, true, 0.05, 10, 1);
    const VerbsMenuWall = new MenuVerbs(0.04, 0.1, new Vector<3>([wallLhs + 0.35, wallPos, 0.9]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, this.buttonSizeWAll, 8, 1);
    VerbsMenuTable.show(false);
    VerbsMenuWall.show(false);
    this.menusTable.push(VerbsMenuTable);
    this.menusWall.push(VerbsMenuWall);

    // show hide verbs menus
    const showVerbsTable = new Menu(0.04, 0.2, new Vector<3>([-0.45, -1.05, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05);
    const showVerbsWall = new Menu(0.04, 0.2, new Vector<3>([wallLhs + 0.1, wallPos, 0.9]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, this.buttonSizeWAll);

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

    const rightMenu = (() => {
      const treeItems = {
        OPFOR_MASTER_OVERLAY: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\OPFOR MASTER OVERLAY"),
        MLCOA_RED: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\MLCOA_RED"),
        MDCOA_RED: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\MDCOA_RED"),
        BLUEFOR_Master_OP: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\BLUEFOR Master OP OVERLAY"),
        BLUEFOR_Op: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\BLUFOR_OP_Overlay"),
        DECISION_SUPORT: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\DECISION_SUPORT_OVERLAY_Blue"),
        CONPLAN: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\CONPLAN_BLUE")
      };

      function getVisibilities(): FixedSizeArray<boolean, 7> {
        return [
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.OPFOR_MASTER_OVERLAY),
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.MLCOA_RED),
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.MDCOA_RED),
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.BLUEFOR_Master_OP),
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.BLUEFOR_Op),
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.DECISION_SUPORT),
          0 < sgWorld.ProjectTree.GetVisibility(treeItems.CONPLAN)
        ];
      }

      function setVisibilities(visibilities: FixedSizeArray<boolean, 7>) {
        sgWorld.ProjectTree.SetVisibility(treeItems.OPFOR_MASTER_OVERLAY, visibilities[0]);
        sgWorld.ProjectTree.SetVisibility(treeItems.MLCOA_RED, visibilities[1]);
        sgWorld.ProjectTree.SetVisibility(treeItems.MDCOA_RED, visibilities[2]);
        sgWorld.ProjectTree.SetVisibility(treeItems.BLUEFOR_Master_OP, visibilities[3]);
        sgWorld.ProjectTree.SetVisibility(treeItems.BLUEFOR_Op, visibilities[4]);
        sgWorld.ProjectTree.SetVisibility(treeItems.DECISION_SUPORT, visibilities[5]);
        sgWorld.ProjectTree.SetVisibility(treeItems.CONPLAN, visibilities[6]);
      }

      const mlcoaRed = new Button("mlcoaRed", sgWorld.Creator.CreatePosition(0.5, -1.13, 0.71, 4, 0, 6), basePath + "ui/BUTTON_4_mlcoa.xpl2", this.groupId, () => {
        const visibilities = getVisibilities();
        visibilities[1] = !visibilities[1];
        visibilities[0] = visibilities[1];
        visibilities[2] = visibilities[3] = visibilities[4] = visibilities[5] = visibilities[6] = false;
        setVisibilities(visibilities);
      }, false, "MLCOA Red");

      const mdcoaRed = new Button("mdcoaRed", sgWorld.Creator.CreatePosition(0.5, -1.13, 0.71, 4, 0, 6), basePath + "ui/BUTTON_3_mdcoa.xpl2", this.groupId, () => {
        const visibilities = getVisibilities();
        visibilities[2] = !visibilities[2];
        visibilities[0] = visibilities[2];
        visibilities[1] = visibilities[3] = visibilities[4] = visibilities[5] = visibilities[6] = false;
        setVisibilities(visibilities);
      }, false, "MDCOA Red");

      const blueforOp = new Button("blueforOp", sgWorld.Creator.CreatePosition(0.5, -1.13, 0.71, 4, 0, 6), basePath + "ui/BUTTON_2_master.xpl2", this.groupId, () => {
        const visibilities = getVisibilities();
        visibilities[4] = !visibilities[4];
        visibilities[3] = visibilities[4] || visibilities[5] || visibilities[6];
        visibilities[0] = visibilities[1] = visibilities[2] = false;
        setVisibilities(visibilities);

      }, false, "BlueFor Op");

      const decisionSuport = new Button("decisionSuport", sgWorld.Creator.CreatePosition(0.5, -1.13, 0.71, 4, 0, 6), basePath + "ui/BUTTON_1_decision.xpl2", this.groupId, () => {
        const visibilities = getVisibilities();
        visibilities[5] = !visibilities[5];
        visibilities[3] = visibilities[4] || visibilities[5] || visibilities[6];
        visibilities[0] = visibilities[1] = visibilities[2] = false;
        setVisibilities(visibilities);

      }, false, "Decision Support");

      const conplan = new Button("conplan", sgWorld.Creator.CreatePosition(0.5, -1.13, 0.71, 4, 0, 6), basePath + "ui/BUTTON_0_conplan.xpl2", this.groupId, () => {
        const visibilities = getVisibilities();
        visibilities[6] = !visibilities[6];
        visibilities[3] = visibilities[4] || visibilities[5] || visibilities[6];
        visibilities[0] = visibilities[1] = visibilities[2] = false;
        setVisibilities(visibilities);
      }, false, "Conplan");

      const menu = new Menu(0.05, 0.4, new Vector<3>([0.4, -1.13, 0.71]), Quaternion.FromYPR(0, degsToRads(-90), 0), [0, 0], false, true, false, 0.05, 1, 1);
      menu.addButton(mlcoaRed);
      menu.addButton(mdcoaRed);
      menu.addButton(blueforOp);
      menu.addButton(decisionSuport);
      menu.addButton(conplan);
      return menu;
    })();
    this.menusTable.push(rightMenu);
  }

  onOrbatShowMenu(menuItems: IOrbatMenuItem, menus: Menu[]): void {
    console.log("onOrbatShowMenu  ===========================")
    const [subMenuOrbatTable, subMenuOrbatWall] = menus;
    menus.forEach(m => m.removeAllButtons())

    if (menuItems.buttons.length === 1) {
      /// no sub menu items just show the models
      this.onOrbatModelAdd(menuItems.buttons[0])
    } else {
      // create a menu that has the sub menu items
      menuItems.buttons.forEach(btn => {
        console.log("adding new button ===========================")
        subMenuOrbatTable.createButton(btn.modelName, btn.buttonIcon, () => {
          menus.forEach(m => m.show(false))
          this.onOrbatModelAdd(btn)
        }, btn.modelName)
      })
      subMenuOrbatTable.buttons.forEach(b => subMenuOrbatWall.addButton(b))
    }
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
    const ControlsMenuWall = new MenuPaging(0.04, 1, new Vector<3>([this.wallLs + 0.9, this.wallPos, 0.7]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, true, this.buttonSizeWAll, 2, 10);

    ControlsMenuTable.show(false);
    ControlsMenuWall.show(false);
    this.menusTable.push(ControlsMenuTable);
    this.menusWall.push(ControlsMenuWall);

    const menus = [ControlsMenuTable, ControlsMenuWall];
    // show hide verbs menus
    const showControlsTable = new Menu(0.04, 0.2, new Vector<3>([-0.3, -1.18, 0.7]), Quaternion.FromYPR(0, degsToRads(-80), 0), [0, 0], false, true, false, 0.05, 2, 2);
    const showControlsWall = new Menu(0.04, 0.2, new Vector<3>([this.wallLs + 0.5, this.wallPos, 0.7]), Quaternion.FromYPR(0, 0, 0), [0, 0], false, true, false, this.buttonSizeWAll, 2, 2);


    showControlsTable.createButton("taskIndicatorsGreen", "TaskIndicatorsGreen.xpl2", () => { this.onShowControlMeasures("taskIndicator", "green", menus) }, "Task Indicators");
    showControlsTable.createButton("taskIndicatorsBlue", "TaskIndicatorsBlue.xpl2", () => { this.onShowControlMeasures("taskIndicator", "blue", menus) }, "Task Indicators");
    showControlsTable.createButton("controlMeasures", "controlMeasures.xpl2", () => { this.onShowControlMeasures("controlMeasure", "black", menus) }, "Control Measures");
    showControlsTable.createButton("taskIndicatorsRed", "TaskIndicatorsRed.xpl2", () => { this.onShowControlMeasures("taskIndicator", "red", menus) }, "Task Indicators");


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
    }

    const controls: Button[] = [];
    const pos = sgWorld.Creator.CreatePosition(0, 0, 0.7, 3);
    const groupId = ProgramManager.getInstance().getGroupID("buttons");

    controlConfig.ControlModels.forEach((model) => {
      if (model.modelType === controlType) {
        // some weird logic here... if its blue or red then add the black models too.
        if (model.Black === 1 && color !== "green") {
          const buttonRGBA = ProgramManager.getInstance().userModeManager!.getColorFromString("black", 150);
          const btn = new ButtonModel(model.modelName, pos, basePath + "model/" + model.modelPath, groupId, () => this.onControlModelAdd(model, "black"), false, model.modelName, buttonRGBA)
          controls.push(btn);
        }
        if (color === "blue" && model.Blue || color === "red" && model.Red || color === "green" && model.Green) {
          const buttonRGBA = ProgramManager.getInstance().userModeManager!.getColorFromString(color, 150);
          const btn = new ButtonModel(model.modelName, pos, basePath + "model/" + model.modelPath, groupId, () => this.onControlModelAdd(model, color), false, model.modelName, buttonRGBA)
          controls.push(btn);
        }
      }
    });

    // for green we need a specific button which allows a rectangle to be drawn
    if (color === "green") {
      const buttonRGBA = ProgramManager.getInstance().userModeManager!.getColorFromString(color, 150);
      const btn = new Button("Obstacle Group", pos, basePath + "ui/CM_-_ObstacleGroup.xpl2", groupId, () => this.onButtonClick("Draw:Rectangle"), false, "Obstacle Group", buttonRGBA)
      controls.push(btn);
    }

    controls.sort((a, b) => a.tooltip < b.tooltip ? -1 : 0);

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

  onBookmarkShow(menus: MenuVerbs[]) {
    const getMenu = () => {
      let [bookmarksMenuTable, bookmarksMenuWall] = menus;
      switch (this.GetDeviceTypeOverride()) {
        case DeviceType.Desktop:
        case DeviceType.Table:
          return bookmarksMenuTable
        case DeviceType.Wall:
          return bookmarksMenuWall;
      }
    }

    if (getMenu().isVisible) {
      getMenu().show(false);
      return;
    }

    const bookmarks: Button[] = [];
    bookmarksConfig.bookmarks.forEach(b => {
      bookmarks.push(getMenu().createButton(b.name, "blank.xpl2", () => {
        this.bookmarkManager.ZoomTo(b.name);
        getMenu().show(false);
      }))
    })
    getMenu().addButtons(bookmarks);
  }

  changeBasemap() {
    try {

      // fallback hard coded as this was not tested yet
      const itemIdStreets = GetItemIDByName("Streets") ? GetItemIDByName("Streets") as string : "0_28095807";
      const itemIdSatellite = GetItemIDByName("Satellite") ? GetItemIDByName("Satellite") as string : "0_264" as string;
      console.log("itemIdStreets:: " + itemIdStreets);
      console.log("itemIdSatellite:: " + itemIdSatellite);
      const ImageryLayer = GetObject(itemIdStreets, ObjectTypeCode.OT_IMAGERY_LAYER);
      const TerrainLayer = GetObject(itemIdSatellite, ObjectTypeCode.OT_IMAGERY_LAYER);
      if (ImageryLayer === null) {
        console.log("Streets item is null");
        return;
      }
      if (TerrainLayer === null) {
        console.log("Satellite item is null");
        return;
      }
      const val = ImageryLayer.Visibility.Show;
      console.log(ImageryLayer.ID);
      console.log(TerrainLayer.ID);
      ImageryLayer.Visibility.Show = !val
      TerrainLayer.Visibility.Show = val;
    } catch (error) {
      console.log("Error in show basemap" + error);
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
      const poly = GetObject(this.polygonId, ObjectTypeCode.OT_POLYGON);
      if (poly !== null) {
        poly.geometry = cPolygonGeometry;
      }
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
    const um = ProgramManager.getInstance().userModeManager;
    if (um === undefined) throw new Error("Could not find userModeManager");
    switch (name) {
      case "NextBookmark":
        if (um.userMode == UserMode.Standard) {
          this.bookmarkManager.ZoomNext();
        }
        break;
      case "PreviousBookmark":
        if (um.userMode == UserMode.Standard) {
          this.bookmarkManager.ZoomPrevious();
        }
        break;
      case "Draw:Line":
        um.toggleDrawLine()
        break;
      case "Draw:Rectangle":
        um.toggleDrawRectangle()
        break;
      case "Measure":
        um.toggleMeasurementMode();
        break;
      case "Undo":
        um.undo();
        break;
      case "Delete":
        um.deleteModel();
        break;
      case "ScaleModelUp":
        um.scaleModel(+1);
        break;
      case "ScaleModelDown":
        um.scaleModel(-1);
        break;
      case "ViewAbove":
        const pos1 = sgWorld.Navigate.GetPosition(3);
        pos1.Yaw = 0;
        pos1.Pitch = -90;
        sgWorld.Navigate.JumpTo(pos1)
        break;
      case "ViewOblique":
        const pos2 = sgWorld.Navigate.GetPosition(3);
        pos2.Yaw = 0;
        pos2.Pitch = -50;
        sgWorld.Navigate.JumpTo(pos2)
        break;
      default:
        console.log("onButtonClick:: action not found" + name)
    }
  }

  onControlModelAdd(model: { modelName: string; modelType: string; buttonIcon: string; modelPath: string; }, color: string) {
    const pm = ProgramManager.getInstance().userModeManager;
    pm?.toggleModelMode(model.modelPath, model.modelName, color)
  }


  onOrbatModelAdd(model: IOrbatSubMenuItem): void {
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

      var deviceType = GetDeviceType();
      var pos;
      if (deviceType === DeviceType.Wall) {
        pos = sgWorld.Creator.CreatePosition(-0.7 + (x * xspacing), -0.2, 1.7 - (y * yspacing), 3, 0, 90, 0);

      } else {
        pos = sgWorld.Creator.CreatePosition(-0.2 + (x * xspacing), -0.4 - (y * yspacing), 0.7, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);
      }

      const roomPos = roomToWorldCoord(pos);
      const modelPath = basePath + `model/${orbatModel.modelFile}`;

      try {
        const modelObject = sgWorld.Creator.CreateModel(roomPos, modelPath, 1, 0, grp, orbatModel.modelName);
        // add the created model to the undo list
        ProgramManager.getInstance().userModeManager?.undoObjectIds.push(modelObject.ID);
        // set the scale value based on the current zoom level
        var scaleValue = roomPos.Altitude * this.orbatScaleFactor;

        // scale of models need to be set differently
        if (deviceType === DeviceType.Wall) {
          scaleValue *= 0.5;
        }

        // if the model is a scale model then start it with a smaller scale
        var modelName = sgWorld.ProjectTree.GetItemName(modelObject.ID);
        modelName = modelName.toLocaleLowerCase();
        // if its an auscam scale model, it should start with a smaller scale because they come in too large and was too hard to edith model file
        if (modelName.indexOf('abrahms') !== -1) {
          scaleValue *= 0.2;
        }

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
    //  return GetDeviceType();
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

