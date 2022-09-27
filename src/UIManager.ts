import { basePath, sgWorld } from "./Axiom";
import { runConsole } from "./Debug";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads } from "./Mathematics";
import { Menu } from "./Menu";
import { DeviceType, GetDeviceType, ProgramManager, roomToWorldCoord, setFilmMode, GetObject, GetItemIDByName, deleteItemSafe, SetClientData } from "./ProgramManager";
import { BookmarkManager } from "./UIControls/BookmarkManager";
import { MenuPaging } from "./UIControls/MenuPaging"
import { controlConfig } from "./config/ControlModels";
import { IOrbatSubMenuItem, orbatConfig } from "./config/OrbatModels";
import { SimulateSelectedButton } from "./Button";
import { verbsConfig } from "./config/verbs";
import { TextMenu } from "./UIControls/TextMenu";
import { getColorFromString, UserMode } from "./UserManager";
import { ButtonModel } from "./UIControls/ButtonModel";
import { bookmarksConfig } from "./config/bookmarks";
import { FixedSizeArray } from "./math/fixedSizeArray";
import { GpsTracking } from "./GpsTracking";
import { ControllerReader } from "./ControllerReader";

const tableHeight = 0.65;

export class UIManager {
  menusTable: Menu[] = [];
  menusWall: Menu[] = [];

  bookmarkManager = new BookmarkManager();
  polygonId: string = "";

  groupIDTable?: string;
  groupIDWall?: string;

  wallLs: number = -1; // left hand side for wall buttons
  wallPos: number = -0.3; // distance out from wall
  buttonSizeWall = new Vector<3>([0.1, 0.1, 0.1]);
  buttonSizeTable = new Vector<3>([0.1, 0.1, 0.1]);

  private sharedMenuSpace: Menu[] = [];
  private modelsToPlace: string[] = [];

  constructor() {
    new GpsTracking(); // FIXME an object is created then released immediately. Objects should be held by other objects.
  }

  Init() {
    document.getElementById("consoleRun")?.addEventListener("click", runConsole);
    document.getElementById("filmMode")?.addEventListener("change", e => {
      if (!(e.currentTarget instanceof HTMLInputElement))
        throw new Error("Expected #filmMode to be a checkbox");
      setFilmMode(e.currentTarget.checked);
    });
    document.getElementById("simulate")?.addEventListener("click", SimulateSelectedButton);
    const groupID = sgWorld.ProjectTree.CreateGroup("UI", ProgramManager.getInstance().groupID);
    this.groupIDTable = sgWorld.ProjectTree.CreateGroup("Table", groupID);
    this.groupIDWall = sgWorld.ProjectTree.CreateGroup("Wall", groupID);
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
    // LR, FB, UD. Bottom left corner around -1.2, -0.5
    const wallLhs = this.wallLs;
    const wallPos = this.wallPos; // distance out from wall

    const bookmarkSubMenus = (() => {
      const bookmarksMenuTable = new TextMenu(1, new Vector<3>([-0.36, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, false, this.buttonSizeTable, 8, sgWorld.ProjectTree.CreateGroup("Bookmarks", this.groupIDTable));
      const bookmarksMenuWall = new TextMenu(1, new Vector<3>([wallLhs + 0.35, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, 8, sgWorld.ProjectTree.CreateGroup("Bookmarks", this.groupIDWall));
      const bookmarkSubMenus = [bookmarksMenuTable, bookmarksMenuWall];
      this.sharedMenuSpace.push(...bookmarkSubMenus);
      this.menusTable.push(bookmarksMenuTable);
      this.menusWall.push(bookmarksMenuWall);

      bookmarksConfig.bookmarks.forEach(b => {
        for (let submenu of bookmarkSubMenus)
          submenu.createButton(b.name, "blank.xpl2", () => {
            this.bookmarkManager.ZoomTo(b.name);
            submenu.show(false);
          });
      });
      bookmarkSubMenus.forEach(m => m.show(false));

      return bookmarkSubMenus;
    })();

    const drawingSubMenus = (() => {
      const drawingSubMenuTable = new Menu(new Vector<3>([-0.45, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, false, this.buttonSizeTable, 8, sgWorld.ProjectTree.CreateGroup("Drawing", this.groupIDTable));
      const drawingSubMenuWall = new Menu(new Vector<3>([wallLhs + 0.20, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, 8, sgWorld.ProjectTree.CreateGroup("Drawing", this.groupIDWall));

      const drawingSubMenus = [drawingSubMenuTable, drawingSubMenuWall];

      for (let subMenu of drawingSubMenus) {
        subMenu.createButton("Line", "Buttons/add_line.xpl2", () => this.onButtonClick("Draw:Line"), "Draw Line");
        subMenu.createButton("Obstacle Group", "Buttons/blackSquare.xpl2", () => this.onButtonClick("Draw:Rectangle:black"), "Obstacle Group");
        subMenu.createButton("Obstacle Group", "Buttons/greenSquare.xpl2", () => this.onButtonClick("Draw:Rectangle:green"), "Obstacle Group");
        subMenu.show(false);
      }

      this.menusTable.push(drawingSubMenuTable);
      this.menusWall.push(drawingSubMenuWall);
      this.sharedMenuSpace.push(...drawingSubMenus);

      return drawingSubMenus;
    })();

    const viewSubMenu = (() => {
      const viewSubMenuWall = new Menu(new Vector<3>([wallLhs + 0.20, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, 8, sgWorld.ProjectTree.CreateGroup("View", this.groupIDWall));

      viewSubMenuWall.createButton("ViewAbove", "Buttons/NADIR.xpl2", () => this.onButtonClick("ViewAbove"), "View from nadir");
      viewSubMenuWall.createButton("ViewOblique", "Buttons/Oblique.xpl2", () => this.onButtonClick("ViewOblique"), "View from oblique");
      viewSubMenuWall.createButton("Pitch Down", "Buttons/LookDown.xpl2", () => this.onButtonClick("PitchDown"), "Pitch Down");
      viewSubMenuWall.createButton("Pitch Up", "Buttons/LookUp.xpl2", () => this.onButtonClick("PitchUp"), "Pitch Up");
      viewSubMenuWall.createButton("Yaw Left", "Buttons/LookLeft.xpl2", () => this.onButtonClick("YawLeft"), "Yaw Left");
      viewSubMenuWall.createButton("Yaw Right", "Buttons/LookRight.xpl2", () => this.onButtonClick("YawRight"), "Yaw Right");
      viewSubMenuWall.show(false);

      this.menusWall.push(viewSubMenuWall);
      this.sharedMenuSpace.push(viewSubMenuWall);
      return viewSubMenuWall;
    })();

    const toolsMenus = (() => {
      const toolsMenuTable = new Menu(new Vector<3>([-0.5, -1.18, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, false, this.buttonSizeTable, 2, sgWorld.ProjectTree.CreateGroup("Tools", this.groupIDTable));
      const toolsMenuWall = new Menu(new Vector<3>([wallLhs, wallPos, tableHeight]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, 2, sgWorld.ProjectTree.CreateGroup("Tools", this.groupIDWall));
      const toolsMenus = [toolsMenuTable, toolsMenuWall];

      for (let [menu, bookmarkSubMenu, drawingSubMenu] of [[toolsMenuTable, bookmarkSubMenus[0], drawingSubMenus[0]], [toolsMenuWall, bookmarkSubMenus[1], drawingSubMenus[1]]] as const) {
        menu.createButton("Undo", "Buttons/Undo.xpl2", () => this.onButtonClick("Undo"), "Undo");
        menu.createButton("Delete", "Buttons/Delete.xpl2", () => this.onButtonClick("Delete"), "Delete");
        menu.createButton("ScaleModelUp", "Buttons/Plus.xpl2", () => this.onButtonClick("ScaleModelUp"), "Scale up model");
        menu.createButton("ScaleModelDown", "Buttons/Minus.xpl2", () => this.onButtonClick("ScaleModelDown"), "Scale down model");
        menu.createButton("Draw", "Buttons/add_line.xpl2", () => this.showSubMenu(drawingSubMenu), "Drawing Tools");
        menu.createButton("Measure", "Buttons/Measure.xpl2", () => this.onButtonClick("Measure"), "Measure");
        menu.createButton("Basemap", "Buttons/Basemap.xpl2", () => this.onButtonClick("ChangeBasemap"), "Show basemap");
        menu.createButton("ListBookmarks", "Buttons/list_bookmark.xpl2", () => this.showSubMenu(bookmarkSubMenu), "Show bookmarks");
      }
      toolsMenuWall.createButton("View", "Buttons/View.xpl2", () => this.showSubMenu(viewSubMenu), "View");
      for (let menu of toolsMenus) {
        menu.newLine();
        // Start Control Measures now
      }

      this.menusTable.push(toolsMenuTable);
      this.menusWall.push(toolsMenuWall);
      return toolsMenus;
    })();

    // Control Measures
    {
      // 4 buttons. black for control measures, red, blue green task measures

      // show hide verbs menus
      const tempPos = sgWorld.Creator.CreatePosition(0, 0, 0, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);

      const tableGroupID = sgWorld.ProjectTree.CreateGroup("Control", this.groupIDTable);
      const wallGroupID = sgWorld.ProjectTree.CreateGroup("Control", this.groupIDWall);

      controlConfig.ControlModels.sort((a, b) => a.modelName.localeCompare(b.modelName));

      for (let colour of ["Green", "Blue", "Red"] as const) {
        const subMenuTable = new MenuPaging(2, new Vector<3>([-0.15, -1.18, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, true, this.buttonSizeTable, 10, sgWorld.ProjectTree.CreateGroup(colour, tableGroupID));
        const subMenuWall = new MenuPaging(2, new Vector<3>([this.wallLs + 0.9, this.wallPos, 0.7]), Quaternion.FromYPR(0, 0, 0), true, true, true, this.buttonSizeWall, 10, sgWorld.ProjectTree.CreateGroup(colour, wallGroupID));
        this.menusTable.push(subMenuTable);
        this.menusWall.push(subMenuWall);

        for (let [menu, submenu] of [[toolsMenus[0], subMenuTable], [toolsMenus[1], subMenuWall]]) {
          this.sharedMenuSpace.push(submenu);
          // Add the models to the submenu
          controlConfig.ControlModels.forEach(model => {
            if (model.modelType === "taskIndicator") {
              // if its blue or red then add the black models too.
              let buttonColour: typeof colour | "Black";
              if (model.Black && colour !== "Green")
                buttonColour = "Black";
              else if (colour === "Blue" && model.Blue || colour === "Red" && model.Red || colour === "Green" && model.Green)
                buttonColour = colour;
              else
                return;

              const buttonRGBA = getColorFromString(buttonColour, 150);
              const btn = new ButtonModel(model.modelName, tempPos, basePath + "model/" + model.modelPath, submenu.groupID, () => this.onControlModelAdd(model, buttonColour), false, model.modelName, buttonRGBA);
              submenu.addButton(btn);
            }
          });

          menu.createButton(`taskIndicators${colour}`, `Buttons/TaskIndicators${colour}.xpl2`, () => {
            ProgramManager.getInstance().userModeManager!.cleanUpOnChangeMode();
            this.hideOtherMenus(submenu.groupID);
            submenu.show(!submenu.isVisible);
          }, "Task Indicators");

          submenu.show(false);
        }
      }
      // Do the same for CM
      {
        const subMenuTable = new MenuPaging(2, new Vector<3>([-0.15, -1.18, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, true, this.buttonSizeTable, 10, sgWorld.ProjectTree.CreateGroup(`Black`, tableGroupID));
        const subMenuWall = new MenuPaging(2, new Vector<3>([this.wallLs + 0.9, this.wallPos, 0.7]), Quaternion.FromYPR(0, 0, 0), true, true, true, this.buttonSizeWall, 10, sgWorld.ProjectTree.CreateGroup(`Black`, wallGroupID));
        this.menusTable.push(subMenuTable);
        this.menusWall.push(subMenuWall);
        for (let [menu, submenu] of [[toolsMenus[0], subMenuTable], [toolsMenus[1], subMenuWall]]) {
          this.sharedMenuSpace.push(submenu);
          // Add the models to the submenu
          controlConfig.ControlModels.forEach(model => {
            if (model.modelType === "controlMeasure") {
              if (!model.Black)
                return;

              const buttonRGBA = getColorFromString("Black", 150);
              const btn = new ButtonModel(model.modelName, tempPos, basePath + "model/" + model.modelPath, submenu.groupID, () => this.onControlModelAdd(model, "Black"), false, model.modelName, buttonRGBA);
              submenu.addButton(btn);
            }
          });

          menu.createButton("controlMeasures", "Buttons/CM.xpl2", () => {
            ProgramManager.getInstance().userModeManager!.cleanUpOnChangeMode();
            this.hideOtherMenus(submenu.groupID);
            submenu.show(!submenu.isVisible);
          }, "Control Measures");

          submenu.show(false);
        }
      }
    }

    // orbat menu
    {
      const orbatMenuTable = new Menu(new Vector<3>([-0.5, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, true, this.buttonSizeTable, 1, sgWorld.ProjectTree.CreateGroup("Orbat", this.groupIDTable));
      const orbatMenuWall = new Menu(new Vector<3>([wallLhs, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, true, this.buttonSizeWall, 1, sgWorld.ProjectTree.CreateGroup("Orbat", this.groupIDWall));

      orbatConfig.OrbatModels.forEach(menuItems => {
        if (menuItems.buttons.length === 1) {
          for (let orbatMenu of [orbatMenuTable, orbatMenuWall]) {
            orbatMenu.createButton(menuItems.modelName, menuItems.buttonIcon, () => {
              this.hideOtherMenus();
              if (GetDeviceType() === DeviceType.Wall) {
                this.onButtonClick("ViewAbove");
                setTimeout(() => {
                  this.onOrbatModelAdd(menuItems.buttons[0], menuItems.xspacing, menuItems.yspacing, menuItems.scaleAdjust, menuItems.xCount);
                }, 300);
              } else {
                this.onOrbatModelAdd(menuItems.buttons[0], menuItems.xspacing, menuItems.yspacing, menuItems.scaleAdjust, menuItems.xCount);
              }
            }, menuItems.modelName);
          }
        } else {
          const subMenuOrbatTable = new Menu(new Vector<3>([-0.4, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, true, this.buttonSizeTable, 1, sgWorld.ProjectTree.CreateGroup("", orbatMenuTable.groupID));
          const subMenuOrbatWall = new Menu(new Vector<3>([this.wallLs + 0.2, this.wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, true, this.buttonSizeWall, 1, sgWorld.ProjectTree.CreateGroup("", orbatMenuWall.groupID));
          this.menusTable.push(subMenuOrbatTable);
          this.menusWall.push(subMenuOrbatWall);
          const menus = [[orbatMenuTable, subMenuOrbatTable], [orbatMenuWall, subMenuOrbatWall]];
          for (let [orbatMenu, subMenu] of menus) {
            subMenu.createButton("Done", "Buttons/Done.xpl2", () => {
              this.removeOtherModels();
              subMenu.show(false);
            });

            orbatMenu.createButton(menuItems.modelName, menuItems.buttonIcon, () => {
              this.hideOtherMenus(subMenu.groupID);
              if (GetDeviceType() === DeviceType.Wall) {
                this.onButtonClick("ViewAbove");
                setTimeout(() => {
                  subMenu.show(true);
                }, 300)
              } else {
                subMenu.show(true);
              }
            }, menuItems.modelName);

            menuItems.buttons.forEach(btn => {
              subMenu.createButton(btn.modelName, btn.buttonIcon, () => {
                this.onOrbatModelAdd(btn, menuItems.xspacing, menuItems.yspacing, menuItems.scaleAdjust, menuItems.xCount);
              }, btn.modelName);
            });

            this.sharedMenuSpace.push(subMenu);
            subMenu.show(false);
          }
        }
      });

      this.menusTable.push(orbatMenuTable);
      this.menusWall.push(orbatMenuWall);
    }

    // create the verb menu
    {
      const showVerbsTable = new Menu(new Vector<3>([-0.45, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, false, this.buttonSizeTable, -1, sgWorld.ProjectTree.CreateGroup("Verbs", this.groupIDTable));
      const showVerbsWall = new Menu(new Vector<3>([wallLhs + 0.1, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, -1, sgWorld.ProjectTree.CreateGroup("Verbs", this.groupIDWall));

      const verbsSubMenuTableTV = new TextMenu(1, new Vector<3>([-0.36, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, false, this.buttonSizeTable, 8, sgWorld.ProjectTree.CreateGroup("TV", showVerbsTable.groupID));
      const verbsSubMenuTableMV = new TextMenu(1, new Vector<3>([-0.36, -1.05, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), true, true, false, this.buttonSizeTable, 8, sgWorld.ProjectTree.CreateGroup("MV", showVerbsTable.groupID));
      const verbsSubMenuWallTV = new TextMenu(1, new Vector<3>([wallLhs + 0.35, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, 8, sgWorld.ProjectTree.CreateGroup("TV", showVerbsWall.groupID));
      const verbsSubMenuWallMV = new TextMenu(1, new Vector<3>([wallLhs + 0.35, wallPos, 0.95]), Quaternion.FromYPR(0, 0, 0), true, true, false, this.buttonSizeWall, 8, sgWorld.ProjectTree.CreateGroup("MV", showVerbsWall.groupID));
      this.sharedMenuSpace.push(verbsSubMenuTableTV, verbsSubMenuTableMV, verbsSubMenuWallTV, verbsSubMenuWallMV);
      this.menusTable.push(verbsSubMenuTableTV, verbsSubMenuTableMV);
      this.menusWall.push(verbsSubMenuWallTV, verbsSubMenuWallMV);
      verbsSubMenuTableTV.show(false);
      verbsSubMenuTableMV.show(false);
      verbsSubMenuWallTV.show(false);
      verbsSubMenuWallMV.show(false);

      verbsConfig.verbs.sort((a, b) => a.verbName.localeCompare(b.verbName));

      verbsConfig.verbs.filter((v) => v.verbType === "TaskVerb").forEach((verb) => {
        verbsSubMenuTableTV.createButton(verb.verbName, "blank.xpl2", () => this.onVerbAdd(verb, verbsSubMenuTableTV));
        verbsSubMenuWallTV.createButton(verb.verbName, "blank.xpl2", () => this.onVerbAdd(verb, verbsSubMenuWallTV));
      });
      verbsConfig.verbs.filter((v) => v.verbType === "MissionTaskVerb").forEach((verb) => {
        verbsSubMenuTableMV.createButton(verb.verbName, "blank.xpl2", () => this.onVerbAdd(verb, verbsSubMenuTableMV));
        verbsSubMenuWallMV.createButton(verb.verbName, "blank.xpl2", () => this.onVerbAdd(verb, verbsSubMenuWallMV));
      });

      showVerbsTable.createButton("TaskVerbs", "Buttons/TV.xpl2", () => { this.showSubMenu(verbsSubMenuTableTV); }, "Task Verbs");
      showVerbsTable.createButton("MissionTaskVerbs", "Buttons/MV.xpl2", () => { this.showSubMenu(verbsSubMenuTableMV); }, "Mission Task Verbs");
      showVerbsWall.createButton("TaskVerbs", "Buttons/TV.xpl2", () => { this.showSubMenu(verbsSubMenuWallTV); }, "Task Verbs");
      showVerbsWall.createButton("MissionTaskVerbs", "Buttons/MV.xpl2", () => { this.showSubMenu(verbsSubMenuWallMV); }, "Mission Task Verbs");

      this.menusTable.push(showVerbsTable);
      this.menusWall.push(showVerbsWall);
    }

    // Layer menu
    {
      const treeItems = {
        OPFOR_MASTER_OVERLAY: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\OPFOR MASTER OVERLAY"),
        MLCOA_RED: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\MLCOA_RED"),
        MDCOA_RED: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\MDCOA_RED"),
        BLUEFOR_Master_OP: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\BLUEFOR Master OP OVERLAY"),
        BLUEFOR_Op: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\BLUFOR_OP_Overlay"),
        DECISION_SUPORT: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\DECISION_SUPORT_OVERLAY_Blue"),
        CONPLAN: sgWorld.ProjectTree.FindItem("C-ARMSAS\\C-ARMSAS TABLE DEMONSTRATION\\CONPLAN_BLUE")
      };

      const getVisibilities = (): FixedSizeArray<boolean, 7> => {
        try {
          return [
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.OPFOR_MASTER_OVERLAY),
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.MLCOA_RED),
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.MDCOA_RED),
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.BLUEFOR_Master_OP),
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.BLUEFOR_Op),
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.DECISION_SUPORT),
            0 < sgWorld.ProjectTree.GetVisibility(treeItems.CONPLAN)
          ];
        } catch (error: any) {
          console.log("Can't get layer visibility:");
          try {
            console.log((error.stack as string).replace(/^/mg, "\t"));
          } catch {
            console.log("\tStrange error");
          }
          return [false, false, false, false, false, false, false];
        }
      }

      const setVisibilities = (visibilities: FixedSizeArray<boolean, 7>) => {
        try {
          sgWorld.ProjectTree.SetVisibility(treeItems.OPFOR_MASTER_OVERLAY, visibilities[0]);
          sgWorld.ProjectTree.SetVisibility(treeItems.MLCOA_RED, visibilities[1]);
          sgWorld.ProjectTree.SetVisibility(treeItems.MDCOA_RED, visibilities[2]);
          sgWorld.ProjectTree.SetVisibility(treeItems.BLUEFOR_Master_OP, visibilities[3]);
          sgWorld.ProjectTree.SetVisibility(treeItems.BLUEFOR_Op, visibilities[4]);
          sgWorld.ProjectTree.SetVisibility(treeItems.DECISION_SUPORT, visibilities[5]);
          sgWorld.ProjectTree.SetVisibility(treeItems.CONPLAN, visibilities[6]);
        } catch (error) {
          console.log("Can't set layer visibility. " + JSON.stringify(error));
        }
      }

      const layerTableMenu = new Menu(new Vector<3>([0.45, -1.13, tableHeight]), Quaternion.FromYPR(0, degsToRads(-90), 0), false, true, false, this.buttonSizeTable, -1, sgWorld.ProjectTree.CreateGroup("Layers", this.groupIDTable));
      this.menusTable.push(layerTableMenu);

      const layerWallMenu = new Menu(new Vector<3>([-wallLhs, wallPos, 1]), new Quaternion([0, 0, 0, 1]), false, true, false, this.buttonSizeWall, -1, sgWorld.ProjectTree.CreateGroup("Layers", this.groupIDWall));
      this.menusWall.push(layerWallMenu);

      for (let menu of [layerTableMenu, layerWallMenu]) {
        menu.createButton("mlcoaRed", "Buttons/MLCOA.xpl2", () => {
          const visibilities = getVisibilities();
          visibilities[1] = !visibilities[1];
          visibilities[0] = visibilities[1];
          visibilities[2] = visibilities[3] = visibilities[4] = visibilities[5] = visibilities[6] = false;
          setVisibilities(visibilities);
        }, "MLCOA Red");

        menu.createButton("mdcoaRed", "Buttons/MDCOA.xpl2", () => {
          const visibilities = getVisibilities();
          visibilities[2] = !visibilities[2];
          visibilities[0] = visibilities[2];
          visibilities[1] = visibilities[3] = visibilities[4] = visibilities[5] = visibilities[6] = false;
          setVisibilities(visibilities);
        }, "MDCOA Red");

        menu.createButton("blueforOp", "Buttons/Master.xpl2", () => {
          const visibilities = getVisibilities();
          visibilities[4] = !visibilities[4];
          visibilities[3] = visibilities[4] || visibilities[5] || visibilities[6];
          visibilities[0] = visibilities[1] = visibilities[2] = false;
          setVisibilities(visibilities);
        }, "BlueFor Op");

        menu.createButton("decisionSupport", "Buttons/Decision.xpl2", () => {
          const visibilities = getVisibilities();
          visibilities[5] = !visibilities[5];
          visibilities[3] = visibilities[4] || visibilities[5] || visibilities[6];
          visibilities[0] = visibilities[1] = visibilities[2] = false;
          setVisibilities(visibilities);
        }, "Decision Support");

        menu.createButton("conplan", "Buttons/Conplan.xpl2", () => {
          const visibilities = getVisibilities();
          visibilities[6] = !visibilities[6];
          visibilities[3] = visibilities[4] || visibilities[5] || visibilities[6];
          visibilities[0] = visibilities[1] = visibilities[2] = false;
          setVisibilities(visibilities);
        }, "Conplan");
      }
    }

    // bookmark navigation
    {
      const bookmarkNavigationGroupID = sgWorld.ProjectTree.CreateGroup("Navigation", this.groupIDWall);

      const bookmarkNavigationMenuLeft = new Menu(new Vector<3>([wallLhs, wallPos, 1.8]), new Quaternion([0, 0, 0, 1]), true, true, true, this.buttonSizeWall, 1, bookmarkNavigationGroupID);
      const bookmarkNavigationMenuRight = new Menu(new Vector<3>([-wallLhs, wallPos, 1.8]), new Quaternion([0, 0, 0, 1]), false, true, true, this.buttonSizeWall, 1, bookmarkNavigationGroupID);

      bookmarkNavigationMenuLeft.createButton("prevBookmark", "Buttons/prev_bookmark.xpl2", () => {
        this.onButtonClick("PreviousBookmark");
      }, "Previous Bookmark");
      bookmarkNavigationMenuRight.createButton("nextBookmark", "Buttons/next_bookmark.xpl2", () => {
        this.onButtonClick("NextBookmark");
      }, "Next Bookmark");

      this.menusWall.push(bookmarkNavigationMenuLeft);
      this.menusWall.push(bookmarkNavigationMenuRight);
    }
  }

  onVerbAdd(verb: { verbName: string; verbType: string; }, menu: TextMenu): void {
    menu.show(false);
    const pm = ProgramManager.getInstance().userModeManager;
    pm?.toggleLabel(verb.verbName);
  }

  showSubMenu(subMenu: Menu) {
    const pm = ProgramManager.getInstance().userModeManager;
    pm?.cleanUpOnChangeMode();

    this.hideOtherMenus(subMenu.groupID);
    subMenu.show(!subMenu.isVisible);
  }

  hideOtherMenus(menuID?: string) {
    // hides other menus in the shared menu space
    this.sharedMenuSpace.forEach(menu => {
      if (menu.groupID !== menuID || menuID === undefined)
        menu.show(false);
    })
    // also clear any unplaced models
    this.removeOtherModels();
  }

  changeBasemap() {
    try {
      // fallback hard coded as this was not tested yet
      const itemIdStreets = GetItemIDByName("Streets") || "0_28095807";
      const itemIdSatellite = GetItemIDByName("Satellite") || "0_264";
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
      console.log("Error in show basemap. " + error);
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
      const polygon = sgWorld.Creator.CreatePolygon(cPolygonGeometry, nLineColor, nFillColor, eAltitudeTypeCode, this.groupIDTable, "Table");
      this.polygonId = polygon.ID;
    }
  }

  drawWall() {
    this.drawDevice(new Vector<3>([-1.78, 0, 0]), new Vector<3>([1.78, 0, 2]));
  }

  private onButtonClick(name: string) {
    console.log("onButtonClick " + name);
    const um = ProgramManager.getInstance().userModeManager;
    if (um === undefined) throw new Error("Could not find userModeManager");
    um.cleanUpOnChangeMode();

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
        um.toggleDrawLine();
        this.hideOtherMenus("");
        break;
      case "Draw:Rectangle:black":
        um.toggleDrawRectangle("Black");
        this.hideOtherMenus("");
        break;
      case "Draw:Rectangle:green":
        um.toggleDrawRectangle("Green");
        this.hideOtherMenus("");
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
        sgWorld.Navigate.JumpTo(pos1);
        break;
      case "ViewOblique":
        const pos2 = sgWorld.Navigate.GetPosition(3);
        pos2.Pitch = -50;
        sgWorld.Navigate.JumpTo(pos2);
        break;
      case "ChangeBasemap":
        this.changeBasemap();
        break;
      case "PitchUp":
        const posUp = sgWorld.Navigate.GetPosition(3);
        posUp.Pitch = posUp.Pitch + 15;
        sgWorld.Navigate.SetPosition(posUp);
        break;
      case "PitchDown":
        const posDown = sgWorld.Navigate.GetPosition(3);
        posDown.Pitch = posDown.Pitch - 15;
        sgWorld.Navigate.SetPosition(posDown);
        break;
      case "YawLeft":
        const posLeft = sgWorld.Navigate.GetPosition(3);
        posLeft.Yaw = posLeft.Yaw - 15;
        sgWorld.Navigate.SetPosition(posLeft);
        break;
      case "YawRight":
        const posRight = sgWorld.Navigate.GetPosition(3);
        posRight.Yaw = posRight.Yaw + 15;
        sgWorld.Navigate.SetPosition(posRight);
        break;
      default:
        console.log("onButtonClick:: action not found" + name);
    }
  }

  onControlModelAdd(model: { modelName: string; modelType: string; buttonIcon: string; modelPath: string; }, color: "Red" | "Green" | "Blue" | "Black") {
    const pm = ProgramManager.getInstance().userModeManager;
    pm?.toggleModelMode(model.modelPath, model.modelName, color)
  }

  onOrbatModelAdd(model: IOrbatSubMenuItem, xspacing: number, yspacing: number, scaleAdjust: number, xCount: number): void {
    // remove unplaced models
    this.removeOtherModels();

    // add the orbat model to world space in the centre of the screen
    this.modelsToPlace = [];
    const grp = ProgramManager.getInstance().getCollaborationFolderID("models");

    model.models.forEach((orbatModel, i) => {
      const x = Math.floor(i / xCount);
      const y = i % xCount;
      const deviceType = this.GetDeviceTypeOverride();
      let roomPos;
      if (deviceType === DeviceType.Wall)
        roomPos = sgWorld.Creator.CreatePosition(-0.6 + (x * xspacing), -0.2, 1.7 - (y * yspacing), AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE, 0, 90);
      else
        roomPos = sgWorld.Creator.CreatePosition(-0.2 + (x * xspacing), -0.4 - (y * yspacing), tableHeight, AltitudeTypeCode.ATC_TERRAIN_ABSOLUTE);

      const worldPos = roomToWorldCoord(roomPos);
      const modelPath = basePath + `model/${orbatModel.modelFile}`;

      try {
        const modelObject = sgWorld.Creator.CreateModel(worldPos, modelPath, 1, 0, grp, orbatModel.modelName);
        // add the created model to the undo list
        ProgramManager.getInstance().userModeManager?.undoObjectIds.push(modelObject.ID);
        // set the scale value based on the current zoom level
        let scaleValue = 0.1 * scaleAdjust * (ControllerReader.controllerInfos[1].scaleFactor ?? 1);

        modelObject.ScaleFactor = scaleValue;
        this.modelsToPlace.push(modelObject.ID);

        SetClientData(modelObject, "moved", "false")
      } catch (e) {
        console.log(e);
        console.log("could not add model: " + modelPath);
      }
    });
  }

  removeOtherModels() {
    // removes the orbat models which have not been moved
    this.modelsToPlace.forEach(id => {
      const model = GetObject(id, ObjectTypeCode.OT_MODEL);
      if (model) {
        if (model.ClientData("moved") === "false") {
          deleteItemSafe(model.ID);
        }
      }
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
    return DeviceType.Wall;
    // when testing on desktop you can use this to change the view
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



