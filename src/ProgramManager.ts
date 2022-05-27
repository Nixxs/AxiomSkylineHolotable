import { sgWorld } from "./Axiom";
import { sessionManager } from "./Axiom";
import { Button } from "./Button";
import { ControllerReader } from "./ControllerReader";
import { debug, debugHandleRefreshGesture } from "./Debug";
import { DesktopInputManager } from "./DesktopInputManager";
import { Quaternion } from "./math/quaternion";
import { Vector } from "./math/vector";
import { degsToRads, radsToDegs } from "./Mathematics";
import { UIManager } from "./UIManager";
import { UserModeManager } from "./UserManager";

export function setComClientForcedInputMode() {
  sgWorld.SetParam(8166, 1); // Force COM input mode (Meaning your code here is in control)
}
export function unsetComClientForcedInputMode() {
  sgWorld.SetParam(8166, 0); // UNForce COM input mode (Meaning your code here is NOT in control)
}
export function getVRControllersInfo() {
  try {
    const VRCstr = sgWorld.GetParam(8600) as string; // get the VR controls status
    return JSON.parse(VRCstr);
  } catch (error) {
    console.log("error with getVRControllersInfo" + error)
  }

}
export function getRoomExtent() {
  const extent = sgWorld.SetParamEx(9015) as string; // get the VR controls status
  return JSON.parse(extent);
}

function roomToWorldCoordEx(position: IPosition) {
  let pos = sgWorld.SetParamEx(9014, position) as IPosition;
  const originalOri = Quaternion.FromYPR(degsToRads(pos.Yaw), degsToRads(pos.Pitch), degsToRads(pos.Roll));
  const worldIPos = sgWorld.Navigate.GetPosition(3);
  const worldOri = Quaternion.FromYPR(degsToRads(worldIPos.Yaw), degsToRads(worldIPos.Pitch + (GetDeviceType() === DeviceType.Wall ? 0 : 90)), degsToRads(-worldIPos.Roll));
  const newOri = worldOri.Mul(originalOri);
  const newYPR = newOri.GetYPR();
  return sgWorld.Creator.CreatePosition(pos.X, pos.Y, pos.Altitude, 3, radsToDegs(newYPR[0]), radsToDegs(newYPR[1]), radsToDegs(-newYPR[2]), pos.Distance);
}
function worldToRoomCoordEx(position: IPosition) {
  let pos = sgWorld.SetParamEx(9013, position) as IPosition;
  const originalOri = Quaternion.FromYPR(degsToRads(pos.Yaw), degsToRads(pos.Pitch), degsToRads(-pos.Roll));
  const worldIPos = sgWorld.Navigate.GetPosition(3);
  const worldOri = Quaternion.FromYPR(degsToRads(worldIPos.Yaw), degsToRads(worldIPos.Pitch + (GetDeviceType() === DeviceType.Wall ? 0 : 90)), degsToRads(-worldIPos.Roll));
  const newOri = worldOri.Conjugate().Mul(originalOri);
  const newYPR = newOri.GetYPR();
  return sgWorld.Creator.CreatePosition(pos.X, pos.Y, pos.Altitude, 3, radsToDegs(newYPR[0]), radsToDegs(newYPR[1]), radsToDegs(newYPR[2]), pos.Distance);
}

function roomToWorldCoordD(position: IPosition) {
  const ret = sgWorld.Navigate.GetPosition(3);
  ret.X += position.X / 40000;
  ret.Y += (position.Altitude + 2) / 40000;
  ret.Altitude += position.Y - 3;
  ret.Yaw = position.Yaw;
  ret.Pitch = position.Pitch;
  ret.Roll = position.Roll;
  return ret;
}
function worldToRoomCoordD(position: IPosition) {
  const ret = sgWorld.Navigate.GetPosition(3);
  ret.Cartesian = true;
  ret.X = 40000 * position.X - ret.X;
  ret.Y = 40000 * position.Altitude - ret.Y;
  ret.Y -= 2;
  ret.Altitude = position.Y - ret.Altitude;
  ret.Altitude += 3;
  ret.Yaw = position.Yaw;
  ret.Pitch = position.Pitch;
  ret.Roll = position.Roll;
  return ret;
}

let roomToWorldCoordF = roomToWorldCoordEx;
let worldToRoomCoordF = worldToRoomCoordEx;

export function roomToWorldCoord(position: IPosition) {
  const temp = position.Y;
  position.Y = position.Altitude;
  position.Altitude = temp;
  const ret = roomToWorldCoordF(position);
  position.Altitude = position.Y;
  position.Y = temp;
  return ret;
}
export function worldToRoomCoord(position: IPosition) {
  const ret = worldToRoomCoordF(position);
  const temp = ret.Y;
  ret.Y = ret.Altitude;
  ret.Altitude = temp;
  return ret;
}

export function setFilmMode(filmMode: boolean) {
  console.log(`Setting film mode to ${filmMode ? "ON" : "OFF"}`);
  sgWorld.SetParam(-3, filmMode ? 1 : 0);
}

export const enum ProgramMode {
  Unknown,
  Desktop,
  Device 
}

export const enum DeviceType {
  Table,
  Wall,
  Desktop
}

// Desktop until proven hologram device
let deviceType: DeviceType = DeviceType.Desktop;
export function GetDeviceType() {
  if (deviceType === DeviceType.Desktop && ControllerReader.roomExtent?.max !== undefined) {
    console.log(`roomExtent.max.z = ${ControllerReader.roomExtent?.max.data[2]}`);
    if (ControllerReader.roomExtent?.max.data[2] > 1.9) {
      deviceType = DeviceType.Wall;
      console.log("Therefore the device type is Wall");
    } else {
      deviceType = DeviceType.Table;
      console.log("Therefore the device type is Table");
    }
  }
  return deviceType;
}

/**
 * Handles running the script in any program mode
 */
export class ProgramManager {
  
  static OnFrame() { }
  static OneFrame = function () { }
  static DoOneFrame(f: () => void) { ProgramManager.OneFrame = f; }

  private mode = ProgramMode.Unknown;
  private modeTimer = 0;
  public currentlySelected?= "";
  private colorItemsTimeout: number = 0;

  getMode() { return this.mode; }
  setMode(newMode: ProgramMode) {
    if (this.modeTimer != 0)
      // Don't revert back to unknown mode yet
      clearTimeout(this.modeTimer);
    this.modeTimer = setTimeout(() => {
      // revert back to unknown mode if no updates after some time
      this.mode = ProgramMode.Unknown;
    }, 2000);
    if (this.mode < newMode) {
      // upgrade mode
      this.mode = newMode;
      console.log(`Entered ${this.mode == 2 ? "Table" : this.mode == 1 ? "Desktop" : "Unknown"} mode`);
    }
  }

  userModeManager?: UserModeManager;
  uiManager?: UIManager;

  private static instance?: ProgramManager;
  public static getInstance(): ProgramManager {
    if (this.instance === undefined) {
      this.instance = new ProgramManager();
    }

    return this.instance;
  }

  private constructor() {
    console.log("ProgramManager:: constructor");
  }

  /**
 * stops errors if the object doesn't exist
 *
 * @param {*} id
 */
  deleteItemSafe(id: string) {
    try {
      const object = sgWorld.Creator.GetObject(id);
      if (object) {
        sgWorld.Creator.DeleteObject(id);
      }
    } catch (error) {
      // fine
    }
  }

  deleteGroup(groupName: string) {
    const groupId = sgWorld.ProjectTree.FindItem(groupName);
    if (groupId) {
      console.log(`Deleted old group "${groupName}"`);
      sgWorld.ProjectTree.DeleteItem(groupId);
      return true;
    }
    return false;
  }

  getGroupID(groupName: string, parentGroup?: string) {
    return sgWorld.ProjectTree.FindItem(groupName) || sgWorld.ProjectTree.CreateGroup(groupName, parentGroup);
  }

  getCollaborationFolderID(groupName: string) {
    var collaborationSessionFolder = sessionManager.GetPropertyValue("CollaborationSession");
    var grp = "";
    // if there is a collaboration session going then put the model in the collaboration session otherwise 
    // just put it in the models group
    if (collaborationSessionFolder.indexOf("Collaboration") !== -1) {
      grp = ProgramManager.getInstance().getGroupID(collaborationSessionFolder);
      // sub group
      try {
        let id = sgWorld.ProjectTree.GetNextItem(grp, ItemCode.CHILD);

        while (id) {
          console.log(sgWorld.ProjectTree.GetItemName(id))
          if (sgWorld.ProjectTree.GetItemName(id) === groupName) {
            return id;
          }
          id = sgWorld.ProjectTree.GetNextItem(grp, ItemCode.NEXT);
        }
      } catch (error) {
        console.log("error no children")
      }
      console.log("create new group under collab tree");
      grp = sgWorld.ProjectTree.CreateGroup(groupName, grp);; 
      return grp
    } else {
      grp = ProgramManager.getInstance().getGroupID(groupName);
    }
    return grp;
  }

  refreshCollaborationModeLayers(objectID: string) {
    sgWorld.ProjectTree.SetVisibility(objectID, false);
    sgWorld.ProjectTree.SetVisibility(objectID, true);
  }

  getButton1Pressed(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return ControllerReader.controllerInfos[userIndex]?.button1Pressed ?? false;
      case ProgramMode.Desktop:
        return userIndex == 1 && DesktopInputManager.getLeftButtonPressed();
    }
    return false;
  }

  setButton1Pressed(userIndex: number, pressed: boolean) {
    switch (this.mode) {
      case ProgramMode.Device:
        ControllerReader.controllerInfos[1]!.button1Pressed = pressed;
        break;
      case ProgramMode.Desktop:
        DesktopInputManager.setLeftButtonPressed(pressed);
        break;
    }
  }

  getButton2Pressed(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return ControllerReader.controllerInfos[userIndex]?.button2Pressed ?? false;
      case ProgramMode.Desktop:
        return userIndex == 1 && DesktopInputManager.getRightButtonPressed();
    }
    return false;
  }

  getButton3Pressed(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return ControllerReader.controllerInfos[userIndex]?.triggerPressed ?? false;
      case ProgramMode.Desktop:
        return userIndex == 1 && DesktopInputManager.getMiddleButtonPressed();
    }
    return false;
  }

  getButton1(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return ControllerReader.controllerInfos[userIndex]?.button1 ?? false;
      case ProgramMode.Desktop:
        return userIndex == 1 && DesktopInputManager.getLeftButton();
    }
    return false;
  }

  getButton2(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return ControllerReader.controllerInfos[userIndex]?.button2 ?? false;
      case ProgramMode.Desktop:
        return userIndex == 1 && DesktopInputManager.getRightButton();
    }
    return false;
  }

  getButton3(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return ControllerReader.controllerInfos[userIndex]?.trigger ?? false;
      case ProgramMode.Desktop:
        return userIndex == 1 && DesktopInputManager.getMiddleButton();
    }
    return false;
  }

  getCursorPosition(userIndex: number) {
    switch (this.mode) {
      case ProgramMode.Device:
        return this.userModeManager!.getCollisionPosition(userIndex);
      case ProgramMode.Desktop:
        return userIndex == 1 ? DesktopInputManager.getCursorPosition() : undefined;
      default:
        throw new Error("Could not get cursor position without a program mode");
    }
  }

  Update() {
    switch (this.mode) {
      case ProgramMode.Device:
        ControllerReader.Update(); // Read controllers info
        break;
      case ProgramMode.Desktop:
        DesktopInputManager.Update();
        break;
    }
    this.uiManager?.Update();
    this.userModeManager?.Update();
    GetDeviceType();
  }

  Draw() {
    this.uiManager?.Draw();
    this.userModeManager?.Draw();
  }

  Init() {
    try {
      console.log("init:: " + new Date(Date.now()).toISOString());
      // Wait for managers to initialise on first frame
      const afterFirst = () => {
        console.log("do afterFirst")
        setComClientForcedInputMode();
        colourItemsOnStartup(); // color the items in the tree
        // was not working in collab mode so just doing every 5 seconds
        setInterval(()=> colourItemsOnStartup(), 5000); 
        sgWorld.AttachEvent("OnFrame", () => {
          const prev = ProgramManager.OneFrame;
          ProgramManager.OneFrame = () => { };
          ProgramManager.getInstance().setMode(ProgramMode.Desktop);
          if (ProgramManager.getInstance().getMode() == ProgramMode.Desktop) {
            roomToWorldCoordF = roomToWorldCoordD;
            worldToRoomCoordF = worldToRoomCoordD;
            prev();
            ProgramManager.OnFrame();
            Update();
            Draw();
            roomToWorldCoordF = roomToWorldCoordEx;
            worldToRoomCoordF = worldToRoomCoordEx;
          }
        });
        sgWorld.AttachEvent("OnSGWorld", (eventID, _eventParam) => {
          if (eventID == 14) {
            // This is the place were you need to read wand information and respond to it.
            ProgramManager.getInstance().setMode(ProgramMode.Device);
            if (ProgramManager.getInstance().getMode() == ProgramMode.Device) {
              Update();
              Draw();
              debugHandleRefreshGesture();
            }
          }
        });
        sgWorld.AttachEvent("OnCommandExecuted", (CommandID: string, parameters: any) => {
          console.log(CommandID + " " + JSON.stringify(parameters))
        });
        // TODO this was not working in collab mode. Needs more testing. May not work?
        // sgWorld.AttachEvent("OnProjectTreeAction", (CommandID: string, parameters: any) => {
        //   // if in collab mode make sure the models are coloured on the other machine
        //   if(this.colorItemsTimeout){
        //     clearTimeout(this.colorItemsTimeout);
        //   }
        //   this.colorItemsTimeout = setTimeout(() => {
        //     ()=> colourItemsOnStartup()
        //   }, 300);
        // });
      };
      const firstTableFrame = (eventID: number, _eventParam: unknown) => {
        if (eventID == 14) {
          this.userModeManager = new UserModeManager();
          this.uiManager = new UIManager();
          this.userModeManager?.Init();
          this.uiManager?.Init();
          sgWorld.DetachEvent("OnFrame", firstDesktopFrame);
          sgWorld.DetachEvent("OnSGWorld", firstTableFrame);
          afterFirst();
        }
      };
      const firstDesktopFrame = () => {
        this.userModeManager = new UserModeManager();
        this.uiManager = new UIManager();
        // TODO combine init and construct again
        this.userModeManager?.Init();
        this.uiManager?.Init();
        sgWorld.DetachEvent("OnFrame", firstDesktopFrame);
        sgWorld.DetachEvent("OnSGWorld", firstTableFrame);
        afterFirst();
      };
      sgWorld.AttachEvent("OnSGWorld", firstTableFrame);
      sgWorld.AttachEvent("OnFrame", firstDesktopFrame);
    } catch (e) {
      console.log("init error");
      console.log(e);
    }
  }
}

let recentProblems: number = 0;

function Update() {
  if (recentProblems == 0) {
    try {
      ProgramManager.getInstance().Update();
    } catch (e) {
      ++recentProblems;
      console.log("Update error");
      console.log(e);
      console.log("CallStack:\n" + debug.stacktrace(debug.info));
      setTimeout(() => {
        if (recentProblems > 0) {
          console.log(String(recentProblems) + " other problems");
          recentProblems = 0;
        }
      }, 5000);
    }
  } else {
    ++recentProblems;
    ProgramManager.getInstance().Update();
    --recentProblems;
  }
}

function Draw() {
  if (recentProblems == 0) {
    try {
      ProgramManager.getInstance().Draw();
    } catch (e) {
      ++recentProblems;
      console.log("Draw error");
      console.log(e);
      console.log("CallStack:\n" + debug.stacktrace(debug.info));
      setTimeout(() => {
        if (recentProblems > 0) {
          console.log(String(recentProblems) + " other problems");
          recentProblems = 0;
        }
      }, 5000);
    }
  } else {
    ++recentProblems;
    ProgramManager.getInstance().Draw();
    --recentProblems;
  }
}

function WorldGetPosition() {
  const pos = worldToRoomCoord(sgWorld.Navigate.GetPosition(3));
  return new Vector<3>([pos.X, pos.Y, pos.Altitude]);
}

function WorldSetPosition(v: Vector<3>) {
  const newPos = worldToRoomCoord(sgWorld.Navigate.GetPosition(3));
  newPos.X = v.data[0];
  newPos.Y = v.data[1];
  newPos.Altitude = v.data[2];
  sgWorld.Navigate.SetPosition(roomToWorldCoord(newPos));
}

export function WorldIncreasePosition(v: Vector<3>) {
  WorldSetPosition(v.Copy().Add(WorldGetPosition()));
}

export function WorldGetScale() {
  return sgWorld.Navigate.GetPosition(3).Altitude;
}

export function WorldGetOri() {
  const pos = worldToRoomCoord(sgWorld.Navigate.GetPosition(3));
  return Quaternion.FromYPR(pos.Yaw, pos.Pitch, pos.Roll);
}

export function deviceHeightOffset() {
  return 0.615;
}

export function MaxZoom() {
  // arbitrary limit to max zoom
  return 99999999999;
}

/**
 * Returns models by their ID
 * Optionally supply a model type for other items such as labels
 * @param {string} [oid]
 * @param {*} [objectType=ObjectType.OT_MODEL]
 * @return {*}  {(ITerrainModel | null)}
 */
 export function getItemById(oid?: string, objectType = ObjectTypeCode.OT_MODEL): ITerrainModel | ITerrainLabel |  ITerrainPolyline | null {
  try {
    if (oid !== undefined && oid != "") {
      const object = sgWorld.Creator.GetObject(oid);
      if (object && object.ObjectType === objectType) {
        return object as any;
      }
    }
  } catch (error) {
    return null;
  }
  return null;
}

function colourItemsOnStartup() {
  try {
    console.log("color items")
    var id = sgWorld.ProjectTree.GetNextItem(sgWorld.ProjectTree.RootID, ItemCode.ROOT);
    id = sgWorld.ProjectTree.GetNextItem(id, ItemCode.NEXT);
    traverseTree(id);
  } catch (error) {
    console.error("colourItemsOnStartup error")
    console.error(JSON.stringify(error))
  }
}

function traverseTree(current: string) {

  while (current) {
    var currentName = sgWorld.ProjectTree.GetItemName(current);
    if (sgWorld.ProjectTree.IsGroup(current)) {
      if (currentName.toLocaleLowerCase().indexOf("_red") > -1 || currentName.toLocaleLowerCase().indexOf("_green") > -1 
      || currentName.toLocaleLowerCase().indexOf("_blue") > -1 || currentName.toLocaleLowerCase().indexOf("_black") > -1) {
        const colName = currentName.split("_")[currentName.split("_").length - 1]
        colorItems(current, colName);
      }
      var child = sgWorld.ProjectTree.GetNextItem(current, ItemCode.CHILD);
      traverseTree(child);
    }
    current = sgWorld.ProjectTree.GetNextItem(current, ItemCode.NEXT);

  }

}

function colorItems(parentId: string, color: string) {
  try {
    // get the next item as this will be a parent
    let id = sgWorld.ProjectTree.GetNextItem(parentId, ItemCode.CHILD);
    while (id) {
      const name = sgWorld.ProjectTree.GetItemName(id);
      const obj = sgWorld.ProjectTree.GetObject(id);
      if (obj.ObjectType === ObjectTypeCode.OT_MODEL) {
        const model = obj as ITerrainModel;
        const col = ProgramManager.getInstance().userModeManager?.getColorFromString(color.toLocaleLowerCase());
        if (col) {
          model.Terrain.Tint = col;
        }
      }
      id = sgWorld.ProjectTree.GetNextItem(id, ItemCode.NEXT);
    }
  } catch (error) {
    console.error("colorItems error")
    console.error(JSON.stringify(error))
    // swallow it. There doesn't appear to be a way to tell if there is another 
    // item so it fails eventually when you do get next item
  }
}


